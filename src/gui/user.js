// user.js
let users = [];
let loading = false;
let debounceTimeout = null;

function setLoading(isLoading) {
  loading = isLoading;
  const tbody = document.querySelector('#userTable tbody');
  if (isLoading) {
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  }
}

function showMessage(msg, type = 'info') {
  const result = document.getElementById('createUserResult');
  result.textContent = msg;
  result.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : '';
}

async function fetchUsers() {
  setLoading(true);
  try {
    const res = await fetch('/admin/users');
    users = await res.json();
    renderUsers();
  } catch (err) {
    users = [];
    renderUsers();
    showMessage('Failed to load users', 'error');
  }
  setLoading(false);
}

function renderUsers(filter = '') {
  const tbody = document.querySelector('#userTable tbody');
  if (loading) return;
  tbody.innerHTML = '';
  users.filter(u =>
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    (u.nickname && u.nickname.toLowerCase().includes(filter.toLowerCase()))
  ).forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="editable" data-field="email" data-email="${u.email}">${u.email}</td>
      <td class="editable" data-field="nickname" data-email="${u.email}">${u.nickname || ''}</td>
      <td><input type="password" class="userPasswordInput" data-email="${u.email}" placeholder="Password" style="width:100px;" />
        <button class="loginUserBtn" data-email="${u.email}">Login</button>
        <button class="editUserBtn" data-email="${u.email}">Edit</button>
        <button class="deleteUserBtn" data-email="${u.email}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  // Add action listeners
  tbody.querySelectorAll('.loginUserBtn').forEach(btn => {
    btn.onclick = async function() {
      const email = btn.getAttribute('data-email');
      const pwdInput = tbody.querySelector(`.userPasswordInput[data-email="${email}"]`);
      const password = pwdInput ? pwdInput.value : '';
      if (!password) return showMessage('Enter password for ' + email, 'error');
      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          showMessage('Login successful! Token: ' + (data.accessToken || 'N/A'), 'success');
          if (window.refreshTokens) window.refreshTokens();
        } else {
          showMessage('Login failed: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        showMessage('Login error: ' + err, 'error');
      }
    };
  });
  tbody.querySelectorAll('.editUserBtn').forEach(btn => {
    btn.onclick = function() {
      showMessage('Edit User: ' + btn.getAttribute('data-email'));
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

document.getElementById('userSearch').addEventListener('input', function() {
  clearTimeout(debounceTimeout);
  const val = this.value;
  debounceTimeout = setTimeout(() => renderUsers(val), 300);
});

document.getElementById('createUserBtn').onclick = function() {
  document.getElementById('createUserForm').style.display = '';
};
document.getElementById('cancelCreateUser').onclick = function() {
  document.getElementById('createUserForm').style.display = 'none';
  showMessage('');
};

document.getElementById('newUserForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const nickname = form.nickname.value;
  const password = form.password.value;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (users.some(u => u.email === email)) {
      showMessage('Email already exists.', 'error');
      return;
    }
    users.push({ email, nickname, password });
    showMessage('User created! (mock)', 'success');
    form.reset();
    renderUsers();
    return;
  }
  try {
    const res = await fetch('/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nickname, password })
    });
    if (res.ok) {
      showMessage('User created!', 'success');
      form.reset();
      fetchUsers();
    } else {
      const err = await res.json();
      showMessage(err.error || 'Error creating user.', 'error');
    }
  } catch (err) {
    showMessage('Network error.', 'error');
  }
};

window.refreshTokens = async function() {
  if (window.renderTokens) {
    if (typeof fetchTokens === 'function') {
      await fetchTokens();
    } else {
      window.renderTokens();
    }
  }
};

fetchUsers();
