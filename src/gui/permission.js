// permission.js
let permissions = [];
let roles = [];

async function fetchPermissions() {
  try {
    const res = await fetch('/admin/permissions');
    permissions = await res.json();
    renderPermissions();
  } catch (err) {
    permissions = [];
    renderPermissions();
  }
}

async function fetchRoles() {
  try {
    const res = await fetch('/admin/roles');
    roles = await res.json();
    renderPermissions();
  } catch (err) {
    roles = [];
    renderPermissions();
  }
}

function renderPermissions() {
  const tbody = document.querySelector('#permissionTable tbody');
  tbody.innerHTML = '';
  permissions.forEach((p) => {
    const tr = document.createElement('tr');
    let roleCheckboxes = (roles || [])
      .map(
        (r) =>
          `<label style='margin-right:1em;'><input type='checkbox' value='${r.name || r.id}' data-perm='${p.name || p.id}' ${p.roles && p.roles.some((pr) => pr.name === r.name) ? 'checked' : ''}/> ${r.name || r.id}</label>`,
      )
      .join('');
    tr.innerHTML = `<td class="editable" data-field="name" data-perm="${p.name || p.id}">${p.name || p.id}</td><td>${roleCheckboxes}</td><td>
        <button class="editPermissionBtn" data-id="${p.id}">Edit</button>
        <button class="deletePermissionBtn" data-id="${p.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  // Add action listeners
  tbody.querySelectorAll('.editPermissionBtn').forEach((btn) => {
    btn.onclick = function () {
      alert('Edit Permission: ' + btn.getAttribute('data-id'));
      // TODO: Show edit form/modal
    };
  });
  tbody.querySelectorAll('.deletePermissionBtn').forEach((btn) => {
    btn.onclick = async function () {
      if (confirm('Delete this permission?')) {
        await fetch('/admin/permissions/' + btn.getAttribute('data-id'), { method: 'DELETE' });
        fetchPermissions();
      }
    };
  });
}

fetchPermissions();
fetchRoles();
