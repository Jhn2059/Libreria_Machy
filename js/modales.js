// ============================================
// Modals Module
// ============================================
const Modales = {
  current: null,

  open(id, options = {}) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    this.current = { id, title: options.title, message: options.message, icon: options.icon, onConfirm: options.onConfirm };

    if (options.title) {
      const titleEl = overlay.querySelector('.modal-title') || overlay.querySelector('#mc-title');
      if (titleEl) titleEl.textContent = options.icon ? (options.icon + ' ' + options.title) : options.title;
    }
    if (options.message) {
      const msgEl = overlay.querySelector('#mc-msg');
      if (msgEl) msgEl.textContent = options.message;
    }
    if (options.icon) {
      const iconEl = overlay.querySelector('#mc-icon');
      if (iconEl) iconEl.textContent = options.icon;
    }
    const confirmBtn = document.getElementById('mc-ok');
    if (confirmBtn && options.onConfirm) {
      confirmBtn.onclick = () => { options.onConfirm(); this.close(id); };
    }
    overlay.classList.add('open');
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('open');
    const confirmBtn = document.getElementById('mc-ok');
    if (confirmBtn) confirmBtn.onclick = () => this.close(id);
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Modales.close(overlay.id);
    });
  });
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Modales.closeAll(); });
window.Modales = Modales;