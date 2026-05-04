// ============================================
// Sales History Module
// ============================================
const Historial = {
  currentVenta: null,

  async load() {
    document.getElementById('h-loading').style.display = 'block';
    document.getElementById('h-tbl').style.display = 'none';
    document.getElementById('h-empty').style.display = 'none';

    const desde = document.getElementById('h-desde').value;
    const hasta = document.getElementById('h-hasta').value;

    let ventas = [];
    if (SupabaseConfig.isConnected()) {
      let q = SupabaseConfig.getClient().from('ventas').select('*, detalle_ventas(*)').order('created_at', { ascending: false });
      if (desde) q = q.gte('created_at', desde);
      if (hasta) q = q.lte('created_at', hasta + 'T23:59:59');
      const { data } = await q;
      ventas = data || [];
    } else {
      ventas = (Utils.lsGet('ventas') || []).reverse();
      if (desde) ventas = ventas.filter(v => v.fecha >= desde);
      if (hasta) ventas = ventas.filter(v => v.fecha <= hasta + 'T23:59:59');
    }

    document.getElementById('h-loading').style.display = 'none';

    const totalV = ventas.length;
    const totalI = ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
    const ticket = totalV ? (totalI / totalV) : 0;

    document.getElementById('h-total').textContent = totalV;
    document.getElementById('h-ingresos').textContent = Utils.formatMoney(totalI);
    document.getElementById('h-ticket').textContent = Utils.formatMoney(ticket);

    if (!ventas.length) { document.getElementById('h-empty').style.display = 'block'; return; }

    document.getElementById('h-tbl').style.display = 'block';
    const metodoIconos = { efectivo: '💵', yape: '📱', plin: '📲', transferencia: '🏦' };

    document.getElementById('h-tbody').innerHTML = ventas.map((v, i) => {
      const fecha = Utils.formatDate(v.fecha || v.created_at);
      const items = v.detalle_ventas ? v.detalle_ventas.length : (v.items ? v.items.length : '—');
      const metodo = metodoIconos[v.metodo_pago] || '💰';
      return `<tr><td><strong>#${totalV - i}</strong></td><td>${fecha}</td><td>${v.vendedor_nombre || '—'}</td><td>${metodo} ${v.metodo_pago || '—'}</td><td>${items}</td><td><strong style="color:var(--green)">${Utils.formatMoney(v.total)}</strong></td><td><button class="btn btn-outline btn-sm" onclick="Historial.ver('${v.id}')">Ver</button></td></tr>`;
    }).join('');
  },

  async ver(id) {
    let venta = null;
    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('ventas').select('*, detalle_ventas(*)').eq('id', id).single();
      venta = data;
    } else {
      venta = (Utils.lsGet('ventas') || []).find(v => v.id === id);
    }
    if (!venta) return;

    this.currentVenta = venta;
    const items = venta.detalle_ventas || venta.items || [];
    document.getElementById('mvd-num').textContent = '';
    document.getElementById('mvd-body').innerHTML = `
      <div style="display:flex;gap:1.5rem;margin-bottom:1rem;font-size:13px;color:var(--ink2);flex-wrap:wrap">
        <span>📅 ${Utils.formatDate(venta.fecha || venta.created_at)}</span><span>👤 ${venta.vendedor_nombre || '—'}</span><span>💳 ${venta.metodo_pago || '—'}</span>
      </div>
      <div class="tbl-wrap"><table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
      <tbody>${items.map(i => `<tr><td>${i.nombre_producto || i.nombre}</td><td>${i.cantidad || i.qty}</td><td>${Utils.formatMoney(i.precio_unitario || i.precio)}</td><td>${Utils.formatMoney(i.subtotal || (i.qty * (i.precio || 0)))}</td></tr>`).join('')}</tbody>
      </table></div>
      <div style="margin-top:1rem;text-align:right;font-size:13px">
        ${venta.descuento > 0 ? `<div>Descuento: <strong>− ${Utils.formatMoney(venta.descuento)}</strong></div>` : ''}
        <div style="font-family:var(--serif);font-size:1.3rem;color:var(--green);font-style:italic">Total: ${Utils.formatMoney(venta.total)}</div>
      </div>`;
    Modales.open('modal-venta-det');
  },

  getCurrentVenta() { return this.currentVenta; }
};

window.Historial = Historial;