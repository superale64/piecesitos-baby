import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = window.location.port === '5173' ? 'http://localhost:3001' : '';

function App() {
  const [activeTab, setActiveTab] = useState('combos');
  const [fabrics, setFabrics] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchFabrics();
    fetchInventory();
    fetchSales();
    fetchProducts();
  }, []);

  const onDeleteSale = async (id) => {
    if (confirm('¿Borrar registro de venta?')) {
      await fetch(`${API_URL}/api/sales/${id}`, { method: 'DELETE' });
      fetchSales();
    }
  };

  const fetchFabrics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/fabrics`);
      const data = await res.json();
      setFabrics(data);
    } catch (e) {
      console.error("Error fetching fabrics", e);
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
      <header style={{
        textAlign: 'center',
        marginBottom: '20px',
        marginTop: '10px',
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        padding: '20px',
        borderRadius: '25px',
        color: 'white',
        boxShadow: '0 10px 20px rgba(255, 183, 197, 0.3)'
      }}>
        <h1 style={{ fontSize: '1.8rem', letterSpacing: '1px' }}>Piecesitos Baby</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Control de Ventas y Finanzas</p>
      </header>

      <main style={{ paddingBottom: '100px' }}>
        {activeTab === 'combos' && <ComboManager products={products} onSaleAdded={fetchSales} />}
        {activeTab === 'history' && <SalesHistory sales={sales} onDelete={onDeleteSale} />}
        {activeTab === 'inventory' && <InventoryItems items={inventory} onRefresh={fetchInventory} />}
        {activeTab === 'settings' && <PricingSystem products={products} onRefresh={fetchProducts} />}
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
      if (res.ok) {
        onSaleAdded();
      }
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
    <div className="glass-card animate-fade" style={{ background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{product.name}</h3>
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

function PricingSystem({ products, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', diapers: '', fabric: '', seamstress: '', packaging: '', sale: ''
  });

  const costTotal = (parseFloat(formData.fabric) || 0) + (parseFloat(formData.seamstress) || 0) + (parseFloat(formData.packaging) || 0);
  const profit = (parseFloat(formData.sale) || 0) - costTotal;

  const startEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name, diapers: p.diapers, fabric: p.fabric_cost, seamstress: p.seamstress_cost, packaging: p.packaging_cost, sale: p.sale_price
    });
    setShowForm(true);
  };

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

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', diapers: '', fabric: '', seamstress: '', packaging: '', sale: '' });
        onRefresh();
        alert('Cambios guardados correctamente');
      } else {
        const errorData = await res.json();
        alert('Error al guardar: ' + (errorData.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error("Error submitting form", error);
      alert('Error de conexión con el servidor');
    }
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
          <div className="input-group">
            <label>Nombre del Combo / Producto</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Combo 1" />
          </div>
          <div className="input-group">
            <label>Cant. Pañales</label>
            <input type="number" value={formData.diapers} onChange={e => setFormData({ ...formData, diapers: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group"><label>Costo Tela ($)</label>
              <input type="number" step="0.01" value={formData.fabric} onChange={e => setFormData({ ...formData, fabric: e.target.value })} />
            </div>
            <div className="input-group"><label>Costo Costurera ($)</label>
              <input type="number" step="0.01" value={formData.seamstress} onChange={e => setFormData({ ...formData, seamstress: e.target.value })} />
            </div>
            <div className="input-group"><label>Empaque ($)</label>
              <input type="number" step="0.01" value={formData.packaging} onChange={e => setFormData({ ...formData, packaging: e.target.value })} />
            </div>
            <div className="input-group"><label>Precio Venta Real ($)</label>
              <input type="number" step="0.01" required value={formData.sale} onChange={e => setFormData({ ...formData, sale: e.target.value })} />
            </div>
          </div>
          <div style={{ padding: '15px', background: 'var(--secondary-light)', borderRadius: '15px', marginTop: '10px' }}>
            <p style={{ fontSize: '0.9rem' }}>Costo Total: <strong>${costTotal.toFixed(2)}</strong></p>
            <p style={{ fontSize: '1rem', color: '#2D5A50' }}>Ganancia Real: <strong>${profit.toFixed(2)}</strong></p>
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>{editingId ? 'Actualizar' : 'Guardar'}</button>
        </form>
      )}

      <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Combo</th>
              <th>Cant.</th>
              <th>Total Costo</th>
              <th>P. Venta</th>
              <th>Ganancia</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: '600' }}>{p.name}</td>
                <td>{p.diapers}</td>
                <td>${((p.fabric_cost || 0) + (p.seamstress_cost || 0) + (p.packaging_cost || 0)).toFixed(2)}</td>
                <td style={{ color: 'var(--primary)', fontWeight: '700' }}>${(p.sale_price || 0).toFixed(2)}</td>
                <td style={{ color: '#2D5A50', fontWeight: '700' }}>${(p.profit || 0).toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => startEdit(p)} style={{ padding: '5px', background: 'none', border: '1px solid #ddd', fontSize: '12px' }}>✏️</button>
                    <button onClick={async () => { if (confirm('Borrar?')) { await fetch(`${API_URL}/api/products/${p.id}`, { method: 'DELETE' }); onRefresh(); } }} style={{ padding: '5px', background: 'none', border: '1px solid #ddd', fontSize: '12px' }}>🗑️</button>
                  </div>
                </td>
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

  return (
    <div style={{ paddingBottom: '20px' }}>
      <h2 style={{ marginBottom: '15px', fontSize: '1.2rem' }}>Resumen de Caja</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div className="glass-card" style={{ background: 'white', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '5px' }}>Ingresos Brutos</p>
          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text)' }}>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ background: 'var(--secondary-light)', textAlign: 'center', border: 'none' }}>
          <p style={{ fontSize: '0.75rem', color: '#2D5A50', marginBottom: '5px' }}>Utilidad Neta</p>
          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2D5A50' }}>${totalProfit.toFixed(2)}</p>
        </div>
      </div>

      <div className="card animate-fade">
        <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Últimas Operaciones</h3>
        {sales.map(sale => (
          <div key={sale.id} className="history-item" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '30px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{sale.combo_type}</span>
              <span style={{ color: '#2D5A50', fontWeight: '700' }}>+${sale.total_profit.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px', paddingRight: '30px' }}>
              <span>Venta: ${sale.total_income.toFixed(2)} | Cant: {sale.quantity}</span>
              <span>{new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sale.sale_date).toLocaleDateString()}</span>
            </div>
            <button
              onClick={() => onDelete(sale.id)}
              style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                background: 'none', fontSize: '14px', padding: '5px'
              }}
            >🗑️</button>
          </div>
        ))}
        {sales.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No hay ventas registradas.</p>}
      </div>
    </div>
  );
}

function InventoryItems({ items, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', quantity: '', cost: '', sale: '', image: null, category: 'General'
  });

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
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.product_name, quantity: item.quantity, cost: item.cost_price, sale: item.sale_price, category: item.category, image: null
    });
    setShowForm(true);
  };

  const deleteItem = async (id) => {
    if (confirm('¿Eliminar de stock?')) {
      await fetch(`${API_URL}/api/inventory/${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Galería y Stock</h2>
        <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cerrar' : '+ Nuevo Ítem'}
        </button>
      </div>

      {showForm && (
        <form className="glass-card animate-fade" style={{ marginBottom: '25px', border: '1px solid var(--secondary)' }} onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre del Producto</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group"><label>Cantidad</label>
              <input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div className="input-group"><label>Categoría</label>
              <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="input-group"><label>Costo ($)</label>
              <input type="number" step="0.01" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
            </div>
            <div className="input-group"><label>Venta ($)</label>
              <input type="number" step="0.01" value={formData.sale} onChange={e => setFormData({ ...formData, sale: e.target.value })} />
            </div>
          </div>
          <div className="input-group">
            <label>Imagen (Opcional)</label>
            <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} />
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>{editingId ? 'Actualizar' : 'Guardar en Stock'}</button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {items.map(item => (
          <div key={item.id} className="card animate-fade" style={{ display: 'flex', alignItems: 'center', padding: '12px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '15px', background: '#f5f5f5', overflow: 'hidden', marginRight: '15px', border: '1px solid #eee' }}>
              {item.image_url ?
                <img src={`${API_URL}${item.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '20px' }}>📦</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>{item.product_name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                Stock: <strong style={{ color: 'var(--text)' }}>{item.quantity}</strong> | Venta: <strong>${(item.sale_price || 0).toFixed(2)}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => startEdit(item)} style={{ padding: '8px', background: 'none', border: '1px solid #eee', borderRadius: '10px' }}>✏️</button>
              <button onClick={() => deleteItem(item.id)} style={{ padding: '8px', background: 'none', border: '1px solid #eee', borderRadius: '10px' }}>🗑️</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>No hay ítems registrados.</p>}
      </div>
    </div>
  );
}

export default App;
