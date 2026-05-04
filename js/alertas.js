// ============================================
// Stock Alerts Module
// ============================================
const Alertas = {
  async check() {
    let productos = [];
    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('productos').select('*').eq('activo', true);
      productos = data || [];
    } else {
      productos = Utils.lsGet('productos') || [];
    }

    const alertProds = productos.filter(p => p.stock <= p.stock_minimo);
    const alertCount = alertProds.length;
    const badge = document.getElementById('alert-badge');
    const navBadge = document.getElementById('nav-alert-badge');

    if (badge) { badge.style.display = alertCount > 0 ? 'block' : 'none'; document.getElementById('alert-count').textContent = alertCount; }
    if (navBadge) { navBadge.style.display = alertCount > 0 ? 'block' : 'none'; navBadge.textContent = alertCount; }

    const dashList = document.getElementById('dash-alertas-list');
    if (dashList) {
      if (alertProds.length === 0) dashList.innerHTML = '<div class="empty"><div class="ico">✅</div>Sin alertas de stock</div>';
      else dashList.innerHTML = alertProds.slice(0, 5).map(p => `<div class="alert-item"><div class="alert-ico">⚠️</div><div class="alert-info"><div class="alert-name">${Utils.escapeHtml(p.nombre)}</div><div class="alert-sub">Stock: ${p.stock} (mín: ${p.stock_minimo})</div></div></div>`).join('');
    }
    return alertProds;
  },

  async load() {
    const container = document.getElementById('alertas-container');
    if (!container) return;
    const alertProds = await this.check();

    if (alertProds.length === 0) { container.innerHTML = '<div class="card"><div class="empty"><div class="ico">✅</div><p>No hay productos con alertas</p></div></div>'; return; }

    container.innerHTML = alertProds.map(p => `
      <div class="card"><div class="alert-item"><div class="alert-ico">⚠️</div><div class="alert-info"><div class="alert-name">${Utils.escapeHtml(p.nombre)}</div><div class="alert-sub">Código: ${p.codigo_barras} | Stock: <strong>${p.stock}</strong> | Mín: ${p.stock_minimo}</div></div></div>
      ${Auth.isAdmin() ? `<div style="margin-top:.8rem;display:flex;gap:.6rem"><button class="btn btn-outline btn-sm" onclick="Inventario.edit('${p.id}')">✏️ Reabastecer</button></div>` : ''}</div>`).join('');
  },

  async marcarTodasLeidas() { Utils.toast('Alertas marcadas como leídas', 'ok'); this.check(); }
};

window.Alertas = Alertas;