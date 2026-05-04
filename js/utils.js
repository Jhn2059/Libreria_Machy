// ============================================
// Utility Functions
// ============================================
const Utils = {
  LS_PREFIX: 'machy_',

  lsGet(key) {
    const val = localStorage.getItem(this.LS_PREFIX + key);
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  },

  lsSet(key, value) {
    localStorage.setItem(this.LS_PREFIX + key, JSON.stringify(value));
  },

  lsRemove(key) {
    localStorage.removeItem(this.LS_PREFIX + key);
  },

  toast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = '';
    setTimeout(() => {
      toast.classList.add('show');
      if (type === 'ok') toast.classList.add('t-ok');
      else if (type === 'err') toast.classList.add('t-err');
      else toast.classList.add('t-info');
    }, 10);
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  formatMoney(amount) {
    return 'S/ ' + parseFloat(amount || 0).toFixed(2);
  },

  formatDate(dateStr, options = {}) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('es-PE', {
      dateStyle: options.dateStyle || 'short',
      timeStyle: options.timeStyle || 'short'
    });
  },

  debounce(fn, delay = 300) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  isValidBarcode(code) {
    if (!code) return false;
    code = code.replace(/[\s-]/g, '');
    return [8, 12, 13].includes(code.length);
  }
};

window.Utils = Utils;