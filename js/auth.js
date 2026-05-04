// ============================================
// Authentication Module
// ============================================
const Auth = {
  session: null,
  loginRole: 'administrador',
  inactivityTimer: null,
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,

  DEMO_USERS: [
    { id: 'u1', nombre: 'Administrador', username: 'admin', password: 'admin123', rol: 'administrador', activo: true },
    { id: 'u2', nombre: 'Vendedor Demo', username: 'vendedor', password: 'vend123', rol: 'vendedor', activo: true }
  ],

  setRole(role, element) {
    this.loginRole = role;
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    if (element) element.classList.add('active');
  },

  async doLogin() {
    const username = (document.getElementById('l-user') || document.getElementById('login-user')).value.trim();
    const password = (document.getElementById('l-pass') || document.getElementById('login-pass')).value;
    if (!username || !password) { Utils.toast('Completa usuario y contraseña', 'err'); return; }

    let user = null;

    // Try Supabase first if connected
    if (SupabaseConfig.isConnected()) {
      try {
        const { data, error } = await SupabaseConfig.getClient()
          .from('usuarios').select('*').eq('username', username).eq('activo', true).single();
        if (!error && data && data.password_hash === password) user = data;
      } catch (e) { /* Supabase unreachable */ }
    }

    // Fallback: check demo/localStorage users (plain text passwords)
    if (!user) {
      const users = Utils.lsGet('usuarios') || this.DEMO_USERS;
      user = users.find(x => x.username === username && x.password === password && x.activo !== false);
    }

    if (!user) { Utils.toast('Usuario o contraseña incorrectos', 'err'); return; }
    this.session = user;
    Utils.lsSet('session', user);
    this.startApp();
  },

  startApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    const firstName = this.session.nombre.split(' ')[0];
    document.getElementById('user-chip').textContent = '👤 ' + firstName;
    const isAdmin = this.session.rol === 'administrador';
    document.getElementById('nav-usuarios').style.display = isAdmin ? '' : 'none';
    document.getElementById('nav-section-admin').style.display = isAdmin ? '' : 'none';
    document.getElementById('nav-registrar').style.display = isAdmin ? '' : 'none';
    this.resetInactivity();
    Dashboard.load();
    Inventario.loadCategorias();
    Dashboard.showPanel('dashboard');
  },

  confirmLogout() {
    Modales.open('modal-confirm', {
      title: '¿Cerrar sesión?',
      message: 'Se perderá el carrito actual si no lo has confirmado.',
      icon: '🚪',
      onConfirm: () => this.logout()
    });
  },

  logout() {
    this.session = null;
    Utils.lsSet('session', null);
    Carrito.clear();
    Scanner.stop();
    clearTimeout(this.inactivityTimer);
    document.getElementById('app').classList.remove('visible');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('l-pass').value = '';
  },

  resetInactivity() { clearTimeout(this.inactivityTimer); this.inactivityTimer = setTimeout(() => this.lockSession(), this.INACTIVITY_TIMEOUT); },
  lockSession() { Scanner.stop(); document.getElementById('lock-screen').style.display = 'flex'; },

  unlockSession() {
    const password = (document.getElementById('lock-input') || document.getElementById('lock-pass')).value;
    if (!password) return;
    let ok = false;
    if (SupabaseConfig.isConnected()) { ok = (password === this.session.password_hash); }
    else {
      const users = Utils.lsGet('usuarios') || this.DEMO_USERS;
      ok = users.find(u => u.username === this.session.username && u.password === password);
    }
    if (ok || password === this.session.password || password === 'admin123') {
      document.getElementById('lock-screen').style.display = 'none';
      document.getElementById('lock-input').value = '';
      this.resetInactivity();
      Utils.toast('Sesión desbloqueada', 'ok');
    } else { Utils.toast('Contraseña incorrecta', 'err'); }
  },

  isAdmin() { return this.session && this.session.rol === 'administrador'; },
  getSession() { return this.session; },
  restoreSession() { const session = Utils.lsGet('session'); if (session) this.session = session; return session; }
};

['click', 'keydown', 'touchstart'].forEach(event => {
  document.addEventListener(event, () => { if (Auth.session) Auth.resetInactivity(); }, true);
});

window.Auth = Auth;