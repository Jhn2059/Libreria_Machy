// ============================================
// Inventory Module
// ============================================
const Inventario = {
  products: [],
  editProductId: null,

  CAT_DEFAULT: [
    { id: 'c1', nombre: 'Libros escolares', icono: '📚' },
    { id: 'c2', nombre: 'Literatura', icono: '📖' },
    { id: 'c3', nombre: 'Cuadernos', icono: '📓' },
    { id: 'c4', nombre: 'Útiles de escritura', icono: '✏️' },
    { id: 'c5', nombre: 'Papelería y oficina', icono: '🗂️' },
    { id: 'c6', nombre: 'Arte y manualidades', icono: '🎨' },
    { id: 'c7', nombre: 'Juguetes', icono: '🧸' },
    { id: 'c8', nombre: 'Otros', icono: '🛍️' }
  ],

  async load() {
    document.getElementById('inv-loading').style.display = 'block';
    document.getElementById('inv-tbl-wrap').style.display = 'none';
    document.getElementById('inv-empty').style.display = 'none';

    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('productos').select('*, categorias(nombre, icono)').order('nombre');
      this.products = data || [];
    } else {
      this.products = Utils.lsGet('productos') || [];
    }

    this.render();
    this.updateStats();
    this.fillCatFilter();
  },

  render(list = this.products) {
    document.getElementById('inv-loading').style.display = 'none';
    if (!list.length) { document.getElementById('inv-empty').style.display = 'block'; return; }
    document.getElementById('inv-tbl-wrap').style.display = 'block';
    const isAdmin = Auth.isAdmin();
    document.getElementById('inv-tbody').innerHTML = list.map(p => {
      const cat = p.categorias ? p.categorias.icono + ' ' + p.categorias.nombre : (p.categoria_nombre || '—');
      const stockBadge = p.stock <= 0 ? 'badge-out' : p.stock <= p.stock_minimo ? 'badge-low' : 'badge-ok';
      const stockLabel = p.stock <= 0 ? 'Agotado' : p.stock <= p.stock_minimo ? 'Stock bajo' : 'Disponible';
      const acciones = isAdmin ? `<button class="btn btn-outline btn-sm" onclick="Inventario.edit('${p.id}')">✏️</button><button class="btn btn-danger btn-sm" onclick="Inventario.delete('${p.id}', '${Utils.escapeHtml(p.nombre)}')">🗑️</button>` : '—';
      return `<tr><td><code>${Utils.escapeHtml(p.codigo_barras)}</code></td><td><strong>${Utils.escapeHtml(p.nombre)}</strong>${p.marca ? '<br><span style="font-size:11px;color:var(--ink3)">' + Utils.escapeHtml(p.marca) + '</span>' : ''}</td><td>${cat}</td><td><strong>${Utils.formatMoney(p.precio)}</strong></td><td>${Utils.formatMoney(p.precio_costo)}</td><td><strong>${p.stock}</strong></td><td><span class="badge ${stockBadge}">${stockLabel}</span></td><td>${acciones}</td></tr>`;
    }).join('');
  },

  updateStats() {
    document.getElementById('i-total').textContent = this.products.length;
    document.getElementById('i-stock').textContent = this.products.reduce((s, p) => s + p.stock, 0);
    document.getElementById('i-bajo').textContent = this.products.filter(p => p.stock > 0 && p.stock <= p.stock_minimo).length;
    document.getElementById('i-agot').textContent = this.products.filter(p => p.stock <= 0).length;
  },

  fillCatFilter() {
    const sel = document.getElementById('inv-cat');
    const cats = [...new Set(this.products.map(p => p.categorias ? p.categorias.nombre : p.categoria_nombre).filter(Boolean))];
    sel.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c => `<option>${c}</option>`).join('');
  },

  filter() {
    const q = document.getElementById('inv-search').value.toLowerCase();
    const cat = document.getElementById('inv-cat').value;
    const estado = document.getElementById('inv-estado').value;
    let list = this.products.filter(p => {
      const catN = p.categorias ? p.categorias.nombre : p.categoria_nombre || '';
      const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.codigo_barras.includes(q) || (p.marca || '').toLowerCase().includes(q);
      const matchC = !cat || catN === cat;
      const matchE = !estado || ( estado === 'ok' ? p.stock > p.stock_minimo : estado === 'low' ? p.stock > 0 && p.stock <= p.stock_minimo : estado === 'out' ? p.stock <= 0 : true );
      return matchQ && matchC && matchE;
    });
    this.render(list);
  },

  async loadCategorias() {
    let cats = [];
    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('categorias').select('*').order('nombre');
      cats = data || [];
    } else {
      cats = Utils.lsGet('categorias') || this.CAT_DEFAULT;
      if (!cats.length) { cats = this.CAT_DEFAULT; Utils.lsSet('categorias', cats); }
    }
    const sel = document.getElementById('p-cat');
    if (sel) sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.icono || '📦'} ${c.nombre}</option>`).join('');
  },

  setRegCode(code) {
    if (!code || !code.trim()) { Utils.toast('Ingresa un código válido', 'err'); return; }
    document.getElementById('p-codigo').value = code.trim();
    document.getElementById('m-code-reg').value = '';
    Utils.toast('Código asignado: ' + code.trim(), 'ok');
  },

  async edit(id) {
    let p = this.products.find(x => x.id === id);
    if (!p && SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('productos').select('*').eq('id', id).single();
      p = data;
    }
    if (!p) return;
    this.editProductId = id;
    document.getElementById('reg-title').innerHTML = 'Editar Producto <span>Modifica los datos del producto</span>';
    document.getElementById('reg-form-title').textContent = '✏️ Editar: ' + p.nombre;
    document.getElementById('p-codigo').value = p.codigo_barras;
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-desc').value = p.descripcion || '';
    document.getElementById('p-marca').value = p.marca || '';
    document.getElementById('p-precio').value = p.precio;
    document.getElementById('p-costo').value = p.precio_costo || 0;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-stockmin').value = p.stock_minimo || 3;
    document.getElementById('p-edit-id').value = id;
    if (p.categoria_id) document.getElementById('p-cat').value = p.categoria_id;
    Dashboard.showPanel('registrar');
  },

  async delete(id, nombre) {
    Modales.open('modal-confirm', {
      title: '¿Eliminar producto?',
      message: `Se eliminará "${nombre}" del inventario.`,
      icon: '🗑️',
      onConfirm: async () => {
        if (SupabaseConfig.isConnected()) await SupabaseConfig.getClient().from('productos').update({ activo: false }).eq('id', id);
        else { let prods = Utils.lsGet('productos') || []; prods = prods.filter(p => p.id !== id); Utils.lsSet('productos', prods); }
        Utils.toast('Producto eliminado', 'info');
        this.load();
      }
    });
  },

  async guardar() {
    const codigo = document.getElementById('p-codigo').value.trim();
    const nombre = document.getElementById('p-nombre').value.trim();
    const catId = document.getElementById('p-cat').value;
    const precio = parseFloat(document.getElementById('p-precio').value);
    const costo = parseFloat(document.getElementById('p-costo').value) || 0;
    const stock = parseInt(document.getElementById('p-stock').value);
    const stockMin = parseInt(document.getElementById('p-stockmin').value) || 3;
    const editId = document.getElementById('p-edit-id').value;

    if (!codigo) { Utils.toast('Código de barras requerido', 'err'); return; }
    if (!nombre) { Utils.toast('Nombre del producto requerido', 'err'); return; }
    if (isNaN(precio) || precio < 0) { Utils.toast('Precio inválido', 'err'); return; }

    const payload = {
      codigo_barras: codigo, nombre,
      descripcion: document.getElementById('p-desc').value.trim(),
      marca: document.getElementById('p-marca').value.trim(),
      categoria_id: catId || null,
      precio, precio_costo: costo, stock, stock_minimo: stockMin,
      unidad: document.getElementById('p-unidad').value,
      activo: true
    };

    if (SupabaseConfig.isConnected()) {
      if (editId) {
        const { error } = await SupabaseConfig.getClient().from('productos').update(payload).eq('id', editId);
        if (error) { Utils.toast('Error: ' + error.message, 'err'); return; }
      } else {
        const { error } = await SupabaseConfig.getClient().from('productos').upsert([payload], { onConflict: 'codigo_barras' });
        if (error) { Utils.toast('Error: ' + error.message, 'err'); return; }
      }
    } else {
      let prods = Utils.lsGet('productos') || [];
      if (editId) { const i = prods.findIndex(p => p.id === editId); if (i >= 0) prods[i] = { ...prods[i], ...payload }; }
      else {
        const exists = prods.findIndex(p => p.codigo_barras === codigo);
        if (exists >= 0) prods[exists] = { ...prods[exists], ...payload };
        else prods.push({ id: Utils.generateId(), ...payload });
      }
      Utils.lsSet('productos', prods);
    }
    Utils.toast('✅ Producto guardado correctamente', 'ok');
    this.resetForm();
    this.load();
  },

  resetForm() {
    this.editProductId = null;
    document.getElementById('p-edit-id').value = '';
    ['p-codigo', 'p-nombre', 'p-desc', 'p-marca', 'p-precio', 'p-costo'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('p-stock').value = '1';
    document.getElementById('p-stockmin').value = '3';
    document.getElementById('m-code-reg').value = '';
    document.getElementById('reg-title').innerHTML = 'Registrar Producto <span>Nuevo ingreso al inventario</span>';
    document.getElementById('reg-form-title').textContent = '📝 Datos del producto';
  }
};

window.Inventario = Inventario;