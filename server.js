const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// capture raw body for webhook verification
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhooks.json');

function ensureDataFile(file) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
}

app.post('/api/orders', (req, res) => {
  try {
    ensureDataFile(ORDERS_FILE);
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')) || [];
    orders.push(req.body);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save order', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    ensureDataFile(ORDERS_FILE);
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')) || [];
    res.json(orders);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// PayPal webhook receiver + optional verification
app.post('/api/paypal-webhook', async (req, res) => {
  try {
    ensureDataFile(WEBHOOKS_FILE);
    const event = req.body;
    const saved = JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8')) || [];

    // attempt verification if credentials provided
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
    const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
    const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || null;

    let verification = { verified: false, reason: 'not-attempted' };

    if (PAYPAL_CLIENT_ID && PAYPAL_SECRET && WEBHOOK_ID) {
      try {
        const base = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        // get access token
        const tokenRes = await fetch(base + '/v1/oauth2/token', {
          method: 'POST',
          headers: { 'Authorization': 'Basic ' + Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_SECRET).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials'
        });
        const tokenJson = await tokenRes.json();
        const accessToken = tokenJson.access_token;

        const verifyPayload = {
          auth_algo: req.headers['paypal-auth-algo'] || '',
          cert_url: req.headers['paypal-cert-url'] || '',
          transmission_id: req.headers['paypal-transmission-id'] || req.headers['paypal-transmission-id'.toLowerCase()] || '',
          transmission_sig: req.headers['paypal-transmission-sig'] || '',
          transmission_time: req.headers['paypal-transmission-time'] || '',
          webhook_id: WEBHOOK_ID,
          webhook_event: event
        };

        const verifyRes = await fetch(base + '/v1/notifications/verify-webhook-signature', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify(verifyPayload)
        });
        const verifyJson = await verifyRes.json();
        verification = { verified: verifyJson.verification_status === 'SUCCESS', details: verifyJson };
      } catch (err) {
        console.warn('PayPal verification failed', err);
        verification = { verified: false, reason: String(err) };
      }
    }

    saved.push({ receivedAt: new Date().toISOString(), event, verification });
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(saved, null, 2));

    res.json({ ok: true, verification });
  } catch (err) {
    console.error('Webhook handling error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/api/webhooks', (req, res) => {
  try {
    ensureDataFile(WEBHOOKS_FILE);
    const items = JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8')) || [];
    res.json(items);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/', (req, res) => res.send('IGLUXE orders API'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`IGLUXE server listening on ${PORT}`));
