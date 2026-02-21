// ── Auth guard ────────────────────────────────────────────────────────────────
const token = localStorage.getItem('adminToken');
if (!token) window.location.href = 'index.html';

const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

// ── DOM refs ──────────────────────────────────────────────────────────────────
let currentStatus = 'pending';
let allData = [];

const cardsContainer = document.getElementById('cardsContainer');
const pendingBadge = document.getElementById('pendingBadge');
const statPending = document.getElementById('statPending');
const statApproved = document.getElementById('statApproved');
const statRejected = document.getElementById('statRejected');

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
});

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentStatus = tab.dataset.status;
        renderCards(allData.filter(s => !currentStatus || s.status === currentStatus));
    });
});

// ── Fetch all submissions ─────────────────────────────────────────────────────
async function loadSubmissions() {
    try {
        const res = await fetch('/api/submissions', { headers: authHeaders });
        if (res.status === 401) { localStorage.removeItem('adminToken'); window.location.href = 'index.html'; return; }
        allData = await res.json();

        const counts = { pending: 0, approved: 0, rejected: 0 };
        allData.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++; });
        statPending.textContent = counts.pending;
        statApproved.textContent = counts.approved;
        statRejected.textContent = counts.rejected;
        pendingBadge.textContent = `${counts.pending} pending`;

        renderCards(allData.filter(s => !currentStatus || s.status === currentStatus));
    } catch (e) {
        cardsContainer.innerHTML = '<div class="empty-state"><div class="emoji">⚠️</div><p>Failed to load submissions.</p></div>';
    }
}

// ── Render cards ──────────────────────────────────────────────────────────────
function renderCards(submissions) {
    if (!submissions.length) {
        cardsContainer.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>No ${currentStatus || ''} submissions.</p></div>`;
        return;
    }
    cardsContainer.innerHTML = submissions.map(s => cardHTML(s)).join('');

    // Photo lightbox
    cardsContainer.querySelectorAll('.card-photos img').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.src));
    });

    // Approve/Reject buttons
    cardsContainer.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, action } = btn.dataset;
            const noteInput = document.querySelector(`[data-note="${id}"]`);
            updateStatus(id, action, noteInput ? noteInput.value : '');
        });
    });

    // Delete buttons
    cardsContainer.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Delete this submission? This cannot be undone.')) deleteSubmission(btn.dataset.delete);
        });
    });
}

function statusBadge(status) {
    const labels = { pending: '⏳ Pending', approved: '✅ Published', rejected: '❌ Rejected' };
    return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

function cardHTML(s) {
    const date = new Date(s.created_at).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });
    const photos = (s.photos || []).map(f =>
        `<img src="/uploads/${f}" alt="ride photo" loading="lazy" />`
    ).join('');

    const actionBtns = s.status === 'pending' ? `
    <input class="note-input" data-note="${s.id}" placeholder="Optional note…" value="${escHtml(s.admin_note || '')}" />
    <button class="btn btn-success btn-sm" data-action="approved" data-id="${s.id}">✅ Approve</button>
    <button class="btn btn-danger  btn-sm" data-action="rejected" data-id="${s.id}">❌ Reject</button>
  ` : s.status === 'approved' ? `
    <button class="btn btn-danger btn-sm" data-action="rejected" data-id="${s.id}">❌ Unpublish</button>
  ` : `
    <button class="btn btn-success btn-sm" data-action="approved" data-id="${s.id}">✅ Re-approve</button>
  `;

    return `
  <div class="card" id="card-${s.id}">
    <div class="card-header">
      <div class="card-meta">
        <h3>${escHtml(s.title)}</h3>
        <p class="submitter">By <span>${escHtml(s.name)}</span> · ${escHtml(s.email)}</p>
      </div>
      ${statusBadge(s.status)}
      <span class="card-date">${date}</span>
    </div>
    ${photos ? `<div class="card-photos">${photos}</div>` : ''}
    <div class="card-body">
      <div class="card-field">
        <label>Route</label>
        <p>${escHtml(s.route)}</p>
      </div>
      <div class="card-field">
        <label>Experience</label>
        <p>${escHtml(s.experience)}</p>
      </div>
    </div>
    <div class="card-actions">
      ${actionBtns}
      <span class="spacer"></span>
      <button class="btn btn-ghost btn-sm" data-delete="${s.id}">🗑 Delete</button>
    </div>
  </div>`;
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Update status ─────────────────────────────────────────────────────────────
async function updateStatus(id, status, note) {
    try {
        const res = await fetch(`/api/submissions/${id}`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ status, admin_note: note })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message, 'success');
            await loadSubmissions();
        } else {
            showToast(data.error || 'Failed to update.', 'error');
        }
    } catch {
        showToast('Network error.', 'error');
    }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteSubmission(id) {
    try {
        const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE', headers: authHeaders });
        const data = await res.json();
        if (res.ok) { showToast('Deleted.', 'success'); await loadSubmissions(); }
        else showToast(data.error || 'Failed to delete.', 'error');
    } catch {
        showToast('Network error.', 'error');
    }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('open');
}
document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('open');
});
document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadSubmissions();
