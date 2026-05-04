import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    if (url.pathname === '/api/callback') {
        const code = url.searchParams.get('code');
        if (code) {
            await kv.set('spotify_code', code, { ex: 60 }); // expires in 60s
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send('<html><body><h2>Logged in! You can close this tab.</h2></body></html>');
        } else {
            res.status(400).send('No code');
        }
    } else if (url.pathname === '/api/getcode') {
        const code = await kv.get('spotify_code');
        if (code) {
            await kv.del('spotify_code');
            res.status(200).json({ code });
        } else {
            res.status(404).json({ code: null });
        }
    }
}
