import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Database setup
const db = new Database('piecesitos.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS fabrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_per_meter REAL,
    stock_meters REAL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    cost_price REAL,
    sale_price REAL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    diapers INTEGER DEFAULT 0,
    fabric_cost REAL DEFAULT 0,
    seamstress_cost REAL DEFAULT 0,
    packaging_cost REAL DEFAULT 0,
    sale_price REAL NOT NULL,
    profit REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    combo_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_income REAL,
    total_profit REAL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// En producción, servir los archivos de la web construida
if (isProd) {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


// API Routes
app.get('/api/fabrics', (req, res) => {
    const fabrics = db.prepare('SELECT * FROM fabrics ORDER BY created_at DESC').all();
    res.json(fabrics);
});

app.post('/api/fabrics', upload.single('image'), (req, res) => {
    const { name, description, price_per_meter, stock_meters } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const info = db.prepare('INSERT INTO fabrics (name, description, price_per_meter, stock_meters, image_url) VALUES (?, ?, ?, ?, ?)')
        .run(name, description, price_per_meter, stock_meters, image_url);

    res.json({ id: info.lastInsertRowid, image_url });
});

app.get('/api/inventory', (req, res) => {
    const items = db.prepare('SELECT * FROM inventory ORDER BY created_at DESC').all();
    res.json(items);
});

app.post('/api/inventory', upload.single('image'), (req, res) => {
    const { product_name, category, quantity, cost_price, sale_price } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const info = db.prepare('INSERT INTO inventory (product_name, category, quantity, cost_price, sale_price, image_url) VALUES (?, ?, ?, ?, ?, ?)')
        .run(product_name, category, quantity, cost_price, sale_price, image_url);

    res.json({ id: info.lastInsertRowid, image_url });
});

app.put('/api/inventory/:id', upload.single('image'), (req, res) => {
    const { product_name, category, quantity, cost_price, sale_price } = req.body;
    let image_url = req.body.image_url;
    if (req.file) image_url = `/uploads/${req.file.filename}`;

    db.prepare('UPDATE inventory SET product_name = ?, category = ?, quantity = ?, cost_price = ?, sale_price = ?, image_url = ? WHERE id = ?')
        .run(product_name, category, quantity, cost_price, sale_price, image_url, req.params.id);

    res.json({ status: 'ok', image_url });
});

app.delete('/api/inventory/:id', (req, res) => {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
});

app.delete('/api/sales/:id', (req, res) => {
    db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
});

app.get('/api/sales', (req, res) => {
    const sales = db.prepare('SELECT * FROM sales ORDER BY sale_date DESC').all();
    res.json(sales);
});

app.post('/api/sales', (req, res) => {
    const { combo_type, quantity, total_income, total_profit } = req.body;
    const info = db.prepare('INSERT INTO sales (combo_type, quantity, total_income, total_profit) VALUES (?, ?, ?, ?)')
        .run(combo_type, quantity, total_income, total_profit);
    res.json({ id: info.lastInsertRowid });
});

app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at ASC').all();
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const { name, diapers, fabric_cost, seamstress_cost, packaging_cost, sale_price, profit } = req.body;
    const info = db.prepare('INSERT INTO products (name, diapers, fabric_cost, seamstress_cost, packaging_cost, sale_price, profit) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(name, diapers, fabric_cost, seamstress_cost, packaging_cost, sale_price, profit);
    res.json({ id: info.lastInsertRowid });
});

app.put('/api/products/:id', (req, res) => {
    const { name, diapers, fabric_cost, seamstress_cost, packaging_cost, sale_price, profit } = req.body;
    db.prepare('UPDATE products SET name = ?, diapers = ?, fabric_cost = ?, seamstress_cost = ?, packaging_cost = ?, sale_price = ?, profit = ? WHERE id = ?')
        .run(name, diapers, fabric_cost, seamstress_cost, packaging_cost, sale_price, profit, req.params.id);
    res.json({ status: 'ok' });
});

app.delete('/api/products/:id', (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ status: 'ok' });
});

// Seed initial products if none exist
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
if (productCount === 0) {
    const seedProducts = [
        { name: 'Combo 1', diapers: 4, fabric: 3.50, seamstress: 1.00, packaging: 0.90, sale: 10.00, profit: 4.60 },
        { name: 'Combo 2', diapers: 6, fabric: 3.50, seamstress: 1.50, packaging: 0.90, sale: 13.00, profit: 7.10 },
        { name: 'Combo 3', diapers: 12, fabric: 3.50, seamstress: 3.00, packaging: 1.20, sale: 25.00, profit: 17.30 }
    ];
    const stmt = db.prepare('INSERT INTO products (name, diapers, fabric_cost, seamstress_cost, packaging_cost, sale_price, profit) VALUES (?, ?, ?, ?, ?, ?, ?)');
    seedProducts.forEach(p => stmt.run(p.name, p.diapers, p.fabric, p.seamstress, p.packaging, p.sale, p.profit));
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('SERVER CRASHED (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('SERVER CRASHED (Unhandled Rejection):', reason);
});

// Force event loop to stay active
setInterval(() => { }, 1000000);
