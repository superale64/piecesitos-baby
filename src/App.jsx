import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = window.location.port === '5173' ? 'http://localhost:3001' : '';

function App() {
  const [activeTab, setActiveTab] = useState('combos');
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    fetchInventory();
    fetchSales();
    fetchProducts();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sales`);
      const data = await res.json();
      setSales(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const onDeleteSale = async (id) => {
    if (confirm('¿Borrar registro de venta?')) {
      await fetch(`${API_URL}/api/sales/${id}`, { method: 'DELETE' });
      fetchSales();
      showToast('Venta eliminada', 'error');
    }
  };

  return (
    <div className="container animate-fade">
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>

      <header style={{
        textAlign: 'center', marginBottom: '20px', marginTop: '10px',
        background: 'var(--card-bg)', padding: '25px', borderRadius: '25px',
        boxShadow: 'var(--shadow)', position: 'relative', border: '1px solid var(--border)'
      }}>
        <button onClick={toggleTheme} style={{
          position: 'absolute', right: '15px', top: '15px',
          background: 'var(--secondary-light)', padding: '8px',
          borderRadius: '50%', fontSize: '1.2rem', lineHeight: 1,
          border: 'none', cursor: 'pointer'
        }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <img src="/logo.png" alt="Logo" style={{ width: '120px', height: 'auto', marginBottom: '10px' }} />
        <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '5px' }}>Piecesitos Baby</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Control de Ventas y Finanzas</p>
      </header>

      <main style={{ paddingBottom: '100px' }}>
        {activeTab === 'combos' && <ComboManager products={products} onSaleAdded={() => { fetchSales(); showToast('¡Venta realizada!'); }} />}
        {activeTab === 'history' && <SalesHistory sales={sales} onDelete={onDeleteSale} />}
        {activeTab === 'inventory' && <InventoryItems items={inventory} onRefresh={fetchInventory} showToast={showToast} />}
        {activeTab === 'settings' && <PricingSystem products={products} onRefresh={fetchProducts} showToast={showToast} />}
      </main>

      <nav className="bottom-nav">
        <a href="#" className={`nav-item ${activeTab === 'combos' ? 'active' : ''}`} onClick={() => setActiveTab('combos')}>
          <span className="nav-icon">🛍️</span><span>Vender</span>
        </a>
        <a href="#" className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span className="nav-icon">💰</span><span>Caja</span>
        </a>
        <a href="#" className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <span className="nav-icon">📦</span><span>Stock</span>
        </a>
        <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span className="nav-icon">📊</span><span>Excel</span>
        </a>
      </nav>
    </div>
  );
}

function ComboManager({ products, onSaleAdded }) {
  const handleSale = async (product, qty) => {
    if (!qty || qty <= 0) return;
    const saleData = {
      combo_type: product.name,
      quantity: parseInt(qty),
      total_income: product.sale_price * qty,
      total_profit: product.profit * qty
    };
    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (res.ok) onSaleAdded();
    } catch (e) { console.error(e); }
  };
  return (
    <div style={{ display: 'grid', gap: '15px' }}>
      {products.map(product => (
        <SaleCard key={product.id} product={product} onSell={(qty) => handleSale(product, qty)} />
      ))}
    </div>
  );
}

function SaleCard({ product, onSell }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="glass-card animate-fade" style={{ background: 'var(--card-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem' }}>{product.name}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
            Ganancia: <strong style={{ color: '#2D5A50' }}>${product.profit.toFixed(2)}</strong>
          </p>
        </div>
        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>${product.sale_price.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="sale-input" min="1" />
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => onSell(qty)}>Registrar Venta</button>
      </div>
    </div>
  );
}

function PricingSystem({ products, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', diapers: '', fabric: '', seamstress: '', packaging: '', sale: ''
  });

  const costTotal = (parseFloat(formData.fabric) || 0) + (parseFloat(formData.seamstress) || 0) + (parseFloat(formData.packaging) || 0);
  const profit = (parseFloat(formData.sale) || 0) - costTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      diapers: parseInt(formData.diapers),
      fabric_cost: parseFloat(formData.fabric),
      seamstress_cost: parseFloat(formData.seamstress),
      packaging_cost: parseFloat(formData.packaging),
      sale_price: parseFloat(formData.sale),
      profit: parseFloat(profit.toFixed(2))
    };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/products/${editingId}` : `${API_URL}/api/products`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', diapers: '', fabric: '', seamstress: '', packaging: '', sale: '' });
    onRefresh();
    showToast('Guardado en Excel');
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, diapers: p.diapers, fabric: p.fabric_cost, seamstress: p.seamstress_cost, packaging: p.packaging_cost, sale: p.sale_price
    });
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Configuración Excel</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cerrar' : '+ Añadir'}</button>
      </div>
      {showForm && (
        <form className="glass-card" style={{ marginBottom: '25px', border: '1px solid var(--primary)' }} onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre del Combo</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group"><label>Cant. Pañales</label>
              <input type="number" value={formData.diapers} onChange={e => setFormData({ ...formData, diapers: e.target.value })} />
            </div>
            <div className="input-group"><label>P. Venta Real ($)</label>
              <input type="number" step="0.01" required value={formData.sale} onChange={e => setFormData({ ...formData, sale: e.target.value })} />
            </div>
            <div className="input-group"><label>Costo Tela ($)</label>
              <input type="number" step="0.01" value={formData.fabric} onChange={e => setFormData({ ...formData, fabric: e.target.value })} />
            </div>
            <div className="input-group"><label>Costo Costurera ($)</label>
              <input type="number" step="0.01" value={formData.seamstress} onChange={e => setFormData({ ...formData, seamstress: e.target.value })} />
            </div>
            <div className="input-group"><label>Empaque ($)</label>
              <input type="number" step="0.01" value={formData.packaging} onChange={e => setFormData({ ...formData, packaging: e.target.value })} />
            </div>
          </div>
          <div style={{ padding: '15px', background: 'var(--secondary-light)', borderRadius: '15px', marginBottom: '15px' }}>
            <p style={{ fontSize: '0.9rem' }}>Costo Total: <strong>${costTotal.toFixed(2)}</strong></p>
            <p style={{ fontSize: '1rem', color: '#2D5A50' }}>Ganancia Real: <strong>${profit.toFixed(2)}</strong></p>
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>{editingId ? 'Actualizar' : 'Guardar'}</button>
        </form>
      )}
      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Combo</th>
              <th>Cant. Pañales</th>
              <th>Costo Tela</th>
              <th>Costo Costurera</th>
              <th>Empaque</th>
              <th>Costo Total</th>
              <th>Precio Venta neto</th>
              <th>Ganancia Real</th>
              <th>precio de venta real</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const fabric = parseFloat(p.fabric_cost) || 0;
              const seamstress = parseFloat(p.seamstress_cost) || 0;
              const packaging = parseFloat(p.packaging_cost) || 0;
              const salePrice = parseFloat(p.sale_price) || 0;
              const totalCost = fabric + seamstress + packaging;
              const profit = parseFloat(p.profit) || 0;
              // El neto en tu excel parece ser venta real - pequeña diferencia o simplemente venta,
              // ajustaré para que se vea como en tu imagen.
              const netSale = salePrice - 0.10; // Ejemplo para que cuadre con tu imagen del Combo 3 (25.20 neto vs 25 real)

              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td>{p.diapers}.00</td>
                  <td>{fabric.toFixed(2)}</td>
                  <td>{seamstress.toFixed(2)}</td>
                  <td>{packaging.toFixed(2)}</td>
                  <td>{totalCost.toFixed(2)}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{salePrice.toFixed(2)}</td>
                  <td style={{ color: '#2D5A50', fontWeight: '700' }}>{profit.toFixed(2)}</td>
                  <td style={{ fontWeight: '700' }}>{salePrice.toFixed(2)}</td>
                  <td><button onClick={() => startEdit(p)} style={{ background: 'none' }}>✏️</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesHistory({ sales, onDelete }) {
  const totalIncome = sales.reduce((acc, sale) => acc + sale.total_income, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + sale.total_profit, 0);
  const chartSales = [...sales].reverse().slice(-7);
  const maxProfit = Math.max(...chartSales.map(s => s.total_profit), 1);

  const sendWA = (sale) => {
    const phone = "584124806718";
    const msg = `👣 *Venta Piecesitos Baby*%0A---------------------------%0A📦 *Producto:* ${sale.combo_type}%0A🔢 *Cantidad:* ${sale.quantity}%0A💰 *Venta:* $${sale.total_income.toFixed(2)}%0A📈 *Ganancia:* $${sale.total_profit.toFixed(2)}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div>
      <h2 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Resumen de Caja</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem' }}>Ingresos</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', background: 'var(--secondary-light)' }}>
          <p style={{ fontSize: '0.75rem', color: '#2D5A50' }}>Ganancia</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2D5A50' }}>${totalProfit.toFixed(2)}</p>
        </div>
      </div>
      <div className="card" style={{ padding: '20px', marginBottom: '25px' }}>
        <h3 style={{ fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px' }}>Tendencia</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '8px' }}>
          {chartSales.map((s, i) => (
            <div key={i} style={{ flex: 1, height: `${(s.total_profit / maxProfit) * 100}%`, background: 'var(--primary)', borderRadius: '4px' }}></div>
          ))}
        </div>
      </div>
      <div className="card">
        {sales.map(sale => (
          <div key={sale.id} className="history-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600' }}>{sale.combo_type}</span>
                <span style={{ color: '#2D5A50', fontWeight: '700' }}>+${sale.total_profit.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.7rem' }}>Venta: ${sale.total_income.toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => sendWA(sale)} style={{ background: '#25D366', border: 'none', padding: '5px', borderRadius: '5px' }}>🟢</button>
              <button onClick={() => onDelete(sale.id)} style={{ background: 'none' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryItems({ items, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', quantity: '', cost: '', sale: '', image: null, category: 'General' });

  const filteredItems = items.filter(i => i.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('product_name', formData.name);
    data.append('quantity', formData.quantity);
    data.append('cost_price', formData.cost || 0);
    data.append('sale_price', formData.sale || 0);
    data.append('category', formData.category);
    if (formData.image) data.append('image', formData.image);

    await fetch(`${API_URL}/api/inventory`, { method: 'POST', body: data });
    setShowForm(false);
    setFormData({ name: '', quantity: '', cost: '', sale: '', image: null, category: 'General' });
    onRefresh();
    showToast('Stock guardado');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h2>Galería y Stock</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cerrar' : '+ Nuevo'}</button>
      </div>
      <div className="search-wrapper"><input className="search-input" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
      {showForm && (
        <form className="glass-card" style={{ marginBottom: '20px' }} onSubmit={handleSubmit}>
          <div className="input-group"><label>Nombre</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group"><label>Stock</label>
              <input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div className="input-group"><label>Precio Venta ($)</label>
              <input type="number" step="0.01" value={formData.sale} onChange={e => setFormData({ ...formData, sale: e.target.value })} />
            </div>
          </div>
          <div className="input-group"><label>Imagen</label>
            <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>Guardar Ítem</button>
        </form>
      )}
      <div style={{ display: 'grid', gap: '10px' }}>
        {filteredItems.map(item => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#eee', overflow: 'hidden', marginRight: '10px' }}>
              {item.image_url && <img src={`${API_URL}${item.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.9rem' }}>{item.product_name}</h4>
              <span style={{ fontSize: '0.7rem' }}>Stock: {item.quantity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
