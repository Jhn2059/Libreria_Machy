// ============================================
// Users Module
// ============================================
const Usuarios = {
  editUserId: null,

  async load() {
    document.getElementById('u-loading').style.display = 'block';
    document.getElementById('u-tbl').style.display = 'none';

    let users = [];
    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('usuarios').select('*').order('nombre');
      users = data || [];
    } else { users = Utils.lsGet('usuarios') || Auth.DEMO_USERS; }

    document.getElementById('u-loading').style.display = 'none';

    if (!users.length) { document.getElementById('u-tbl').innerHTML = '<tr><td colspan="5">No hay usuarios registrados</td></tr>'; document.getElementById('u-tbl').style.display = 'block'; return; }

    document.getElementById('u-tbl').style.display = 'block';
    document.getElementById('u-tbody').innerHTML = users.map(u => `
      <tr><td>${Utils.escapeHtml(u.nombre)}</td><td><code>${Utils.escapeHtml(u.username)}</code></td>
      <td><span class="badge ${u.rol === 'administrador' ? 'badge-admin' : 'badge-vendor'}">${u.rol === 'administrador' ? '👑 Admin' : '🛒 Vendedor'}</span></td>
      <td><span class="badge ${u.activo !== false ? 'badge-ok' : 'badge-out'}">${u.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="Usuarios.edit('${u.id}')">✏️</button>
      ${u.id !== Auth.getSession()?.id ? `<button class="btn btn-danger btn-sm" onclick="Usuarios.delete('${u.id}', '${Utils.escapeHtml(u.nombre)}')">🗑️</button>` : ''}</td></tr>`).join('');
  },

  openModal(user = null) {
    this.editUserId = user ? user.id : null;
    document.getElementById('mu-title').textContent = user ? '✏️ Editar usuario' : '👤 Nuevo usuario';
    document.getElementById('mu-nombre').value = user ? user.nombre : '';
    document.getElementById('mu-user').value = user ? user.username : '';
    document.getElementById('mu-pass').value = '';
    document.getElementById('mu-rol').value = user ? user.rol : 'vendedor';
    document.getElementById('mu-id').value = user ? user.id : '';
    Modales.open('modal-usuario');
  },

  edit(id) { let user = (Utils.lsGet('usuarios') || Auth.DEMO_USERS).find(u => u.id === id); if (user) this.openModal(user); },

  async delete(id, nombre) {
    Modales.open('modal-confirm', {
      title: '¿Eliminar usuario?', message: `Se eliminará "${nombre}" del sistema.`, icon: '🗑️',
      onConfirm: async () => {
        if (SupabaseConfig.isConnected()) await SupabaseConfig.getClient().from('usuarios').update({ activo: false }).eq('id', id);
        else { let users = Utils.lsGet('usuarios') || Auth.DEMO_USERS; users = users.filter(u => u.id !== id); Utils.lsSet('usuarios', users); }
        Utils.toast('Usuario eliminado', 'info');
        this.load();
      }
    });
  },

  async guardar() {
    const nombre = document.getElementById('mu-nombre').value.trim();
    const username = document.getElementById('mu-user').value.trim();
    const password = document.getElementById('mu-pass').value;
    const rol = document.getElementById('mu-rol').value;
    const editId = document.getElementById('mu-id').value;

    if (!nombre) { Utils.toast('Nombre requerido', 'err'); return; }
    if (!username) { Utils.toast('Usuario requerido', 'err'); return; }

    const payload = { nombre, username, rol, activo: true };
    if (password) payload.password_hash = password;

    if (SupabaseConfig.isConnected()) {
      if (editId) { const { error } = await SupabaseConfig.getClient().from('usuarios').update(payload).eq('id', editId); if (error) { Utils.toast('Error: ' + error.message, 'err'); return; } }
      else { if (!password) { Utils.toast('Contraseña requerida', 'err'); return; } const { error } = await SupabaseConfig.getClient().from('usuarios').insert([payload]); if (error) { Utils.toast('Error: ' + error.message, 'err'); return; } }
    } else {
      let users = Utils.lsGet('usuarios') || Auth.DEMO_USERS;
      if (editId) { const i = users.findIndex(u => u.id === editId); if (i >= 0) { users[i] = { ...users[i], ...payload }; if (password) users[i].password = password; } }
      else { if (!password) { Utils.toast('Contraseña requerida', 'err'); return; } const exists = users.find(u => u.username === username); if (exists) { Utils.toast('El usuario ya existe', 'err'); return; } users.push({ id: Utils.generateId(), ...payload, password }); }
      Utils.lsSet('usuarios', users);
    }
    Utils.toast('✅ Usuario guardado correctamente', 'ok');
    Modales.close('modal-usuario');
    this.load();
  }
};

window.Usuarios = Usuarios;