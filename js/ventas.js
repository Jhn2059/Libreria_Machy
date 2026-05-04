// ============================================
// Sales Module
// ============================================
const Ventas = {
  foundProduct: null,
  foundQuantity: 1,
  metodoPago: 'efectivo',

  async searchProduct(query) {
    if (!query || !query.trim()) { Utils.toast('Escribe un código o nombre', 'err'); return; }
    query = query.trim();

    let prods = [];
    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('productos').select('*, categorias(nombre, icono)').or(`codigo_barras.eq.${query},nombre.ilike.%${query}%`).eq('activo', true);
      prods = data || [];
    } else {
      const all = Utils.lsGet('productos') || [];
      prods = all.filter(p => p.activo !== false && (p.codigo_barras === query || p.nombre.toLowerCase().includes(query.toLowerCase())));
    }

    if (!prods.length) { Utils.toast('Producto no encontrado.', 'err'); document.getElementById('found-card-venta').style.display = 'none'; return; }

    const prod = prods[0];
    if (prod.stock <= 0) { Utils.toast('⚠️ Sin stock.', 'err'); return; }

    this.foundProduct = prod;
    this.foundQuantity = 1;
    document.getElementById('fc-qty').textContent = 1;
    document.getElementById('fc-name').textContent = prod.nombre;
    const catNombre = prod.categorias ? prod.categorias.nombre : prod.categoria_nombre || '—';
    document.getElementById('fc-meta').innerHTML = `Código: <b>${prod.codigo_barras}</b> | Cat: ${catNombre} | ${prod.marca ? 'Marca: ' + prod.marca + ' | ' : ''}Stock: <b>${prod.stock}</b>`;
    document.getElementById('fc-price').textContent = Utils.formatMoney(prod.precio);
    document.getElementById('found-card-venta').style.display = 'block';
    document.getElementById('m-code-venta').value = '';
  },

  changeFoundQty(delta) {
    if (!this.foundProduct) return;
    this.foundQuantity = Math.max(1, Math.min(this.foundProduct.stock, this.foundQuantity + delta));
    document.getElementById('fc-qty').textContent = this.foundQuantity;
  },

  addFoundToCart() {
    if (!this.foundProduct) return;
    if (Carrito.add(this.foundProduct, this.foundQuantity)) {
      document.getElementById('found-card-venta').style.display = 'none';
      document.getElementById('scan-result-venta').style.display = 'none';
      this.foundProduct = null;
      Utils.toast('Producto agregado ✓', 'ok');
    }
  },

  setPago(element) {
    document.querySelectorAll('.pago-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    this.metodoPago = element.dataset.m;
  },

  recalcTotal() {
    const sub = Carrito.getSubtotal();
    const desc = parseFloat(document.getElementById('cart-descuento').value) || 0;
    const total = Math.max(0, sub - desc);
    document.getElementById('cart-subtotal').textContent = Utils.formatMoney(sub);
    document.getElementById('cart-total-val').textContent = Utils.formatMoney(total);
  },

  clearCart() {
    Carrito.clear();
    document.getElementById('found-card-venta').style.display = 'none';
    document.getElementById('cart-descuento').value = '0';
    this.recalcTotal();
  },

  async confirmar() {
    if (!Carrito.getItems().length) { Utils.toast('El carrito está vacío', 'err'); return; }

    const sub = Carrito.getSubtotal();
    const desc = parseFloat(document.getElementById('cart-descuento').value) || 0;
    const total = Math.max(0, sub - desc);
    const session = Auth.getSession();

    const ventaData = {
      vendedor_id: session.id || null,
      vendedor_nombre: session.nombre,
      subtotal: sub, descuento: desc, total,
      metodo_pago: this.metodoPago,
      fecha: new Date().toISOString()
    };

    let ventaId = null;

    if (SupabaseConfig.isConnected()) {
      const { data: v, error } = await SupabaseConfig.getClient().from('ventas').insert([ventaData]).select().single();
      if (error) { Utils.toast('Error: ' + error.message, 'err'); return; }
      ventaId = v.id;

      const detalles = Carrito.getItems().map(i => ({
        venta_id: ventaId, producto_id: i.id, codigo_barras: i.codigo_barras,
        nombre_producto: i.nombre, cantidad: i.qty, precio_unitario: parseFloat(i.precio), subtotal: i.qty * parseFloat(i.precio)
      }));
      await SupabaseConfig.getClient().from('detalle_ventas').insert(detalles);

      for (const item of Carrito.getItems()) {
        const newStock = item.stock - item.qty;
        await SupabaseConfig.getClient().from('productos').update({ stock: newStock }).eq('id', item.id);
        if (newStock <= item.stock_minimo) {
          await SupabaseConfig.getClient().from('alertas').insert([{ producto_id: item.id, mensaje: `${item.nombre} stock mínimo (${newStock})`, leida: false }]);
        }
      }
    } else {
      let ventas = Utils.lsGet('ventas') || [];
      ventaId = Utils.generateId();
      ventas.push({ id: ventaId, ...ventaData, items: Carrito.getItems().map(i => ({ ...i })) });
      Utils.lsSet('ventas', ventas);
      let prods = Utils.lsGet('productos') || [];
      Carrito.getItems().forEach(item => { const p = prods.find(x => x.id === item.id); if (p) p.stock = Math.max(0, p.stock - item.qty); });
      Utils.lsSet('productos', prods);
    }

    Utils.toast('✅ Venta: ' + Utils.formatMoney(total), 'ok');
    this.clearCart();
    Alertas.check();
  }
};

window.Ventas = Ventas;