// role.js
let roles = [];
let permissions = [];

async function fetchRoles() {
  try {
    const res = await fetch('/admin/roles');
    roles = await res.json();
    renderRoles();
  } catch (err) {
    roles = [];
    renderRoles();
  }
}

async function fetchPermissions() {
  try {
    const res = await fetch('/admin/permissions');
    permissions = await res.json();
    renderRoles();
  } catch (err) {
    permissions = [];
    renderRoles();
  }
}

function renderRoles() {
  const tbody = document.querySelector('#roleTable tbody');
  tbody.innerHTML = '';
  roles.forEach(r => {
    const tr = document.createElement('tr');
    let permCheckboxes = (permissions || []).map(p =>
      `<label style='margin-right:1em;'><input type='checkbox' value='${p.name || p.id}' data-role='${r.name || r.id}' ${r.permissions && r.permissions.some(rp => rp.name === p.name) ? 'checked' : ''}/> ${p.name || p.id}</label>`
    ).join('');
      tr.innerHTML = `<td class="editable" data-field="name" data-role="${r.name || r.id}">${r.name || r.id}</td><td>${permCheckboxes}</td><td>
        <button class="editRoleBtn" data-id="${r.id}">Edit</button>
        <button class="deleteRoleBtn" data-id="${r.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
    // Add action listeners
    tbody.querySelectorAll('.editRoleBtn').forEach(btn => {
      btn.onclick = function() {
        alert('Edit Role: ' + btn.getAttribute('data-id'));
        // TODO: Show edit form/modal
      };
    });
    tbody.querySelectorAll('.deleteRoleBtn').forEach(btn => {
      btn.onclick = async function() {
        if (confirm('Delete this role?')) {
          await fetch('/admin/roles/' + btn.getAttribute('data-id'), { method: 'DELETE' });
          fetchRoles();
        }
      };
    });
}

fetchRoles();
fetchPermissions();
