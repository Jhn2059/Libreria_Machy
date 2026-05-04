// ============================================
// Dashboard Module
// ============================================
const Dashboard = {
  activePanel: 'dashboard',

  async load() {
    await this.loadStats();
    await this.loadChart();
    await Alertas.check();
  },

  async loadStats() {
    let productos = [];
    let ventas = [];

    if (SupabaseConfig.isConnected()) {
      const { data: prods } = await SupabaseConfig.getClient().from('productos').select('*').eq('activo', true);
      productos = prods || [];
      const hoy = new Date().toISOString().split('T')[0];
      const { data: vtas } = await SupabaseConfig.getClient().from('ventas').select('*').gte('created_at', hoy + 'T00:00:00');
      ventas = vtas || [];
      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const { data: vtasMes } = await SupabaseConfig.getClient().from('ventas').select('total').gte('created_at', primerDiaMes + 'T00:00:00');
      ventasMes = vtasMes || [];
    } else {
      productos = Utils.lsGet('productos') || [];
      const todasVentas = Utils.lsGet('ventas') || [];
      const hoy = new Date().toISOString().split('T')[0];
      ventas = todasVentas.filter(v => { const fechaVenta = (v.fecha || v.created_at).split('T')[0]; return fechaVenta === hoy; });
      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      ventasMes = todasVentas.filter(v => { const fechaVenta = (v.fecha || v.created_at).split('T')[0]; return fechaVenta >= primerDiaMes; });
    }

    document.getElementById('d-prods').textContent = productos.length;
    document.getElementById('d-ventas').textContent = ventas.length;
    const ingresosHoy = ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
    document.getElementById('d-ingresos').textContent = Utils.formatMoney(ingresosHoy);
    document.getElementById('d-bajo').textContent = productos.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length;
    document.getElementById('d-agotado').textContent = productos.filter(p => p.stock <= 0).length;
    const ingresosMes = (ventasMes || []).reduce((s, v) => s + parseFloat(v.total || 0), 0);
    document.getElementById('d-total-mes').textContent = Utils.formatMoney(ingresosMes);
  },

  async loadChart() {
    const chartContainer = document.getElementById('chart-ventas');
    if (!chartContainer) return;

    const days = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('es-PE', { weekday: 'short' }).substring(0, 3);
      days.push(dateStr);
      labels.push(dayName.charAt(0).toUpperCase() + dayName.charAt(1));
    }

    let salesData = [];
    if (SupabaseConfig.isConnected()) {
      const fechaInicio = days[0] + 'T00:00:00';
      const { data } = await SupabaseConfig.getClient().from('ventas').select('created_at, total').gte('created_at', fechaInicio);
      if (data) salesData = data;
    } else {
      salesData = Utils.lsGet('ventas') || [];
    }

    const dailySales = days.map(day => {
      return salesData.filter(v => { const fechaVenta = (v.fecha || v.created_at).split('T')[0]; return fechaVenta === day; }).reduce((s, v) => s + parseFloat(v.total || 0), 0);
    });

    const maxSale = Math.max(...dailySales, 1);
    chartContainer.innerHTML = dailySales.map((sale, i) => {
      const height = Math.max(4, (sale / maxSale) * 80);
      return `<div class="chart-bar-wrap"><span class="chart-bar-val">${sale > 0 ? 'S/' + sale.toFixed(0) : ''}</span><div class="chart-bar" style="height:${height}px"></div><span class="chart-bar-lbl">${labels[i]}</span></div>`;
    }).join('');
  },

  showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    const navBtn = document.getElementById('nav-' + name);
    if (panel) panel.classList.add('active');
    if (navBtn) navBtn.classList.add('active');
    this.activePanel = name;
    Scanner.stop();

    switch (name) {
      case 'productos': Inventario.load(); break;
      case 'historial': Historial.load(); break;
      case 'alertas': Alertas.load(); break;
      case 'usuarios': Usuarios.load(); break;
      case 'dashboard': this.load(); break;
      case 'registrar': Inventario.resetForm(); Inventario.loadCategorias(); break;
    }
  }
};

window.Dashboard = Dashboard;