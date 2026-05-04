// ============================================
// Cart Module
// ============================================
const Carrito = {
  items: [],

  add(product, quantity = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      const newQty = existing.qty + quantity;
      if (newQty > product.stock) { Utils.toast('No hay suficiente stock', 'err'); return false; }
      existing.qty = newQty;
    } else {
      this.items.push({ ...product, qty: quantity });
    }
    this.save();
    this.render();
    return true;
  },

  updateQuantity(index, delta) {
    if (!this.items[index]) return;
    this.items[index].qty = Math.max(1, this.items[index].qty + delta);
    this.save();
    this.render();
  },

  remove(index) { this.items.splice(index, 1); this.save(); this.render(); },
  clear() { this.items = []; this.save(); this.render(); },
  getItems() { return this.items; },
  getSubtotal() { return this.items.reduce((sum, item) => sum + (item.qty * parseFloat(item.precio)), 0); },
  getCount() { return this.items.reduce((sum, item) => sum + item.qty, 0); },
  save() { Utils.lsSet('carrito', this.items); },
  load() { this.items = Utils.lsGet('carrito') || []; },

  render() {
    const ul = document.getElementById('cart-items');
    const empty = document.getElementById('cart-empty');
    const totalDiv = document.getElementById('cart-total');
    if (!ul || !empty || !totalDiv) return;

    if (!this.items.length) { ul.innerHTML = ''; empty.style.display = 'block'; totalDiv.style.display = 'none'; return; }
    empty.style.display = 'none';
    totalDiv.style.display = 'block';

    ul.innerHTML = this.items.map((item, i) => `
      <li class="cart-item">
        <div class="ci-info"><div class="ci-name">${Utils.escapeHtml(item.nombre)}</div><div class="ci-sub">${item.qty} × ${Utils.formatMoney(item.precio)}</div></div>
        <div class="ci-qty"><button class="qty-b" onclick="Carrito.updateQuantity(${i}, -1)">−</button><span class="qty-n">${item.qty}</span><button class="qty-b" onclick="Carrito.updateQuantity(${i}, 1)">+</button></div>
        <span class="ci-price">${Utils.formatMoney(item.qty * parseFloat(item.precio))}</span>
        <button class="btn-rm" onclick="Carrito.remove(${i})">✕</button>
      </li>`).join('');
    Ventas.recalcTotal();
  }
};

window.Carrito = Carrito;