/**
 * RETIRO ESPIRITUAL 2027 - APP.JS
 * Funções globais compartilhadas entre todas as telas
 */

// ===== SESSÃO =====
function getUser() {
  try {
    const s = localStorage.getItem('retiro2027_user');
    if (!s) return null;
    const u = JSON.parse(s);
    if ((Date.now() - u.timestamp) > 86400000) {
      localStorage.removeItem('retiro2027_user');
      return null;
    }
    return u;
  } catch(e) { return null; }
}

function requireAuth() {
  const u = getUser();
  if (!u) {
    window.location.href = 'login.html';
    return null;
  }
  return u;
}

function logout() {
  localStorage.removeItem('retiro2027_user');
  window.location.href = 'login.html';
}

function hasPermission(perfil, ...allowed) {
  if (perfil === 'admin') return true;
  return allowed.includes(perfil);
}

// ===== API =====
async function apiGet(table, params = {}) {
  const query = new URLSearchParams({ limit: 200, ...params }).toString();
  const r = await fetch(`tables/${table}?${query}`);
  if (!r.ok) throw new Error(`Erro ao buscar ${table}`);
  return r.json();
}

async function apiCreate(table, data) {
  const r = await fetch(`tables/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(`Erro ao criar em ${table}`);
  return r.json();
}

async function apiUpdate(table, id, data) {
  const r = await fetch(`tables/${table}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(`Erro ao atualizar ${table}`);
  return r.json();
}

async function apiPatch(table, id, data) {
  const r = await fetch(`tables/${table}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(`Erro ao atualizar ${table}`);
  return r.json();
}

async function apiDelete(table, id) {
  const r = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`Erro ao deletar ${table}`);
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
  const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#2563a8' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${icons[type]}" style="color:${colors[type]}" class="toast-icon"></i>
    <span class="toast-text">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== FORMATAÇÕES =====
function formatCPF(v) {
  return v.replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatPhone(v) {
  return v.replace(/\D/g,'').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function formatDate(d) {
  if (!d) return '-';
  if (typeof d === 'number') return new Date(d).toLocaleDateString('pt-BR');
  const [y,m,da] = d.split('-');
  if (y && m && da) return `${da}/${m}/${y}`;
  return d;
}

function formatDateTime(d) {
  if (!d) return '-';
  const dt = typeof d === 'number' ? new Date(d) : new Date(d);
  return dt.toLocaleString('pt-BR');
}

function getBadge(status) {
  const map = {
    'disponivel': '<span class="badge badge-disponivel"><i class="fas fa-circle" style="font-size:6px"></i> Disponível</span>',
    'pre_reservado': '<span class="badge badge-pendente">⏳ Pré-reserva</span>',
    'confirmado': '<span class="badge badge-confirmado">✓ Confirmado</span>',
    'cancelado': '<span class="badge badge-cancelado">✗ Cancelado</span>',
    'pendente': '<span class="badge badge-pendente">⏳ Pendente</span>',
    'quitado': '<span class="badge badge-quitado">✔ Quitado</span>',
    'fila': '<span class="badge badge-fila">📋 Fila de espera</span>',
    'checkin_feito': '<span class="badge badge-checkin">🏨 Check-in</span>',
    'checkout_feito': '<span class="badge badge-checkout">🚪 Check-out</span>',
    'parcial': '<span class="badge badge-pendente">💰 Parcial</span>',
    'pago': '<span class="badge badge-quitado">✔ Pago</span>',
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

// ===== TIPOS DE ACOMODAÇÃO =====
const TIPOS_ACOMODACAO = {
  duplo: { nome: 'Duplo', icone: '🌸', capacidade: 2, preco: 4000, adultos: 1, criancas: 2, max_acomp: 3 },
  triplo: { nome: 'Triplo', icone: '🍊', capacidade: 3, preco: 5400, adultos: 2, criancas: 1, max_acomp: 3 },
  quadruplo: { nome: 'Quádruplo', icone: '🐦', capacidade: 4, preco: 6600, adultos: 3, criancas: 1, max_acomp: 4 },
  quintuplo: { nome: 'Quíntuplo', icone: '🌳', capacidade: 5, preco: 7500, adultos: 4, criancas: 1, max_acomp: 5 },
  suite_master: { nome: 'Suíte Master', icone: '⭐', capacidade: 4, preco: 6500, adultos: 1, criancas: 2, max_acomp: 3 },
  alojamento_feminino: { nome: 'Alojamento Feminino', icone: '👩', capacidade: 1, preco: 1300, adultos: 0, criancas: 0, max_acomp: 0 },
  alojamento_masculino: { nome: 'Alojamento Masculino', icone: '👨', capacidade: 1, preco: 1300, adultos: 0, criancas: 0, max_acomp: 0 }
};

// ===== VALIDAÇÕES =====
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
  let r = 11 - (s % 11);
  if (r >= 10) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
  r = 11 - (s % 11);
  if (r >= 10) r = 0;
  return r === parseInt(cpf[10]);
}

// ===== MÁSCARA DE INPUTS =====
function maskCPF(el) {
  el.addEventListener('input', () => {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    el.value = v;
  });
}

function maskPhone(el) {
  el.addEventListener('input', () => {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    el.value = v;
  });
}

// ===== MODAL HELPERS =====
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ===== TABS =====
function initTabs(container) {
  const tabs = container.querySelectorAll('.tab-btn');
  const contents = container.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = container.querySelector(`#${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// ===== AUDITORIA =====
async function logAudit(usuario, acao, modulo, detalhes) {
  try {
    await apiCreate('auditoria', {
      usuario,
      acao,
      modulo,
      detalhes: JSON.stringify(detalhes),
      data_hora: new Date().toLocaleString('pt-BR')
    });
  } catch(e) { /* silent */ }
}

// ===== EXPORT PDF =====
function printArea(elementId, title) {
  const content = document.getElementById(elementId).innerHTML;
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial; padding: 20px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0a2340; color: white; padding: 8px 10px; font-size: 11px; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; }
        h1 { font-size: 18px; color: #0a2340; margin-bottom: 16px; }
        .badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p style="color:#666;margin-bottom:16px;">Retiro Espiritual 2027 - Igreja Batista Lírio Armação</p>
      ${content}
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

// ===== EXPORT XLSX (CSV) =====
function exportCSV(data, filename, headers) {
  const csvRows = [];
  csvRows.push(headers.join(';'));
  data.forEach(row => {
    csvRows.push(headers.map(h => {
      const key = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
      const val = row[key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(';'));
  });
  const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== SIDEBAR ATIVO =====
function setActivePage(pageId) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const navItem = document.querySelector(`[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
}
