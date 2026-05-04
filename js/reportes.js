// ============================================
// Reports Module
// ============================================
const Reportes = {
  async exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Librería MACHY - Inventario', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.text('Fecha: ' + new Date().toLocaleDateString('es-PE'), 105, 22, { align: 'center' }); doc.text('Chupaca - Junín', 105, 28, { align: 'center' });

    let productos = [];
    if (SupabaseConfig.isConnected()) { const { data } = await SupabaseConfig.getClient().from('productos').select('*').eq('activo', true).order('nombre'); productos = data || []; }
    else { productos = Utils.lsGet('productos') || []; }

    let y = 40; doc.setFontSize(9); doc.setFont(undefined, 'bold');
    doc.text('Código', 10, y); doc.text('Producto', 45, y); doc.text('Precio', 130, y); doc.text('Stock', 155, y); doc.text('Estado', 175, y);
    doc.setFont(undefined, 'normal'); y += 8;

    productos.forEach(p => {
      if (y > 280) { doc.addPage(); y = 20; }
      const estado = p.stock <= 0 ? 'Agotado' : p.stock <= p.stock_minimo ? 'Bajo' : 'OK';
      doc.text(p.codigo_barras.substring(0, 15), 10, y); doc.text(p.nombre.substring(0, 30), 45, y); doc.text('S/ ' + parseFloat(p.precio).toFixed(2), 130, y); doc.text(p.stock.toString(), 155, y); doc.text(estado, 175, y);
      y += 6;
    });

    doc.save('inventario_machy_' + new Date().toISOString().split('T')[0] + '.pdf');
    Utils.toast('📄 PDF descargado', 'ok');
  },

  async exportarCSV() {
    let productos = [];
    if (SupabaseConfig.isConnected()) { const { data } = await SupabaseConfig.getClient().from('productos').select('*, categorias(nombre)').eq('activo', true).order('nombre'); productos = data || []; }
    else { productos = Utils.lsGet('productos') || []; }

    const rows = [['Código', 'Nombre', 'Categoría', 'Marca', 'Precio Venta', 'Precio Costo', 'Stock', 'Stock Mín', 'Unidad']];
    productos.forEach(p => { rows.push([p.codigo_barras, p.nombre, p.categorias ? p.categorias.nombre : '', p.marca || '', p.precio, p.precio_costo || '', p.stock, p.stock_minimo, p.unidad]); });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventario_machy_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click(); URL.revokeObjectURL(url);
    Utils.toast('📊 CSV descargado', 'ok');
  },

  async exportarHistorialCSV() {
    let ventas = [];
    if (SupabaseConfig.isConnected()) { const { data } = await SupabaseConfig.getClient().from('ventas').select('*').order('created_at', { ascending: false }); ventas = data || []; }
    else { ventas = Utils.lsGet('ventas') || []; }

    const rows = [['Fecha', 'Hora', 'Vendedor', 'Método Pago', 'Subtotal', 'Descuento', 'Total']];
    ventas.forEach(v => { const fecha = new Date(v.fecha || v.created_at); rows.push([fecha.toLocaleDateString('es-PE'), fecha.toLocaleTimeString('es-PE'), v.vendedor_nombre || '', v.metodo_pago || '', v.subtotal, v.descuento || 0, v.total]); });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'historial_ventas_machy_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click(); URL.revokeObjectURL(url);
    Utils.toast('📊 CSV descargado', 'ok');
  },

  async exportarHistorialPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Librería MACHY - Historial de Ventas', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.text('Fecha: ' + new Date().toLocaleDateString('es-PE'), 105, 22, { align: 'center' });

    let ventas = [];
    if (SupabaseConfig.isConnected()) { const { data } = await SupabaseConfig.getClient().from('ventas').select('*').order('created_at', { ascending: false }); ventas = data || []; }
    else { ventas = Utils.lsGet('ventas') || []; }

    let y = 35; doc.setFontSize(9); doc.setFont(undefined, 'bold');
    doc.text('Fecha', 10, y); doc.text('Vendedor', 50, y); doc.text('Método', 95, y); doc.text('Total', 140, y);
    doc.setFont(undefined, 'normal'); y += 8;

    ventas.forEach(v => {
      if (y > 280) { doc.addPage(); y = 20; }
      const fecha = Utils.formatDate(v.fecha || v.created_at);
      doc.text(fecha, 10, y); doc.text((v.vendedor_nombre || '—').substring(0, 20), 50, y); doc.text(v.metodo_pago || '—', 95, y); doc.text('S/ ' + parseFloat(v.total).toFixed(2), 140, y);
      y += 6;
    });

    y += 10;
    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
    doc.setFont(undefined, 'bold');
    doc.text('Total Ventas: ' + totalVentas, 10, y); y += 6;
    doc.text('Ingresos Totales: S/ ' + totalIngresos.toFixed(2), 10, y);

    doc.save('historial_ventas_machy_' + new Date().toISOString().split('T')[0] + '.pdf');
    Utils.toast('📄 PDF descargado', 'ok');
  },

  printRecibo() {
    const venta = Historial.getCurrentVenta();
    if (!venta) return;
    const items = venta.detalle_ventas || venta.items || [];
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<!DOCTYPE html><html><head><title>Comprobante</title><style>body{font-family:monospace;font-size:12px;padding:20px;max-width:300px;margin:0 auto}h2{text-align:center;font-size:14px;margin:0}.sep{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between}.total{font-size:16px;font-weight:bold}</style></head><body><h2>LIBRERÍA MACHY</h2><p style="text-align:center;margin:0">Chupaca — Junín<br>RUC: 00000000000</p><div class="sep"></div><div>Fecha: ${Utils.formatDate(venta.fecha || venta.created_at)}</div><div>Vendedor: ${venta.vendedor_nombre || '—'}</div><div>Pago: ${venta.metodo_pago || '—'}</div><div class="sep"></div>${items.map(i => `<div class="row"><span>${i.nombre_producto || i.nombre} x${i.cantidad || i.qty}</span><span>S/ ${parseFloat(i.subtotal || (i.qty * i.precio)).toFixed(2)}</span></div>`).join('')}<div class="sep"></div>${venta.descuento > 0 ? `<div class="row"><span>Descuento</span><span>- S/ ${parseFloat(venta.descuento).toFixed(2)}</span></div>` : ''}<div class="row total"><span>TOTAL</span><span>S/ ${parseFloat(venta.total).toFixed(2)}</span></div><div class="sep"></div><p style="text-align:center">¡Gracias por su compra!</p></body></html>`);
    win.document.close(); win.print();
  }
};

window.Reportes = Reportes;