// ============================================
// Global Function Wrappers
// Exposes module methods as global functions
// for HTML onclick handlers
// ============================================

// --- Auth ---
function doLogin()          { Auth.doLogin(); }
function confirmLogout()    { Auth.confirmLogout(); }
function unlockSession()    { Auth.unlockSession(); }
function setRole(role, el)  { Auth.setRole(role, el); }

// --- Dashboard / Navigation ---
function showPanel(name)    { Dashboard.showPanel(name); MachyApp.closeSidebar(); }
function toggleSidebar()    { document.getElementById('sidebar').classList.toggle('open'); }

// --- Ventas ---
function searchProduct(q)   { Ventas.searchProduct(q); }
function changeFoundQty(d)  { Ventas.changeFoundQty(d); }
function addFoundToCart()   { Ventas.addFoundToCart(); }
function setPago(el)        { Ventas.setPago(el); }
function recalcTotal()      { Ventas.recalcTotal(); }
function confirmarVenta()   { Ventas.confirmar(); }
function clearCart()        { Ventas.clearCart(); }

// --- Inventario ---
function guardarProducto()  { Inventario.guardar(); }
function resetRegForm()     { Inventario.resetForm(); }
function filterInv()        { Inventario.filter(); }

// --- Historial ---
function loadHistorial()    { Historial.load(); }

// --- Usuarios ---
function openUserModal(user){ Usuarios.openModal(user); }
function guardarUsuario()   { Usuarios.guardar(); }

// --- Reportes ---
function exportarPDF()      { Reportes.exportarPDF(); }
function exportarCSV()      { Reportes.exportarCSV(); }
function exportarHistCSV()  { Reportes.exportarHistorialCSV(); }
function printRecibo()      { Reportes.printRecibo(); }

// --- Scanner ---
function startScan(target)  { Scanner.start(target); }
function stopScan()         { Scanner.stop(); }

// --- Modales ---
function closeModal(id)     { Modales.close(id); }
