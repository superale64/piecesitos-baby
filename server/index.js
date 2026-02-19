import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (isProd) {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// Multer setup
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

// --- PRODUCTS (EXCEL) ---
app.get('/api/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post('/api/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .insert([req.body])
        .select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

app.put('/api/products/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .update(req.body)
        .eq('id', req.params.id)
        .select();
    if (error) return res.status(500).json(error);
    res.json({ status: 'ok', data: data[0] });
});

app.delete('/api/products/:id', async (req, res) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json({ status: 'ok' });
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post('/api/inventory', upload.single('image'), async (req, res) => {
    const { product_name, category, quantity, cost_price, sale_price } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const { data, error } = await supabase
        .from('inventory')
        .insert([{ product_name, category, quantity, cost_price, sale_price, image_url }])
        .select();

    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

app.put('/api/inventory/:id', upload.single('image'), async (req, res) => {
    const { product_name, category, quantity, cost_price, sale_price } = req.body;
    let image_url = req.body.image_url;
    if (req.file) image_url = `/uploads/${req.file.filename}`;

    const { data, error } = await supabase
        .from('inventory')
        .update({ product_name, category, quantity, cost_price, sale_price, image_url })
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json(error);
    res.json({ status: 'ok', image_url });
});

app.delete('/api/inventory/:id', async (req, res) => {
    const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json({ status: 'ok' });
});

// --- SALES (CAJA) ---
app.get('/api/sales', async (req, res) => {
    const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.post('/api/sales', async (req, res) => {
    const { data, error } = await supabase
        .from('sales')
        .insert([req.body])
        .select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

app.delete('/api/sales/:id', async (req, res) => {
    const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with Supabase`);
});

process.on('uncaughtException', (err) => {
    console.error('SERVER CRASHED:', err);
});
