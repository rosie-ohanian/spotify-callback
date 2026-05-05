const JSONBIN_ID = '69f93206aaba8821977008ae';
const JSONBIN_KEY = '$2a$10$k7TCXMgdUva3oU2LSkNO4ObqYH37XATBdLgzuqU75Ddzfg55zVbMu';

export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    if (url.pathname === '/api/callback') {
        const code = url.searchParams.get('code');
        if (code) {
            await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
                body: JSON.stringify({ code, time: Date.now() })
            });
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send('<html><body><h2>Logged in! Go back to your headset.</h2></body></html>');
        }
    } else if (url.pathname === '/api/getcode') {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        const data = await r.json();
        const { code, time } = data.record;
        
        if (code && Date.now() - time < 60000) {
            await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
                body: JSON.stringify({ code: '', time: 0 })
            });
            res.status(200).json({ code });
        } else {
            res.status(404).json({ code: null });
        }
    }
}
