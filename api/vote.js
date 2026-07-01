const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

module.exports = async (req, res) => {
    // Enable CORS for Vercel Serverless Function
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { menu } = req.body;
        
        if (!menu) {
            return res.status(400).json({ error: 'Menu selection is required' });
        }

        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        let key = process.env.GOOGLE_PRIVATE_KEY;
        
        if (!email || !key) {
            return res.status(500).json({ error: 'Server configuration error: Missing Google Credentials' });
        }

        // Handle private key newlines correctly when passed via Vercel env vars
        key = key.replace(/\\n/g, '\n');

        // Initialize auth
        const serviceAccountAuth = new JWT({
            email: email,
            key: key,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });

        // The sheet ID extracted from your Google Sheet URL
        const sheetId = '1WTX2gDvEZCMXJ7jATo3qVphmdb3-4_H-lm2jpdgWLcQ';
        const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
        
        // Load document properties and worksheets
        await doc.loadInfo(); 
        
        // Use the first sheet (index 0)
        const sheet = doc.sheetsByIndex[0]; 
        
        // Append a row with timestamp, menu, and a default voter placeholder
        const timestamp = new Date().toISOString();
        await sheet.addRow({
            'timestamp': timestamp,
            'menu': menu,
            'voter': 'Anonymous'
        });

        res.status(200).json({ success: true, message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
};
