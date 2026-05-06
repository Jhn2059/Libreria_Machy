// ============================================
// Users Module
// ============================================
const Usuarios = {
  editUserId: null,

  // Etiquetas legibles para los turnos
  TURNO_LABELS: {
    'tiempo-completo':  '🌅 Mañana (8:00 am – 12:00 pm)', '🌇 Tarde (1:00 pm – 7:00 pm)',
    //'tarde-completo':   '🌇 Tarde (1:00 pm – 7:00 pm)',
    'partido-completo': '🔄 Partido (8:00–12:00 / 3:00–7:00 pm)',
    'mañana-medio':     '🌅 Mañana (8:00 am – 1:00 pm)',
    'tarde-medio':      '🌇 Tarde (1:00 pm – 7:00 pm)',
  },

  async load() {
    document.getElementById('u-loading').style.display = 'block';
    document.getElementById('u-tbl').style.display = 'none';

    let users = [];
    if (SupabaseConfig.isConnected()) {
      const { data } = await SupabaseConfig.getClient().from('usuarios').select('*').order('nombre');
      users = data || [];
    } else { users = Utils.lsGet('usuarios') || Auth.DEMO_USERS; }

    document.getElementById('u-loading').style.display = 'none';

    if (!users.length) {
      document.getElementById('u-tbody').innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--ink3)">No hay usuarios registrados</td></tr>';
      document.getElementById('u-tbl').style.display = 'block';
      return;
    }

    document.getElementById('u-tbl').style.display = 'block';
    document.getElementById('u-tbody').innerHTML = users.map(u => {
      const jornadaLabel = u.jornada === 'medio' ? '🌤️ Medio tiempo' : (u.jornada === 'completo' ? '🌞 Tiempo completo' : '—');
      const turnoLabel   = this.TURNO_LABELS[u.turno] || u.turno || '—';
      const correo       = u.correo ? Utils.escapeHtml(u.correo) : '—';
      const domicilio    = u.domicilio ? Utils.escapeHtml(u.domicilio) : '—';
      return `
        <tr>
          <td>${Utils.escapeHtml(u.nombre)}</td>
          <td><code>${Utils.escapeHtml(u.username)}</code></td>
          <td><span class="badge ${u.rol === 'administrador' ? 'badge-admin' : 'badge-vendor'}">${u.rol === 'administrador' ? '👑 Admin' : '🛒 Vendedor'}</span></td>
          <td style="font-size:12px;color:var(--ink2)">${correo}</td>
          <td style="font-size:12px;color:var(--ink2)">${domicilio}</td>
          <td style="font-size:12px">
            ${u.rol === 'vendedor' ? `<span class="badge badge-ok" style="font-size:10px">${jornadaLabel}</span><br><span style="color:var(--ink3);font-size:11px">${turnoLabel}</span>` : '<span style="color:var(--ink3)">—</span>'}
          </td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="Usuarios.edit('${u.id}')">✏️</button>
            ${u.id !== Auth.getSession()?.id ? `<button class="btn btn-danger btn-sm" onclick="Usuarios.delete('${u.id}', '${Utils.escapeHtml(u.nombre)}')">🗑️</button>` : ''}
          </td>
        </tr>`;
    }).join('');
  },

  // Muestra/oculta la sección de horario según el rol seleccionado
  toggleHorario() {
    const rol = document.getElementById('mu-rol').value;
    document.getElementById('mu-horario-section').style.display = rol === 'vendedor' ? 'block' : 'none';
  },

  // Alterna entre jornada completa y medio tiempo
  selectJornada(tipo) {
    document.getElementById('mu-jornada').value = tipo;
    document.getElementById('hbtn-completo').classList.toggle('active', tipo === 'completo');
    document.getElementById('hbtn-medio').classList.toggle('active', tipo === 'medio');
    document.getElementById('opts-completo').style.display = tipo === 'completo' ? 'flex' : 'none';
    document.getElementById('opts-medio').style.display    = tipo === 'medio'    ? 'flex' : 'none';
  },

  openModal(user = null) {
    this.editUserId = user ? user.id : null;
    document.getElementById('mu-title').textContent = user ? '✏️ Editar usuario' : '👤 Nuevo usuario';
    document.getElementById('mu-nombre').value   = user?.nombre   || '';
    document.getElementById('mu-user').value     = user?.username || '';
    document.getElementById('mu-pass').value     = '';
    document.getElementById('mu-correo').value   = user?.correo   || '';
    document.getElementById('mu-domicilio').value= user?.domicilio|| '';
    document.getElementById('mu-rol').value      = user?.rol      || 'vendedor';
    document.getElementById('mu-id').value       = user?.id       || '';

    // Restaurar horario
    const jornada = user?.jornada || 'completo';
    this.selectJornada(jornada);
    if (user?.turno) {
      const selectId = jornada === 'medio' ? 'mu-turno-medio' : 'mu-turno-completo';
      document.getElementById(selectId).value = user.turno;
    }

    this.toggleHorario();
    Modales.open('modal-usuario');
  },

  edit(id) {
    let user = (Utils.lsGet('usuarios') || Auth.DEMO_USERS).find(u => u.id === id);
    if (user) this.openModal(user);
  },

  async delete(id, nombre) {
    Modales.open('modal-confirm', {
      title: '¿Eliminar usuario?', message: `Se eliminará "${nombre}" del sistema.`, icon: '🗑️',
      onConfirm: async () => {
        if (SupabaseConfig.isConnected()) {
          await SupabaseConfig.getClient().from('usuarios').update({ activo: false }).eq('id', id);
        } else {
          let users = Utils.lsGet('usuarios') || Auth.DEMO_USERS;
          users = users.filter(u => u.id !== id);
          Utils.lsSet('usuarios', users);
        }
        Utils.toast('Usuario eliminado', 'info');
        this.load();
      }
    });
  },

  async guardar() {
    const nombre    = document.getElementById('mu-nombre').value.trim();
    const username  = document.getElementById('mu-user').value.trim();
    const password  = document.getElementById('mu-pass').value;
    const rol       = document.getElementById('mu-rol').value;
    const correo    = document.getElementById('mu-correo').value.trim();
    const domicilio = document.getElementById('mu-domicilio').value.trim();
    const editId    = document.getElementById('mu-id').value;

    // Validaciones básicas
    if (!nombre)   { Utils.toast('Nombre requerido', 'err'); return; }
    if (!username) { Utils.toast('Usuario requerido', 'err'); return; }

    // Validación de correo (formato básico)
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      Utils.toast('Correo electrónico inválido', 'err'); return;
    }

    // Recoger horario solo para vendedores
    let jornada = null, turno = null;
    if (rol === 'vendedor') {
      jornada = document.getElementById('mu-jornada').value;
      turno   = jornada === 'medio'
        ? document.getElementById('mu-turno-medio').value
        : document.getElementById('mu-turno-completo').value;
    }

    const payload = { nombre, username, rol, correo, domicilio, jornada, turno, activo: true };
    if (password) payload.password_hash = password;

    if (SupabaseConfig.isConnected()) {
      if (editId) {
        const { error } = await SupabaseConfig.getClient().from('usuarios').update(payload).eq('id', editId);
        if (error) { Utils.toast('Error: ' + error.message, 'err'); return; }
      } else {
        if (!password) { Utils.toast('Contraseña requerida', 'err'); return; }
        const { error } = await SupabaseConfig.getClient().from('usuarios').insert([payload]);
        if (error) { Utils.toast('Error: ' + error.message, 'err'); return; }
      }
    } else {
      let users = Utils.lsGet('usuarios') || Auth.DEMO_USERS;
      if (editId) {
        const i = users.findIndex(u => u.id === editId);
        if (i >= 0) {
          users[i] = { ...users[i], ...payload };
          if (password) users[i].password = password;
        }
      } else {
        if (!password) { Utils.toast('Contraseña requerida', 'err'); return; }
        const exists = users.find(u => u.username === username);
        if (exists) { Utils.toast('El usuario ya existe', 'err'); return; }
        users.push({ id: Utils.generateId(), ...payload, password });
      }
      Utils.lsSet('usuarios', users);
    }

    Utils.toast('✅ Usuario guardado correctamente', 'ok');
    Modales.close('modal-usuario');
    this.load();
  }
};

window.Usuarios = Usuarios;
