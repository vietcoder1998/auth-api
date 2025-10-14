  async function fetchAndRenderConfigs() {
    const tbody = document.querySelector('#configTable tbody');
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    try {
      const res = await fetch('/admin/configs');
      const configs = await res.json();
      tbody.innerHTML = '';
      configs.forEach(cfg => {
        const tr = document.createElement('tr');
        if (cfg.key === 'allowed_roles') {
          // Multi-select checkbox list for roles
          let selectedRoles = [];
          try {
            selectedRoles = JSON.parse(cfg.value);
          } catch { selectedRoles = []; }
          let checkboxes = roles.map(r =>
            `<label style='margin-right:1em;'><input type='checkbox' value='${r.name}' data-id='${cfg.id}' ${selectedRoles.includes(r.name) ? 'checked' : ''}/> ${r.name}</label>`
          ).join('');
          tr.innerHTML = `<td>${cfg.key}</td><td>${checkboxes}</td><td><button data-id="${cfg.id}">Save</button> <button class="editConfigBtn" data-id="${cfg.id}">Edit</button> <button class="deleteConfigBtn" data-id="${cfg.id}">Delete</button></td>`;
        } else {
          tr.innerHTML = `<td>${cfg.key}</td><td><input type="text" value="${cfg.value}" data-id="${cfg.id}" /></td><td><button data-id="${cfg.id}">Save</button> <button class="editConfigBtn" data-id="${cfg.id}">Edit</button> <button class="deleteConfigBtn" data-id="${cfg.id}">Delete</button></td>`;
        }
        tbody.appendChild(tr);
      });
      // Add action listeners
      tbody.querySelectorAll('.editConfigBtn').forEach(btn => {
        btn.onclick = function() {
          alert('Edit Config: ' + btn.getAttribute('data-id'));
          // TODO: Show edit form/modal
        };
      });
      tbody.querySelectorAll('.deleteConfigBtn').forEach(btn => {
        btn.onclick = async function() {
          if (confirm('Delete this config?')) {
            await fetch('/config/' + btn.getAttribute('data-id'), { method: 'DELETE' });
            fetchAndRenderConfigs();
          }
        };
      });
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="3">Error loading configs</td></tr>';
    }
  }
// mail.js
async function fetchAndRenderMailTemplates() {
  const tbody = document.querySelector('#mailTemplateTable tbody');
  tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
  try {
    const res = await fetch('/admin/mail-templates');
    const templates = await res.json();
    tbody.innerHTML = '';
    templates.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.name}</td><td>${t.subject}</td><td>${t.body}</td><td>${t.active ? 'Yes' : 'No'}</td><td>${t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</td><td>${t.updatedAt ? new Date(t.updatedAt).toLocaleString() : ''}</td><td>
        <button class="editMailTemplateBtn" data-id="${t.id}">Edit</button>
        <button class="deleteMailTemplateBtn" data-id="${t.id}">Delete</button>
      </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.editMailTemplateBtn').forEach(btn => {
      btn.onclick = function() {
        alert('Edit Mail Template: ' + btn.getAttribute('data-id'));
        // TODO: Show edit form/modal
      };
    });
    tbody.querySelectorAll('.deleteMailTemplateBtn').forEach(btn => {
      btn.onclick = async function() {
        if (confirm('Delete this mail template?')) {
          await fetch('/admin/mail-templates/' + btn.getAttribute('data-id'), { method: 'DELETE' });
          fetchAndRenderMailTemplates();
        }
      };
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7">Error loading mail templates</td></tr>';
  }
}

async function fetchAndRenderNotificationTemplates() {
  const tbody = document.querySelector('#notificationTemplateTable tbody');
  tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
  try {
    const res = await fetch('/admin/notification-templates');
    const templates = await res.json();
    tbody.innerHTML = '';
    templates.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.name}</td><td>${t.title}</td><td>${t.body}</td><td>${t.active ? 'Yes' : 'No'}</td><td>${t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</td><td>${t.updatedAt ? new Date(t.updatedAt).toLocaleString() : ''}</td><td>
        <button class="editNotificationTemplateBtn" data-id="${t.id}">Edit</button>
        <button class="deleteNotificationTemplateBtn" data-id="${t.id}">Delete</button>
      </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.editNotificationTemplateBtn').forEach(btn => {
      btn.onclick = function() {
        alert('Edit Notification Template: ' + btn.getAttribute('data-id'));
        // TODO: Show edit form/modal
      };
    });
    tbody.querySelectorAll('.deleteNotificationTemplateBtn').forEach(btn => {
      btn.onclick = async function() {
        if (confirm('Delete this notification template?')) {
          await fetch('/admin/notification-templates/' + btn.getAttribute('data-id'), { method: 'DELETE' });
          fetchAndRenderNotificationTemplates();
        }
      };
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7">Error loading notification templates</td></tr>';
  }
}

document.getElementById('mailForm').onsubmit = e => {
  e.preventDefault();
  document.getElementById('mailResult').textContent = 'Mail settings saved (demo)';
};

document.getElementById('createMailTemplateBtn').onclick = function() {
  alert('Create Mail Template');
  // TODO: Show create form/modal
};
document.getElementById('createNotificationTemplateBtn').onclick = function() {
  alert('Create Notification Template');
  // TODO: Show create form/modal
};

fetchAndRenderMailTemplates();
fetchAndRenderNotificationTemplates();
