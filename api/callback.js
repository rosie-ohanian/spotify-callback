const JSONBIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);

    // 🎧 CALLBACK FROM Spotify login
    if (url.pathname === '/api/callback') {
        const code = url.searchParams.get('code');
        if (!code) return res.status(400).send('Missing code');

        try {
            const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: REDIRECT_URI
                })
            });

            const tokenData = await tokenRes.json();
            if (!tokenData.access_token) {
                console.error(tokenData);
                return res.status(500).send('Token exchange failed');
            }

            await saveTokens(tokenData.access_token, tokenData.refresh_token);

            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(`
                <html>
                    <body style="font-family:sans-serif;text-align:center;margin-top:60px;">
                        <h2>✅ Logged in successfully</h2>
                        <p>You can return to your VR headset now.</p>
                    </body>
                </html>
            `);
        } catch (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
    }

    // 🎮 UNITY POLLS THIS ENDPOINT
    else if (url.pathname === '/api/gettoken') {
        try {
            const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_KEY }
            });
            const data = await r.json();
            const { access_token, refresh_token, time } = data.record;

            // token still valid (under 50 mins old)
            if (access_token && Date.now() - time < 3000000) {
                return res.status(200).json({ access_token });
            }

            // token expired, try to refresh
            if (!refresh_token) {
                return res.status(404).json({ access_token: null });
            }

            console.log('Token expired, refreshing...');
            const refreshRes = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token
                })
            });

            const refreshData = await refreshRes.json();
            if (!refreshData.access_token) {
                console.error(refreshData);
                return res.status(500).json({ access_token: null });
            }

            await saveTokens(
                refreshData.access_token,
                refreshData.refresh_token || refresh_token
            );

            return res.status(200).json({ access_token: refreshData.access_token });

        } catch (err) {
            console.error(err);
            return res.status(500).send('Error fetching token');
        }
    }

    else {
        return res.status(404).send('Not found');
    }
}

async function saveTokens(access_token, refresh_token) {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_KEY
        },
        body: JSON.stringify({
            access_token,
            refresh_token,
            time: Date.now()
        })
    });
}
