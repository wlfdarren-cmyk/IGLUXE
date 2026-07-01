const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

app.post('/api/orders', (req, res) => {
  try {
    ensureDataFile();
    const orders = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || [];
    orders.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save order', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    ensureDataFile();
    const orders = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || [];
    res.json(orders);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/', (req, res) => res.send('IGLUXE orders API'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`IGLUXE server listening on ${PORT}`));
