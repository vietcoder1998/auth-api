// token.js
let tokens = [];

async function fetchTokens() {
  try {
    const res = await fetch('/admin/tokens');
    tokens = await res.json();
    renderTokens();
  } catch (err) {
    tokens = [];
    renderTokens();
  }
}

function renderTokens() {
  const list = document.getElementById('tokenList');
  list.innerHTML = '';
  tokens.forEach(t => {
    const div = document.createElement('div');
    div.className = 'token-item';
    div.innerHTML = `<span class="editable" data-field="token" data-token="${t.accessToken}">${t.accessToken}</span> (<span class="editable" data-field="user" data-token="${t.accessToken}">${t.user?.email || ''}</span>)
      <button class="revokeTokenBtn" data-id="${t.id}">Revoke</button>`;
    list.appendChild(div);
  });
  // Add revoke action
  list.querySelectorAll('.revokeTokenBtn').forEach(btn => {
    btn.onclick = async function() {
      if (confirm('Revoke this token?')) {
        await fetch('/admin/tokens/' + btn.getAttribute('data-id'), { method: 'DELETE' });
        fetchTokens();
      }
    };
  });
  // Add create token button if not present
  if (!document.getElementById('createTokenBtn')) {
    const createBtn = document.createElement('button');
    createBtn.id = 'createTokenBtn';
    createBtn.textContent = 'Create Token';
    createBtn.style.marginTop = '1em';
    list.parentElement.appendChild(createBtn);
    createBtn.onclick = async function() {
      const userId = prompt('Enter userId for new token:');
      if (!userId) return;
      try {
        const res = await fetch('/admin/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        if (res.ok) {
          alert('Token created!');
          fetchTokens();
        } else {
          const err = await res.json();
          alert('Error: ' + (err.error || 'Failed to create token'));
        }
      } catch (err) {
        alert('Network error');
      }
    };
  }
}

fetchTokens();
