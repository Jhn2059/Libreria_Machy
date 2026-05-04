// ============================================
// LIBRERÍA MACHY - Main Application
// ============================================
const MachyApp = {
  SB_URL: 'https://wjosjwecdgygmkudinvv.supabase.co',
  SB_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb3Nqd2VjZGd5Z21rdWRpbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyOTc0MzQsImV4cCI6MjA5Mjg3MzQzNH0.bqCZ_nEMb-rI5jN2h2HqxA8cVLa3K_x9JnSoPT8pldM',

  init() {
    // Initialize Supabase
    SupabaseConfig.init(this.SB_URL, this.SB_KEY);

    // Initialize demo data
    if (!Utils.lsGet('usuarios')) Utils.lsSet('usuarios', Auth.DEMO_USERS);
    if (!Utils.lsGet('productos')) Utils.lsSet('productos', [
      { id: 'p1', codigo_barras: '7501234567890', nombre: 'Cuaderno A4 100h', marca: 'Artesco', precio: 12.50, stock: 45, stock_minimo: 10, activo: true },
      { id: 'p2', codigo_barras: '7509876543210', nombre: 'Lápiz HB', marca: 'Faber', precio: 2.50, stock: 120, stock_minimo: 20, activo: true },
      { id: 'p3', codigo_barras: '9786123456789', nombre: 'Libro Matemática', marca: 'Santillana', precio: 35, stock: 5, stock_minimo: 8, activo: true },
      { id: 'p4', codigo_barras: '7501112223330', nombre: 'Colores x12', marca: 'Crayola', precio: 18, stock: 0, stock_minimo: 5, activo: true }
    ]);

    // Restore session if exists
    Auth.restoreSession();
    if (Auth.getSession()) {
      Auth.startApp();
    }
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => MachyApp.init());

window.MachyApp = MachyApp;