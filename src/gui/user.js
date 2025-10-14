// user.js
let users = [];

async function fetchUsers() {
  try {
    const res = await fetch('/admin/users');
    users = await res.json();
    renderUsers();
  } catch (err) {
    users = [];
    renderUsers();
  }
}

function renderUsers(filter = '') {
  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';
  users.filter(u =>
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    (u.nickname && u.nickname.toLowerCase().includes(filter.toLowerCase()))
  ).forEach(u => {
    const tr = document.createElement('tr');
      tr.innerHTML = `<td class="editable" data-field="email" data-email="${u.email}">${u.email}</td><td class="editable" data-field="nickname" data-email="${u.email}">${u.nickname || ''}</td><td>
        <button onclick="loginUser('${u.email}')">Login</button>
        <button class="editUserBtn" data-email="${u.email}">Edit</button>
        <button class="deleteUserBtn" data-email="${u.email}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
    // Add action listeners
    tbody.querySelectorAll('.editUserBtn').forEach(btn => {
      btn.onclick = function() {
        alert('Edit User: ' + btn.getAttribute('data-email'));
        // TODO: Show edit form/modal
      };
    });
    tbody.querySelectorAll('.deleteUserBtn').forEach(btn => {
      btn.onclick = async function() {
        if (confirm('Delete this user?')) {
          await fetch('/admin/users/' + btn.getAttribute('data-email'), { method: 'DELETE' });
          fetchUsers();
        }
      };
    });
}

async function loginUser(email) {
  const password = prompt('Enter password for ' + email);
  if (!password) return;
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Login successful! Token: ' + (data.accessToken || 'N/A'));
    } else {
      alert('Login failed: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Login error: ' + err);
  }
}

document.getElementById('userSearch').addEventListener('input', function() {
  renderUsers(this.value);
});

document.getElementById('createUserBtn').onclick = function() {
  document.getElementById('createUserForm').style.display = '';
};
document.getElementById('cancelCreateUser').onclick = function() {
  document.getElementById('createUserForm').style.display = 'none';
  document.getElementById('createUserResult').textContent = '';
};

document.getElementById('newUserForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const nickname = form.nickname.value;
  const password = form.password.value;
  try {
    const res = await fetch('/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nickname, password })
    });
    if (res.ok) {
      document.getElementById('createUserResult').textContent = 'User created!';
      form.reset();
      fetchUsers();
    } else {
      const err = await res.json();
      document.getElementById('createUserResult').textContent = err.error || 'Error creating user.';
    }
  } catch (err) {
    document.getElementById('createUserResult').textContent = 'Network error.';
  }
};

fetchUsers();
