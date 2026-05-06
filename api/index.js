const CLIENT_ID = process.env.CLIENT_ID;
                    method: 'POST',
                    headers: {
                        'Authorization':
                            'Basic ' +
                            Buffer.from(
                                CLIENT_ID + ':' + CLIENT_SECRET
                            ).toString('base64'),
                        'Content-Type':
                            'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: REDIRECT_URI
                    })
                }
            );

            const tokenData = await tokenRes.json();

            if (!tokenData.access_token) {
                console.error(tokenData);
                return res.status(500).send('Token exchange failed');
            }

            sessions.set(sessionId, {
                created: Date.now(),
                token: tokenData.access_token,
                refresh: tokenData.refresh_token
            });

            return res.status(200).send(`
                <html>
                    <body style="font-family:sans-serif;text-align:center;margin-top:60px;">
                        <h2>✅ Spotify Connected</h2>
                        <p>You can return to VR now.</p>
                    </body>
                </html>
            `);

        } catch (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
    }

    // ---------------- SESSION STATUS ----------------

    if (url.pathname === '/api/session-status') {
        const sessionId = url.searchParams.get('sessionId');

        if (!sessionId || !sessions.has(sessionId)) {
            return res.status(404).json({ status: 'invalid' });
        }

        const session = sessions.get(sessionId);

        if (!session.token) {
            return res.status(200).json({ status: 'waiting' });
        }

        return res.status(200).json({
            status: 'ready',
            access_token: session.token
        });
    }

    return res.status(404).send('Not found');
}
