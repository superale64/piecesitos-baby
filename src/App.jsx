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

  const onDeleteSale = async (id) => {
    if (confirm('¿Borrar registro de venta?')) {
      await fetch(`${API_URL}/api/sales/${id}`, { method: 'DELETE' });
      fetchSales();
      showToast('Venta eliminada', 'error');
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (e) {
      console.error("Error fetching inventory", e);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sales`);
      const data = await res.json();
      setSales(data);
    } catch (e) {
      console.error("Error fetching sales", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error("Error fetching products", e);
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
        textAlign: 'center',
        marginBottom: '20px',
        marginTop: '10px',
        background: 'var(--card-bg)',
        padding: '25px',
        borderRadius: '25px',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        border: '1px solid var(--border)'
      }}>
        <button onClick={toggleTheme} style={{
          position: 'absolute', right: '15px', top: '15px',
          background: 'var(--secondary-light)', padding: '8px',
          borderRadius: '50%', fontSize: '1.2rem', lineHeight: 1,
          border: 'none', cursor: 'pointer'
        }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <img
          src="/logo.png"
          alt="Piecesitos Baby Logo"
          style={{ width: '120px', height: 'auto', marginBottom: '10px' }}
        />
        <h1 style={{ fontSize: '1.5rem', letterSpacing: '1px', color: 'var(--primary)', marginBottom: '5px' }}>Piecesitos Baby</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '500' }}>Control de Ventas y Finanzas</p>
      </header>

      <main style={{ paddingBottom: '100px' }}>
        {activeTab === 'combos' && <ComboManager products={products} onSaleAdded={() => { fetchSales(); showToast('¡Venta realizada!'); }} />}
        {activeTab === 'history' && <SalesHistory sales={sales} onDelete={onDeleteSale} />}
        {activeTab === 'inventory' && <InventoryItems items={inventory} onRefresh={fetchInventory} showToast={showToast} />}
        {activeTab === 'settings' && <PricingSystem products={products} onRefresh={fetchProducts} showToast={showToast} />}
      </main>

      <nav className="bottom-nav">
        <a href="#" className={`nav-item ${activeTab === 'combos' ? 'active' : ''}`} onClick={() => setActiveTab('combos')}>
          <span className="nav-icon">🛍️</span>
          <span>Vender</span>
        </a>
        <a href="#" className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span className="nav-icon">💰</span>
          <span>Caja</span>
        </a>
        <a href="#" className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <span className="nav-icon">📦</span>
          <span>Stock</span>
        </a>
        <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span className="nav-icon">📊</span>
          <span>Excel</span>
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
    } catch (e) {
      alert('Error registrando venta');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '15px', fontSize: '1.2rem', paddingLeft: '5px' }}>Seleccionar Producto</h2>
      <div style={{ display: 'grid', gap: '15px' }}>
        {products.map(product => (
          <SaleCard key={product.id} product={product} onSell={(qty) => handleSale(product, qty)} />
        ))}
        {products.length === 0 && <p style={{ textAlign: 'center', margin: '40px 0', color: '#999' }}>Vaya a la pestaña Excel para configurar productos.</p>}
      </div>
    </div>
  );
}

function SaleCard({ product, onSell }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="glass-card animate-fade" style={{ background: 'var(--card-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{product.name}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
            Ganancia: <strong style={{ color: '#2D5A50' }}>${product.profit.toFixed(2)}</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>${product.sale_price.toFixed(2)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="sale-input"
          min="1"
        />
        <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={() => onSell(qty)}>
          Registrar Venta
        </button>
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
    showToast(editingId ? 'Producto actualizado' : 'Producto guardado');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Configuración Excel</h2>
        <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cerrar' : '+ Añadir'}
        </button>
      </div>

      {showForm && (
        <form className="glass-card" style={{ marginBottom: '25px', border: '1px solid var(--primary)' }} onSubmit={handleSubmit}>
          <div className="input-group"><label>Nombre del Combo</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group"><label>Cant. Pañales</label>
              <input type="number" value={formData.diapers} onChange={e => setFormData({ ...formData, diapers: e.target.value })} />
            </div>
            <div className="input-group"><label>Venta Real ($)</label>
              <input type="number" step="0.01" required value={formData.sale} onChange={e => setFormData({ ...formData, sale: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>{editingId ? 'Actualizar' : 'Guardar'}</button>
        </form>
      )}

      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table className="excel-table">
          <thead>
            <tr><th>Nombre</th><th>Costo</th><th>Venta</th><th>Ganancia</th><th></th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: '600' }}>{p.name}</td>
                <td>${((p.fabric_cost || 0) + (p.seamstress_cost || 0) + (p.packaging_cost || 0)).toFixed(2)}</td>
                <td style={{ color: 'var(--primary)', fontWeight: '700' }}>${(p.sale_price || 0).toFixed(2)}</td>
                <td style={{ color: '#2D5A50', fontWeight: '700' }}>${(p.profit || 0).toFixed(2)}</td>
                <td><button onClick={() => startEdit(p)}>✏️</button></td>
              </tr>
            ))}
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
    const msg = `👣 *Resumen de Venta Piecesitos Baby*%0A---------------------------%0A📦 *Producto:* ${sale.combo_type}%0A🔢 *Cantidad:* ${sale.quantity}%0A💰 *Venta:* $${sale.total_income.toFixed(2)}%0A📈 *Ganancia:* $${sale.total_profit.toFixed(2)}%0A📅 *Fecha:* ${new Date(sale.sale_date).toLocaleDateString()}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      <h2 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Resumen de Caja</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div className="glass-card" style={{ background: 'var(--card-bg)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Ingresos Brutos</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ background: 'var(--secondary-light)', textAlign: 'center', border: 'none' }}>
          <p style={{ fontSize: '0.75rem', color: '#2D5A50' }}>Utilidad Neta</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2D5A50' }}>${totalProfit.toFixed(2)}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '25px' }}>
        <h3 style={{ fontSize: '0.85rem', marginBottom: '15px', color: 'var(--text-light)', textAlign: 'center' }}>Flujo de Ganancias</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '80px', gap: '10px' }}>
          {chartSales.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: `${(s.total_profit / maxProfit) * 60 + 5}px`, background: 'var(--primary)', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-fade">
        <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Historial</h3>
        {sales.map(sale => (
          <div key={sale.id} className="history-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{sale.combo_type}</span>
                <span style={{ color: '#2D5A50', fontWeight: '700' }}>+${sale.total_profit.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
              <button onClick={() => sendWA(sale)} style={{ background: '#25D366', color: 'white', padding: '6px', borderRadius: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.012l-.582 2.128 2.184-.573c.678.371 1.426.566 2.115.567h.002c3.18 0 5.766-2.587 5.767-5.767 0-3.18-2.587-5.733-5.743-5.733zm3.431 8.169c-.131.368-.669.674-1.121.758-.453.084-2.193.303-4.148-1.442-1.956-1.745-2.227-3.414-2.311-3.866-.084-.453.111-.84.305-1.034.194-.194.43-.226.563-.226l.4-.01c.133 0 .285.003.424.288.139.285.474 1.157.514 1.24.041.082.02.179-.041.3-.061.121-.092.194-.184.288-.092.094-.184.22-.275.313-.092.094-.194.194-.092.368s.41 1.057 1.187 1.745c.776.688 1.432.906 1.636 1.01.204.103.326.082.449-.062.122-.144.531-.617.674-.823.143-.206.286-.175.47-.113.184.062 1.166.549 1.37.652.204.103.342.155.393.237.051.083.051.484-.08.852zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.016 21.6c-1.659 0-3.328-.43-4.783-1.241L3.6 21.2l.859-4.507c-.9-1.503-1.371-3.231-1.371-4.996 0-5.234 4.258-9.492 9.492-9.492s9.492 4.258 9.492 9.492c.001 5.233-4.256 9.492-9.456 9.492z" /></svg>
              </button>
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
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', quantity: '', cost: '', sale: '', image: null, category: 'General' });

  const filteredItems = items.filter(i => i.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('product_name', formData.name);
    data.append('quantity', formData.quantity);
    data.append('cost_price', formData.cost);
    data.append('sale_price', formData.sale);
    data.append('category', formData.category);
    if (formData.image) data.append('image', formData.image);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/inventory/${editingId}` : `${API_URL}/api/inventory`;
    await fetch(url, { method, body: data });
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', quantity: '', cost: '', sale: '', image: null, category: 'General' });
    onRefresh();
    showToast('Inventario actualizado');
  };

  const getStockClass = (q) => {
    if (q <= 2) return 'stock-critical';
    if (q <= 5) return 'stock-warning';
    return 'stock-ok';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Galería y Stock</h2>
        <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cerrar' : '+ Nuevo'}
        </button>
      </div>

      <div className="search-wrapper">
        <input
          className="search-input"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <form className="glass-card animate-fade" style={{ marginBottom: '25px', border: '1px solid var(--secondary)' }} onSubmit={handleSubmit}>
          <div className="input-group"><label>Nombre</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="input-group"><label>Stock Inicial</label>
            <input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>Guardar en Stock</button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredItems.map(item => (
          <div key={item.id} className="card animate-fade" style={{ display: 'flex', alignItems: 'center', padding: '12px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#f5f5f5', overflow: 'hidden', marginRight: '15px' }}>
              {item.image_url ? <img src={`${API_URL}${item.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>{item.product_name}</h4>
              <span className={`stock-badge ${getStockClass(item.quantity)}`}>
                Stock: {item.quantity}
              </span>
            </div>
            <button onClick={() => {
              setEditingId(item.id);
              setFormData({ name: item.product_name, quantity: item.quantity, cost: item.cost_price, sale: item.sale_price, category: item.category, image: null });
              setShowForm(true);
            }} style={{ background: 'none', padding: '8px' }}>✏️</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
