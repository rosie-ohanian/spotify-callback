let storedCode = null;
let codeTimestamp = null;

export default function handler(req, res) {
    if (req.method === 'GET' && req.url.includes('/api/callback')) {
        const code = req.query.code;
        if (code) {
            storedCode = code;
            codeTimestamp = Date.now();
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send('<html><body><h2>Logged in! You can close this tab.</h2></body></html>');
        }
    } else if (req.method === 'GET' && req.url.includes('/api/getcode')) {
        if (storedCode && Date.now() - codeTimestamp < 60000) {
            const code = storedCode;
            storedCode = null;
            res.status(200).json({ code });
        } else {
            res.status(404).json({ code: null });
        }
    }
}
