// token.js
const tokens = [
  { token: 'abc123', user: 'admin@example.com' },
  { token: 'def456', user: 'user@example.com' }
];

function renderTokens() {
  const list = document.getElementById('tokenList');
  list.innerHTML = '';
  tokens.forEach(t => {
    const div = document.createElement('div');
    div.className = 'token-item';
    div.innerHTML = `<span class="editable" data-field="token" data-token="${t.token}">${t.token}</span> (<span class="editable" data-field="user" data-token="${t.token}">${t.user}</span>)
      <button onclick="alert('Revoke token')">Revoke</button>`;
    list.appendChild(div);
  });
}

renderTokens();
