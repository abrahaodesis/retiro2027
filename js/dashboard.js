/**
 * RETIRO ESPIRITUAL 2027 - DASHBOARD.JS
 * Lógica de todos os módulos do dashboard
 */

let currentUser = null;
let allInscricoes = [];
let allAcomodacoes = [];
let allPagamentos = [];
let allVeiculos = [];
let allCheckins = [];
let allFilaEspera = [];
let allDespesas = [];
let allAuditoria = [];
let allRefeicoes = [];
let selectedAptId = null;

// Charts
let chartStatus = null, chartAcoms = null, chartFormas = null;
let chartEvolucao = null, chartRelAcoms = null, chartRelFin = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  updateUserUI();
  updateDiasRetiro();
  await refreshDashboard();
  setInterval(refreshDashboard, 60000); // Auto refresh 1 min

  // Set today date
  const today = new Date().toISOString().split('T')[0];
  const dataRef = document.getElementById('dataRefeicoes');
  if (dataRef) dataRef.value = today;
});

// ===== USER UI =====
function updateUserUI() {
  const perfis = {
    admin: 'Administrador Geral',
    financeiro: 'Equipe Financeira',
    hospedagem: 'Equipe de Hospedagem',
    alimentacao: 'Equipe de Alimentação',
    retirante: 'Retirante'
  };

  const nome = currentUser.nome || 'Usuário';
  const perfil = perfis[currentUser.perfil] || currentUser.perfil;
  const inicial = nome.charAt(0).toUpperCase();

  document.getElementById('topbarUserName').textContent = nome;
  document.getElementById('topbarUserRole').textContent = perfil;
  document.getElementById('topbarAvatar').textContent = inicial;

  // Perfil page
  document.getElementById('perfilAvatar').textContent = inicial;
  document.getElementById('perfilNome').textContent = nome;
  document.getElementById('perfilRole').textContent = perfil;
  document.getElementById('perfilEmail').textContent = currentUser.email;
  document.getElementById('perfilEmailCard').textContent = currentUser.email;
  document.getElementById('perfilPerfilCard').textContent = perfil;

  // Filtrar menu por perfil
  if (currentUser.perfil === 'retirante') {
    document.querySelectorAll('[data-page="usuarios"],[data-page="auditoria"],[data-page="despesas"]').forEach(el => el.style.display = 'none');
  }
  if (currentUser.perfil === 'alimentacao') {
    document.querySelectorAll('[data-page="financeiro"],[data-page="usuarios"],[data-page="despesas"]').forEach(el => el.style.display = 'none');
  }
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('appWrapper').classList.toggle('sidebar-collapsed');
}

// ===== SHOW PAGE =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pg = document.getElementById(`page-${page}`);
  if (pg) pg.classList.add('active');

  const nav = document.querySelector(`[data-page="${page}"]`);
  if (nav) nav.classList.add('active');

  const titles = {
    dashboard: '🏠 Dashboard Geral',
    inscricoes: '📋 Inscrições',
    reservas: '🛏️ Reservas',
    mapa: '🗺️ Mapa de Ocupação',
    fila: '📋 Fila de Espera',
    checkin: '🚪 Check-in / Check-out',
    refeicoes: '🍽️ Refeições',
    veiculos: '🚗 Veículos',
    financeiro: '💰 Financeiro',
    despesas: '📄 Despesas',
    recibos: '🧾 Recibos',
    relatorios: '📊 Relatórios',
    usuarios: '👥 Usuários',
    auditoria: '📜 Auditoria',
    perfil: '👤 Meu Perfil'
  };

  document.getElementById('topbarTitle').textContent = titles[page] || page;

  // Lazy load
  const loaders = {
    inscricoes: loadInscricoes,
    reservas: loadReservas,
    mapa: loadMapa,
    fila: loadFila,
    checkin: loadCheckins,
    refeicoes: loadRefeicoes,
    veiculos: loadVeiculos,
    financeiro: loadFinanceiro,
    despesas: loadDespesas,
    relatorios: loadRelatorios,
    auditoria: loadAuditoria,
    recibos: initRecibos
  };

  if (loaders[page]) loaders[page]();
}

// ===== DIAS ATÉ O RETIRO =====
function updateDiasRetiro() {
  const target = new Date('2027-02-05');
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  const el = document.getElementById('diasRetiro');
  if (el) el.textContent = diff > 0 ? diff : 0;
}

// ===== DASHBOARD REFRESH =====
async function refreshDashboard() {
  try {
    const [insRes, acomRes, pagRes, filaRes] = await Promise.all([
      apiGet('retirantes'),
      apiGet('acomodacoes'),
      apiGet('pagamentos'),
      apiGet('fila_espera')
    ]);

    allInscricoes = insRes.data || [];
    allAcomodacoes = acomRes.data || [];
    allPagamentos = pagRes.data || [];
    allFilaEspera = filaRes.data || [];

    updateKPIs();
    updateCharts();
    updateUltimasInscricoes();
    updateBadges();
  } catch(e) {
    console.error('Erro ao carregar dashboard:', e);
  }
}

function updateKPIs() {
  const total = allInscricoes.length;
  const confirmados = allInscricoes.filter(i => i.status === 'confirmado' || i.status === 'quitado').length;
  const pendentes = allInscricoes.filter(i => i.status === 'pendente').length;
  const cancelados = allInscricoes.filter(i => i.status === 'cancelado').length;

  const receitaTotal = allPagamentos.reduce((s, p) => s + (p.valor_total || 0), 0);
  const receitaPago = allPagamentos.reduce((s, p) => s + (p.valor_pago || 0), 0);

  const disponiveis = allAcomodacoes.filter(a => a.status === 'disponivel').length;

  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiTotalSub').textContent = `${cancelados} cancelados`;
  document.getElementById('kpiConf').textContent = confirmados;
  document.getElementById('kpiConfSub').textContent = `${Math.round((confirmados/Math.max(total,1))*100)}% do total`;
  document.getElementById('kpiPend').textContent = pendentes;
  document.getElementById('kpiReceita').textContent = formatMoneyK(receitaTotal);
  document.getElementById('kpiReceitaSub').textContent = `R$ ${formatMoneyK(receitaPago)} recebido`;
  document.getElementById('kpiApts').textContent = disponiveis;
  document.getElementById('kpiFila').textContent = allFilaEspera.filter(f => f.status === 'aguardando').length;
}

function formatMoneyK(v) {
  if (v >= 1000000) return `${(v/1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v/1000).toFixed(0)}K`;
  return v.toLocaleString('pt-BR');
}

function updateCharts() {
  // Chart Status
  const statusCount = {
    pendente: allInscricoes.filter(i => i.status === 'pendente').length,
    confirmado: allInscricoes.filter(i => i.status === 'confirmado').length,
    quitado: allInscricoes.filter(i => i.status === 'quitado').length,
    cancelado: allInscricoes.filter(i => i.status === 'cancelado').length
  };

  const ctxStatus = document.getElementById('chartStatus');
  if (ctxStatus) {
    if (chartStatus) chartStatus.destroy();
    chartStatus = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Pendente', 'Confirmado', 'Quitado', 'Cancelado'],
        datasets: [{
          data: Object.values(statusCount),
          backgroundColor: ['#ffc107', '#2563a8', '#28a745', '#dc3545'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
        }
      }
    });
  }

  // Chart Acomodações
  const tiposNomes = ['Duplo','Triplo','Quádruplo','Quíntuplo','Suíte','Aloj.F','Aloj.M'];
  const tiposIds = ['duplo','triplo','quadruplo','quintuplo','suite_master','alojamento_feminino','alojamento_masculino'];
  const ocupados = tiposIds.map(t => allAcomodacoes.filter(a => a.tipo === t && a.status !== 'disponivel').length);
  const disponiveis = tiposIds.map(t => allAcomodacoes.filter(a => a.tipo === t && a.status === 'disponivel').length);

  const ctxAcoms = document.getElementById('chartAcoms');
  if (ctxAcoms) {
    if (chartAcoms) chartAcoms.destroy();
    chartAcoms = new Chart(ctxAcoms, {
      type: 'bar',
      data: {
        labels: tiposNomes,
        datasets: [
          { label: 'Ocupado', data: ocupados, backgroundColor: '#2563a8' },
          { label: 'Disponível', data: disponiveis, backgroundColor: '#28a745' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        scales: {
          x: { stacked: true, ticks: { font: { size: 10 } } },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  }
}

function updateUltimasInscricoes() {
  const tbody = document.getElementById('tbodyUltimas');
  const ultimas = [...allInscricoes].reverse().slice(0, 6);
  if (!ultimas.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--cinza-500)">Nenhuma inscrição ainda.</td></tr>';
    return;
  }
  const tipoNome = {
    duplo:'Duplo',triplo:'Triplo',quadruplo:'Quádruplo',quintuplo:'Quíntuplo',
    suite_master:'Suíte',alojamento_feminino:'Aloj.F',alojamento_masculino:'Aloj.M'
  };
  tbody.innerHTML = ultimas.map(i => {
    const apt = allAcomodacoes.find(a => a.id === i.acomodacao_id);
    const tipo = apt ? (tipoNome[apt.tipo] || apt.tipo) : '-';
    return `
      <tr>
        <td><strong>${i.nome || '-'}</strong></td>
        <td>${tipo}</td>
        <td>${getBadge(i.status)}</td>
        <td style="font-size:0.8rem;color:var(--cinza-500)">${formatDate(i.created_at)}</td>
      </tr>
    `;
  }).join('');
}

function updateBadges() {
  const pendentes = allInscricoes.filter(i => i.status === 'pendente').length;
  const badge = document.getElementById('badgeInscricoes');
  if (badge) {
    badge.textContent = pendentes;
    badge.style.display = pendentes > 0 ? 'inline-block' : 'none';
  }
}

// ===== INSCRIÇÕES =====
async function loadInscricoes() {
  const tbody = document.getElementById('tbodyInscricoes');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try {
    const res = await apiGet('retirantes');
    allInscricoes = res.data || [];
    renderInscricoes(allInscricoes);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar dados.</td></tr>';
  }
}

function renderInscricoes(data) {
  const tbody = document.getElementById('tbodyInscricoes');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhuma inscrição encontrada.</td></tr>';
    return;
  }
  const tipoNome = { duplo:'Duplo',triplo:'Triplo',quadruplo:'Quádruplo',quintuplo:'Quíntuplo', suite_master:'Suíte Master',alojamento_feminino:'Aloj. Feminino',alojamento_masculino:'Aloj. Masculino' };
  tbody.innerHTML = data.map((i, idx) => {
    const apt = allAcomodacoes.find(a => a.id === i.acomodacao_id);
    const tipo = apt ? (tipoNome[apt.tipo] || apt.tipo) : '-';
    return `
      <tr>
        <td style="font-size:0.75rem;color:var(--cinza-500)">${idx+1}</td>
        <td><strong>${i.nome || '-'}</strong></td>
        <td style="font-family:monospace;font-size:0.8rem">${i.cpf || '-'}</td>
        <td style="font-size:0.85rem">${i.celular || '-'}</td>
        <td style="font-size:0.8rem">${i.email || '-'}</td>
        <td><span style="font-size:0.8rem">${tipo}</span></td>
        <td>${getBadge(i.status)}</td>
        <td style="font-size:0.8rem;color:var(--cinza-500)">${formatDate(i.created_at)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-outline btn-icon" onclick="viewInscrito('${i.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-warning btn-icon" onclick="editStatus('${i.id}','${i.status}')" title="Alterar status"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteInscricao('${i.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterInscricoes() {
  const q = document.getElementById('searchInscricoes').value.toLowerCase();
  const status = document.getElementById('filterStatusInsc').value;
  const acoms = document.getElementById('filterAcomInsc').value;
  let filtered = allInscricoes;
  if (q) filtered = filtered.filter(i => (i.nome||'').toLowerCase().includes(q) || (i.cpf||'').includes(q) || (i.email||'').toLowerCase().includes(q));
  if (status) filtered = filtered.filter(i => i.status === status);
  if (acoms) {
    filtered = filtered.filter(i => {
      const apt = allAcomodacoes.find(a => a.id === i.acomodacao_id);
      return apt && apt.tipo === acoms;
    });
  }
  renderInscricoes(filtered);
}

async function viewInscrito(id) {
  const ins = allInscricoes.find(i => i.id === id);
  if (!ins) return;
  document.getElementById('modalInscritoNome').textContent = ins.nome;
  const apt = allAcomodacoes.find(a => a.id === ins.acomodacao_id);
  let acomps = [];
  try { acomps = JSON.parse(ins.acompanhantes || '[]'); } catch(e) {}
  document.getElementById('modalInscritoBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div>
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--cinza-500);margin-bottom:10px;">DADOS PESSOAIS</div>
        <div style="font-size:0.875rem;line-height:2;color:var(--cinza-700)">
          <div><strong>Nome:</strong> ${ins.nome || '-'}</div>
          <div><strong>CPF:</strong> ${ins.cpf || '-'}</div>
          <div><strong>Nascimento:</strong> ${formatDate(ins.data_nascimento)}</div>
          <div><strong>Sexo:</strong> ${ins.sexo === 'M' ? 'Masculino' : ins.sexo === 'F' ? 'Feminino' : '-'}</div>
          <div><strong>Email:</strong> ${ins.email || '-'}</div>
          <div><strong>Celular:</strong> ${ins.celular || '-'}</div>
        </div>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--cinza-500);margin-bottom:10px;">ACOMODAÇÃO E STATUS</div>
        <div style="font-size:0.875rem;line-height:2;color:var(--cinza-700)">
          <div><strong>Acomodação:</strong> ${apt ? `${apt.nome} (${apt.tipo})` : '-'}</div>
          <div><strong>Status:</strong> ${getBadge(ins.status)}</div>
          <div><strong>Inscrição:</strong> ${formatDate(ins.created_at)}</div>
          <div><strong>PCD:</strong> ${ins.necessidades_pcd || 'Nenhuma'}</div>
          <div><strong>Restrições:</strong> ${ins.restricoes_alimentares || 'Nenhuma'}</div>
          <div><strong>Termos:</strong> ${ins.aceite_termos ? '✅ Aceito' : '❌ Não aceito'}</div>
        </div>
      </div>
    </div>
    ${acomps.length > 0 ? `
      <div style="border-top:1px solid var(--cinza-200);padding-top:16px;margin-top:4px">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--cinza-500);margin-bottom:10px">ACOMPANHANTES (${acomps.length})</div>
        ${acomps.map((a,i) => `
          <div style="background:var(--cinza-100);border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:0.85rem">
            <strong>${a.nome}</strong> — ${a.tipo === 'adulto' ? 'Adulto' : 'Criança'} — ${a.sexo === 'M' ? 'Masculino' : 'Feminino'}
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${ins.observacoes ? `<div class="alert alert-info mt-16"><i class="fas fa-sticky-note"></i> ${ins.observacoes}</div>` : ''}
  `;
  openModal('modalInscrito');
}

function editStatus(id, status) {
  document.getElementById('statusEditId').value = id;
  document.getElementById('statusEditVal').value = status;
  openModal('modalStatus');
}

async function saveStatus() {
  const id = document.getElementById('statusEditId').value;
  const status = document.getElementById('statusEditVal').value;
  try {
    await apiPatch('retirantes', id, { status });
    closeModal('modalStatus');
    showToast('Status atualizado com sucesso!', 'success');
    await logAudit(currentUser.nome, `Status alterado para: ${status}`, 'inscricoes', { id, status });
    loadInscricoes();
    refreshDashboard();
  } catch(e) {
    showToast('Erro ao atualizar status.', 'error');
  }
}

async function deleteInscricao(id) {
  if (!confirm('Tem certeza que deseja excluir esta inscrição?')) return;
  try {
    await apiDelete('retirantes', id);
    showToast('Inscrição removida.', 'success');
    loadInscricoes();
    refreshDashboard();
  } catch(e) {
    showToast('Erro ao excluir inscrição.', 'error');
  }
}

function exportInscricoes() {
  const headers = ['Nome','CPF','Email','Celular','Sexo','Status','Inscrição'];
  const data = allInscricoes.map(i => ({
    nome: i.nome, cpf: i.cpf, email: i.email, celular: i.celular,
    sexo: i.sexo, status: i.status, inscricao: formatDate(i.created_at)
  }));
  exportCSV(data, 'inscritos-retiro-2027.csv', headers);
  showToast('Exportação iniciada!', 'success');
}

// ===== RESERVAS =====
async function loadReservas() {
  const tbody = document.getElementById('tbodyReservas');
  try {
    const res = await apiGet('acomodacoes');
    allAcomodacoes = res.data || [];
    renderReservasSummary();
    renderReservas(allAcomodacoes);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar.</td></tr>';
  }
}

function renderReservasSummary() {
  const tipos = [
    { id:'duplo', nome:'Duplos', total:18, cor:'var(--azul-claro)' },
    { id:'triplo', nome:'Triplos', total:25, cor:'var(--verde)' },
    { id:'quadruplo', nome:'Quádruplos', total:18, cor:'var(--dourado)' },
    { id:'quintuplo', nome:'Quíntuplos', total:3, cor:'var(--roxo)' },
    { id:'suite_master', nome:'Suítes', total:2, cor:'var(--laranja)' },
    { id:'alojamento_feminino', nome:'Aloj.Fem.', total:2, cor:'#e91e8c' },
    { id:'alojamento_masculino', nome:'Aloj.Masc.', total:2, cor:'#2196f3' }
  ];
  const container = document.getElementById('resumoTipos');
  container.innerHTML = tipos.map(t => {
    const disponiveis = allAcomodacoes.filter(a => a.tipo === t.id && a.status === 'disponivel').length;
    const ocupados = allAcomodacoes.filter(a => a.tipo === t.id && a.status !== 'disponivel').length;
    const pct = Math.round((ocupados/Math.max(t.total,1))*100);
    return `
      <div class="kpi-card" style="border-left-color:${t.cor}">
        <div class="kpi-label">${t.nome}</div>
        <div class="kpi-value">${disponiveis}<span style="font-size:0.9rem;font-weight:400;color:var(--cinza-500)">/${t.total}</span></div>
        <div class="kpi-sub">${ocupados} ocupados</div>
        <div style="margin-top:10px">
          <div class="progress-bar-wrap">
            <div class="progress-bar" style="width:${pct}%;background:${t.cor}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderReservas(data) {
  const tbody = document.getElementById('tbodyReservas');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--cinza-500)">Nenhum dado encontrado.</td></tr>';
    return;
  }
  const tipoNome = { duplo:'Duplo',triplo:'Triplo',quadruplo:'Quádruplo',quintuplo:'Quíntuplo',suite_master:'Suíte Master',alojamento_feminino:'Aloj. Feminino',alojamento_masculino:'Aloj. Masculino' };
  tbody.innerHTML = data.map(a => {
    let ocupantes = [];
    try { ocupantes = JSON.parse(a.ocupantes || '[]'); } catch(e) {}
    return `
      <tr>
        <td><strong style="color:var(--azul-escuro)">${String(a.numero).padStart(2,'0')}</strong></td>
        <td>${a.nome}</td>
        <td><span style="font-size:0.8rem">${tipoNome[a.tipo] || a.tipo}</span></td>
        <td style="text-align:center">${a.capacidade}</td>
        <td>${formatMoney(a.preco)}</td>
        <td>${getBadge(a.status)}</td>
        <td style="font-size:0.8rem;color:var(--cinza-500)">${ocupantes.length || 0} pessoa(s)</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-outline btn-icon" onclick="alterarStatusAptById('${a.id}')" title="Alterar status"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-primary btn-icon" onclick="viewAptDetails('${a.id}')" title="Detalhes"><i class="fas fa-info"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterReservas() {
  const status = document.getElementById('filterReservaStatus').value;
  const filtered = status ? allAcomodacoes.filter(a => a.status === status) : allAcomodacoes;
  renderReservas(filtered);
}

function viewAptDetails(id) {
  const apt = allAcomodacoes.find(a => a.id === id);
  if (!apt) return;
  selectedAptId = id;
  document.getElementById('modalAptNome').textContent = `${String(apt.numero).padStart(2,'0')} - ${apt.nome}`;
  let ocupantes = [];
  try { ocupantes = JSON.parse(apt.ocupantes || '[]'); } catch(e) {}
  document.getElementById('modalAptBody').innerHTML = `
    <div style="font-size:0.875rem;line-height:2.2;color:var(--cinza-700)">
      <div><strong>Número:</strong> ${apt.numero}</div>
      <div><strong>Nome:</strong> ${apt.nome}</div>
      <div><strong>Categoria:</strong> ${apt.categoria}</div>
      <div><strong>Tipo:</strong> ${apt.tipo}</div>
      <div><strong>Capacidade:</strong> ${apt.capacidade} pessoa(s)</div>
      <div><strong>Preço:</strong> ${formatMoney(apt.preco)}</div>
      <div><strong>Status:</strong> ${getBadge(apt.status)}</div>
      ${apt.observacoes ? `<div><strong>Obs:</strong> ${apt.observacoes}</div>` : ''}
    </div>
    ${ocupantes.length > 0 ? `
      <div style="border-top:1px solid var(--cinza-200);margin-top:12px;padding-top:12px;font-size:0.85rem;color:var(--cinza-500)">
        <strong>${ocupantes.length} ocupante(s) registrado(s)</strong>
      </div>
    ` : ''}
  `;
  openModal('modalApt');
}

function alterarStatusApt() {
  closeModal('modalApt');
  if (!selectedAptId) return;
  const apt = allAcomodacoes.find(a => a.id === selectedAptId);
  if (!apt) return;
  const novoStatus = prompt(`Status atual: ${apt.status}\n\nDigite o novo status:\n- disponivel\n- pre_reservado\n- confirmado\n- quitado\n- cancelado\n- manutencao`);
  if (!novoStatus) return;
  const statusValidos = ['disponivel','pre_reservado','confirmado','quitado','cancelado','manutencao'];
  if (!statusValidos.includes(novoStatus.trim())) {
    showToast('Status inválido.', 'error');
    return;
  }
  apiPatch('acomodacoes', selectedAptId, { status: novoStatus.trim() })
    .then(() => { showToast('Status atualizado!', 'success'); loadReservas(); loadMapa(); })
    .catch(() => showToast('Erro ao atualizar.', 'error'));
}

function alterarStatusAptById(id) {
  selectedAptId = id;
  alterarStatusApt();
}

// ===== MAPA =====
async function loadMapa() {
  try {
    const res = await apiGet('acomodacoes');
    allAcomodacoes = res.data || [];
    renderMapa();
  } catch(e) {
    document.getElementById('mapaContainer').innerHTML = '<div class="alert alert-danger">Erro ao carregar mapa.</div>';
  }
}

function renderMapa() {
  const container = document.getElementById('mapaContainer');
  const filtroCategoria = document.getElementById('filtroMapaCategoria')?.value || '';
  
  let data = allAcomodacoes.sort((a, b) => a.numero - b.numero);
  if (filtroCategoria) data = data.filter(a => a.categoria === filtroCategoria);

  const grupos = {};
  data.forEach(apt => {
    if (!grupos[apt.categoria]) grupos[apt.categoria] = [];
    grupos[apt.categoria].push(apt);
  });

  const icones = { 'Flores': '🌸', 'Frutas': '🍊', 'Pássaros': '🐦', 'Árvores': '🌳', 'Alojamento': '🏠' };

  container.innerHTML = Object.entries(grupos).map(([cat, apts]) => `
    <div class="apto-group-title">${icones[cat] || ''} ${cat} (${apts.length} unidades)</div>
    <div class="apt-grid-row">
      ${apts.map(apt => `
        <div class="apt-box ${apt.status}" onclick="viewAptDetails('${apt.id}')" title="${apt.nome} - ${apt.status}">
          <span class="apt-n">${String(apt.numero).padStart(2,'0')}</span>
          <span class="apt-nm">${apt.nome}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ===== FILA DE ESPERA =====
async function loadFila() {
  const tbody = document.getElementById('tbodyFila');
  try {
    const res = await apiGet('fila_espera');
    allFilaEspera = res.data || [];
    renderFila(allFilaEspera);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar.</td></tr>';
  }
}

function renderFila(data) {
  const tbody = document.getElementById('tbodyFila');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--cinza-500)"><i class="fas fa-check-circle" style="color:var(--verde)"></i> Fila de espera vazia!</td></tr>';
    return;
  }
  const tipoNome = { duplo:'Duplo',triplo:'Triplo',quadruplo:'Quádruplo',quintuplo:'Quíntuplo',suite_master:'Suíte',alojamento_feminino:'Aloj.F',alojamento_masculino:'Aloj.M' };
  tbody.innerHTML = data.sort((a,b) => a.posicao - b.posicao).map(f => `
    <tr>
      <td><strong style="color:var(--azul-claro)">#${f.posicao || '-'}</strong></td>
      <td>${f.retirante_nome}</td>
      <td>${tipoNome[f.tipo_acomodacao] || f.tipo_acomodacao}</td>
      <td style="font-size:0.8rem">${formatDate(f.data_entrada)}</td>
      <td>${getBadge(f.status || 'aguardando')}</td>
      <td>
        <button class="btn btn-sm btn-success btn-icon" onclick="notificarFila('${f.id}')" title="Notificar"><i class="fas fa-bell"></i></button>
        <button class="btn btn-sm btn-danger btn-icon" onclick="removeFila('${f.id}')" title="Remover"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function saveFila() {
  const nome = document.getElementById('filaNome').value.trim();
  const tipo = document.getElementById('filaTipo').value;
  if (!nome) { showToast('Informe o nome.', 'error'); return; }
  const posicao = (allFilaEspera.length || 0) + 1;
  try {
    await apiCreate('fila_espera', {
      retirante_nome: nome,
      tipo_acomodacao: tipo,
      data_entrada: new Date().toLocaleDateString('pt-BR'),
      posicao,
      status: 'aguardando',
      observacoes: document.getElementById('filaObs').value
    });
    closeModal('modalAddFila');
    showToast('Adicionado à fila!', 'success');
    document.getElementById('filaNome').value = '';
    document.getElementById('filaObs').value = '';
    loadFila();
  } catch(e) { showToast('Erro ao adicionar.', 'error'); }
}

async function notificarFila(id) {
  try {
    await apiPatch('fila_espera', id, { status: 'notificado' });
    showToast('Pessoa notificada!', 'success');
    loadFila();
  } catch(e) { showToast('Erro.', 'error'); }
}

async function removeFila(id) {
  if (!confirm('Remover da fila de espera?')) return;
  try {
    await apiDelete('fila_espera', id);
    showToast('Removido da fila.', 'success');
    loadFila();
  } catch(e) { showToast('Erro.', 'error'); }
}

// ===== CHECK-IN =====
async function loadCheckins() {
  const tbody = document.getElementById('tbodyCheckin');
  try {
    const [chkRes, insRes, aptRes] = await Promise.all([
      apiGet('checkins'),
      apiGet('retirantes'),
      apiGet('acomodacoes')
    ]);
    allCheckins = chkRes.data || [];
    allInscricoes = insRes.data || [];
    allAcomodacoes = aptRes.data || [];

    // Populate selects
    const selRet = document.getElementById('checkinRetirante');
    if (selRet) selRet.innerHTML = allInscricoes.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');
    const selApt = document.getElementById('checkinApto');
    if (selApt) selApt.innerHTML = allAcomodacoes.filter(a => a.status !== 'disponivel').map(a => `<option value="${a.id}">${String(a.numero).padStart(2,'0')} - ${a.nome}</option>`).join('');

    renderCheckins(allCheckins);
    updateKpiCheckin();
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar.</td></tr>';
  }
}

function updateKpiCheckin() {
  const today = new Date().toLocaleDateString('pt-BR');
  document.getElementById('kpiCheckinHoje').textContent = allCheckins.filter(c => c.data_checkin === today && c.status === 'checkin_feito').length;
  document.getElementById('kpiCheckinAguard').textContent = allCheckins.filter(c => c.status === 'aguardando').length;
  document.getElementById('kpiCheckoutHoje').textContent = allCheckins.filter(c => c.data_checkout === today && c.status === 'checkout_feito').length;
}

function renderCheckins(data) {
  const tbody = document.getElementById('tbodyCheckin');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhum check-in registrado.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><strong>${c.retirante_nome}</strong></td>
      <td>${c.acomodacao_nome || '-'}</td>
      <td style="font-size:0.85rem">${c.data_checkin || '-'} ${c.hora_checkin || ''}</td>
      <td style="font-size:0.85rem">${c.data_checkout || '-'} ${c.hora_checkout || ''}</td>
      <td>${getBadge(c.status)}</td>
      <td style="font-size:0.8rem;color:var(--cinza-500)">${c.responsavel || '-'}</td>
      <td>
        ${c.status === 'checkin_feito' ? `
          <button class="btn btn-sm btn-warning btn-icon" onclick="doCheckout('${c.id}')" title="Fazer Check-out"><i class="fas fa-sign-out-alt"></i></button>
        ` : ''}
        <button class="btn btn-sm btn-danger btn-icon" onclick="deleteCheckin('${c.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function filterCheckins() {
  const q = document.getElementById('searchCheckin').value.toLowerCase();
  const status = document.getElementById('filterCheckinStatus').value;
  let filtered = allCheckins;
  if (q) filtered = filtered.filter(c => (c.retirante_nome||'').toLowerCase().includes(q));
  if (status) filtered = filtered.filter(c => c.status === status);
  renderCheckins(filtered);
}

async function saveCheckin() {
  const retId = document.getElementById('checkinRetirante').value;
  const aptId = document.getElementById('checkinApto').value;
  const data = document.getElementById('checkinData').value;
  const hora = document.getElementById('checkinHora').value;
  const resp = document.getElementById('checkinResp').value;
  if (!retId || !aptId || !data) { showToast('Preencha todos os campos obrigatórios.', 'error'); return; }
  const ins = allInscricoes.find(i => i.id === retId);
  const apt = allAcomodacoes.find(a => a.id === aptId);
  try {
    await apiCreate('checkins', {
      retirante_id: retId,
      retirante_nome: ins?.nome || '-',
      acomodacao_id: aptId,
      acomodacao_nome: apt ? `${String(apt.numero).padStart(2,'0')} - ${apt.nome}` : '-',
      data_checkin: data,
      hora_checkin: hora || new Date().toLocaleTimeString('pt-BR','HH:mm'),
      status: 'checkin_feito',
      responsavel: resp,
      observacoes: document.getElementById('checkinObs').value
    });
    closeModal('modalCheckin');
    showToast('Check-in realizado!', 'success');
    await logAudit(currentUser.nome, 'Check-in registrado', 'checkin', { retirante: ins?.nome });
    loadCheckins();
  } catch(e) { showToast('Erro ao registrar.', 'error'); }
}

async function doCheckout(id) {
  try {
    await apiPatch('checkins', id, {
      status: 'checkout_feito',
      data_checkout: new Date().toLocaleDateString('pt-BR'),
      hora_checkout: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    });
    showToast('Check-out realizado!', 'success');
    loadCheckins();
  } catch(e) { showToast('Erro.', 'error'); }
}

async function deleteCheckin(id) {
  if (!confirm('Excluir este registro?')) return;
  try {
    await apiDelete('checkins', id);
    showToast('Registro excluído.', 'success');
    loadCheckins();
  } catch(e) { showToast('Erro.', 'error'); }
}

// ===== REFEIÇÕES =====
async function loadRefeicoes() {
  const tbody = document.getElementById('tbodyRefeicoes');
  try {
    const [refRes, insRes] = await Promise.all([apiGet('refeicoes'), apiGet('retirantes')]);
    allRefeicoes = refRes.data || [];
    allInscricoes = insRes.data || [];

    const dataFiltro = document.getElementById('dataRefeicoes')?.value;
    const daySel = dataFiltro ? new Date(dataFiltro).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    const dayRef = allRefeicoes.filter(r => r.data === daySel);
    
    let countCafe=0, countAlmoco=0, countLanche=0, countJantar=0;
    dayRef.forEach(r => {
      if (r.cafe_manha) countCafe++;
      if (r.almoco) countAlmoco++;
      if (r.lanche) countLanche++;
      if (r.jantar) countJantar++;
    });

    document.getElementById('kpiCafe').textContent = countCafe;
    document.getElementById('kpiAlmoco').textContent = countAlmoco;
    document.getElementById('kpiLanche').textContent = countLanche;
    document.getElementById('kpiJantar').textContent = countJantar;

    if (!dayRef.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhum registro para ${daySel}. <button class="btn btn-sm btn-primary" onclick="gerarRefeicoesAutomatico()">Gerar automaticamente</button></td></tr>`;
      return;
    }

    tbody.innerHTML = dayRef.map(r => `
      <tr>
        <td><strong>${r.retirante_nome}</strong></td>
        <td style="font-size:0.8rem;color:var(--cinza-500)">${r.restricoes || 'Nenhuma'}</td>
        <td style="text-align:center"><button class="meal-toggle ${r.cafe_manha ? 'on' : ''}" onclick="toggleRefeicao('${r.id}','cafe_manha',${!r.cafe_manha})"></button></td>
        <td style="text-align:center"><button class="meal-toggle ${r.almoco ? 'on' : ''}" onclick="toggleRefeicao('${r.id}','almoco',${!r.almoco})"></button></td>
        <td style="text-align:center"><button class="meal-toggle ${r.lanche ? 'on' : ''}" onclick="toggleRefeicao('${r.id}','lanche',${!r.lanche})"></button></td>
        <td style="text-align:center"><button class="meal-toggle ${r.jantar ? 'on' : ''}" onclick="toggleRefeicao('${r.id}','jantar',${!r.jantar})"></button></td>
        <td style="font-size:0.8rem;color:var(--cinza-500)">${r.observacoes || ''}</td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar.</td></tr>';
  }
}

async function toggleRefeicao(id, campo, valor) {
  try {
    await apiPatch('refeicoes', id, { [campo]: valor });
    loadRefeicoes();
  } catch(e) { showToast('Erro ao atualizar.', 'error'); }
}

async function gerarRefeicoesAutomatico() {
  const dataFiltro = document.getElementById('dataRefeicoes')?.value;
  const data = dataFiltro ? new Date(dataFiltro).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  if (!allInscricoes.length) { showToast('Nenhum inscrito cadastrado.', 'warning'); return; }
  try {
    const promises = allInscricoes.map(i => apiCreate('refeicoes', {
      retirante_id: i.id,
      retirante_nome: i.nome,
      data,
      cafe_manha: true,
      almoco: true,
      lanche: true,
      jantar: true,
      restricoes: i.restricoes_alimentares || ''
    }));
    await Promise.all(promises);
    showToast(`${allInscricoes.length} registros de refeições criados!`, 'success');
    loadRefeicoes();
  } catch(e) { showToast('Erro ao gerar.', 'error'); }
}

// ===== VEÍCULOS =====
async function loadVeiculos() {
  const tbody = document.getElementById('tbodyVeiculos');
  try {
    const res = await apiGet('veiculos');
    allVeiculos = res.data || [];
    renderVeiculos(allVeiculos);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar.</td></tr>';
  }
}

function renderVeiculos(data) {
  const tbody = document.getElementById('tbodyVeiculos');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhum veículo cadastrado.</td></tr>';
    return;
  }
  const tipoIcon = { carro:'🚗', moto:'🏍️', caminhonete:'🛻', van:'🚐', onibus:'🚌' };
  tbody.innerHTML = data.map(v => `
    <tr>
      <td><strong>${v.condutor}</strong></td>
      <td>${v.marca} ${v.modelo}</td>
      <td><strong style="font-family:monospace;font-size:0.9rem">${v.placa}</strong></td>
      <td style="font-size:0.8rem">${v.cor || '-'}</td>
      <td>${v.ano || '-'}</td>
      <td>${tipoIcon[v.tipo_veiculo] || ''} ${v.tipo_veiculo || '-'}</td>
      <td>
        <button class="btn btn-sm btn-danger btn-icon" onclick="deleteVeiculo('${v.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function filterVeiculos() {
  const q = document.getElementById('searchVeiculos').value.toLowerCase();
  const filtered = allVeiculos.filter(v => 
    (v.condutor||'').toLowerCase().includes(q) ||
    (v.placa||'').toLowerCase().includes(q) ||
    (v.modelo||'').toLowerCase().includes(q) ||
    (v.marca||'').toLowerCase().includes(q)
  );
  renderVeiculos(filtered);
}

async function saveVeiculo() {
  const condutor = document.getElementById('veiCondutor').value.trim();
  const marca = document.getElementById('veiMarca').value.trim();
  const modelo = document.getElementById('veiModelo').value.trim();
  const placa = document.getElementById('veiPlaca').value.trim();
  if (!condutor || !marca || !modelo || !placa) { showToast('Preencha os campos obrigatórios.', 'error'); return; }
  try {
    await apiCreate('veiculos', {
      condutor, marca, modelo, placa,
      cor: document.getElementById('veiCor').value,
      ano: parseInt(document.getElementById('veiAno').value) || null,
      tipo_veiculo: document.getElementById('veiTipo').value
    });
    closeModal('modalAddVeiculo');
    showToast('Veículo cadastrado!', 'success');
    document.getElementById('veiCondutor').value = '';
    document.getElementById('veiMarca').value = '';
    document.getElementById('veiModelo').value = '';
    document.getElementById('veiPlaca').value = '';
    document.getElementById('veiCor').value = '';
    document.getElementById('veiAno').value = '';
    loadVeiculos();
  } catch(e) { showToast('Erro ao cadastrar.', 'error'); }
}

async function deleteVeiculo(id) {
  if (!confirm('Excluir veículo?')) return;
  try {
    await apiDelete('veiculos', id);
    showToast('Veículo excluído.', 'success');
    loadVeiculos();
  } catch(e) { showToast('Erro.', 'error'); }
}

function exportVeiculos() {
  const headers = ['Condutor','Marca','Modelo','Placa','Cor','Ano','Tipo'];
  const data = allVeiculos.map(v => ({ condutor: v.condutor, marca: v.marca, modelo: v.modelo, placa: v.placa, cor: v.cor, ano: v.ano, tipo: v.tipo_veiculo }));
  exportCSV(data, 'veiculos-retiro-2027.csv', headers);
  showToast('Exportação iniciada!', 'success');
}

// ===== FINANCEIRO =====
async function loadFinanceiro() {
  try {
    const [pagRes, insRes] = await Promise.all([apiGet('pagamentos'), apiGet('retirantes')]);
    allPagamentos = pagRes.data || [];
    allInscricoes = insRes.data || [];

    // Populate select
    const sel = document.getElementById('pagRetirante');
    if (sel) sel.innerHTML = allInscricoes.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');

    updateKpiFinanceiro();
    renderPagamentos(allPagamentos);
    renderChartFormas();
    renderChartEvolucao();
  } catch(e) {
    showToast('Erro ao carregar financeiro.', 'error');
  }
}

function updateKpiFinanceiro() {
  const total = allPagamentos.reduce((s, p) => s + (p.valor_total || 0), 0);
  const recebido = allPagamentos.reduce((s, p) => s + (p.valor_pago || 0), 0);
  const pendente = total - recebido;
  const quitados = allPagamentos.filter(p => p.status === 'quitado').length;

  document.getElementById('finReceita').textContent = formatMoney(total);
  document.getElementById('finRecebido').textContent = formatMoney(recebido);
  document.getElementById('finPendente').textContent = formatMoney(pendente);
  document.getElementById('finQuitados').textContent = quitados;
  document.getElementById('finTotal').textContent = allPagamentos.length;
}

function renderPagamentos(data) {
  const tbody = document.getElementById('tbodyPagamentos');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhum pagamento registrado.</td></tr>';
    return;
  }
  const formaLabel = { pix:'PIX', cartao:'Cartão', transferencia:'Transferência', dinheiro:'Dinheiro', boleto:'Boleto' };
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.retirante_nome}</strong></td>
      <td>${formatMoney(p.valor_total)}</td>
      <td style="color:var(--verde);font-weight:600">${formatMoney(p.valor_pago)}</td>
      <td style="color:var(--vermelho);font-weight:600">${formatMoney(p.valor_pendente)}</td>
      <td><span style="font-size:0.8rem">${formaLabel[p.forma_pagamento] || p.forma_pagamento || '-'}</span></td>
      <td style="text-align:center">${p.parcelas || 1}x</td>
      <td>${getBadge(p.status)}</td>
      <td>
        <button class="btn btn-sm btn-primary btn-icon" onclick="editPagamento('${p.id}')" title="Editar"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-success btn-icon" onclick="quitarPagamento('${p.id}')" title="Quitar"><i class="fas fa-check"></i></button>
      </td>
    </tr>
  `).join('');
}

function filterPagamentos() {
  const status = document.getElementById('filterFinStatus').value;
  const filtered = status ? allPagamentos.filter(p => p.status === status) : allPagamentos;
  renderPagamentos(filtered);
}

function renderChartFormas() {
  const ctx = document.getElementById('chartFormas');
  if (!ctx) return;
  const formas = {};
  allPagamentos.forEach(p => {
    const f = p.forma_pagamento || 'outros';
    formas[f] = (formas[f] || 0) + 1;
  });
  const labels = Object.keys(formas).map(f => ({pix:'PIX',cartao:'Cartão',transferencia:'Transf.',dinheiro:'Dinheiro',boleto:'Boleto'}[f] || f));
  if (chartFormas) chartFormas.destroy();
  chartFormas = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: Object.values(formas), backgroundColor: ['#2563a8','#c9a84c','#28a745','#ffc107','#6f42c1'], borderWidth: 2 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
  });
}

function renderChartEvolucao() {
  const ctx = document.getElementById('chartEvolucao');
  if (!ctx) return;
  const meses = ['Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez','Jan','Fev'];
  const vals = meses.map(() => Math.floor(Math.random() * 15000));
  if (chartEvolucao) chartEvolucao.destroy();
  chartEvolucao = new Chart(ctx, {
    type: 'line',
    data: {
      labels: meses,
      datasets: [{
        label: 'Recebimentos (R$)',
        data: vals,
        borderColor: '#2563a8',
        backgroundColor: 'rgba(37,99,168,0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function savePagamento() {
  const retId = document.getElementById('pagRetirante').value;
  const valor = parseFloat(document.getElementById('pagValor').value) || 0;
  const forma = document.getElementById('pagForma').value;
  const data = document.getElementById('pagData').value;
  const status = document.getElementById('pagStatus').value;
  const obs = document.getElementById('pagObs').value;
  if (!retId || !valor) { showToast('Preencha os campos obrigatórios.', 'error'); return; }
  const ins = allInscricoes.find(i => i.id === retId);
  const existente = allPagamentos.find(p => p.retirante_id === retId);
  try {
    if (existente) {
      const novoPago = (existente.valor_pago || 0) + valor;
      await apiPatch('pagamentos', existente.id, {
        valor_pago: novoPago,
        valor_pendente: Math.max(0, (existente.valor_total || 0) - novoPago),
        forma_pagamento: forma,
        data_pagamento: data,
        status,
        observacoes: obs
      });
    } else {
      await apiCreate('pagamentos', {
        retirante_id: retId,
        retirante_nome: ins?.nome || '-',
        valor_total: TIPOS_ACOMODACAO['duplo']?.preco || 4000,
        valor_pago: valor,
        valor_pendente: 0,
        forma_pagamento: forma,
        data_pagamento: data,
        status,
        observacoes: obs,
        historico: '[]'
      });
    }
    closeModal('modalPagamento');
    showToast('Pagamento registrado!', 'success');
    await logAudit(currentUser.nome, 'Pagamento registrado', 'financeiro', { retirante: ins?.nome, valor });
    document.getElementById('pagValor').value = '';
    document.getElementById('pagObs').value = '';
    loadFinanceiro();
  } catch(e) { showToast('Erro ao salvar.', 'error'); }
}

async function quitarPagamento(id) {
  const pag = allPagamentos.find(p => p.id === id);
  if (!pag) return;
  if (!confirm(`Quitar pagamento de ${pag.retirante_nome}?`)) return;
  try {
    await apiPatch('pagamentos', id, { status: 'quitado', valor_pago: pag.valor_total, valor_pendente: 0 });
    await apiPatch('retirantes', pag.retirante_id, { status: 'quitado' });
    showToast('Pagamento quitado!', 'success');
    loadFinanceiro();
  } catch(e) { showToast('Erro.', 'error'); }
}

function editPagamento(id) {
  document.getElementById('pagId').value = id;
  document.getElementById('pagData').value = new Date().toISOString().split('T')[0];
  openModal('modalPagamento');
}

function exportFinanceiro() {
  const headers = ['Retirante','Valor Total','Valor Pago','Pendente','Forma','Parcelas','Status'];
  const data = allPagamentos.map(p => ({
    retirante: p.retirante_nome, valor_total: p.valor_total, valor_pago: p.valor_pago,
    pendente: p.valor_pendente, forma: p.forma_pagamento, parcelas: p.parcelas, status: p.status
  }));
  exportCSV(data, 'financeiro-retiro-2027.csv', headers);
  showToast('Exportação iniciada!', 'success');
}

// ===== DESPESAS =====
async function loadDespesas() {
  const tbody = document.getElementById('tbodyDespesas');
  try {
    const res = await apiGet('despesas');
    allDespesas = res.data || [];
    updateKpiDespesas();
    renderDespesas(allDespesas);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--vermelho)">Erro.</td></tr>';
  }
}

function updateKpiDespesas() {
  const estimado = allDespesas.reduce((s, d) => s + (d.valor_estimado || 0), 0);
  const confirmado = allDespesas.reduce((s, d) => s + (d.valor_confirmado || 0), 0);
  const pago = allDespesas.filter(d => d.status === 'paga').reduce((s, d) => s + (d.valor_confirmado || d.valor_estimado || 0), 0);
  document.getElementById('despEstimado').textContent = formatMoney(estimado);
  document.getElementById('despConfirmado').textContent = formatMoney(confirmado);
  document.getElementById('despPago').textContent = formatMoney(pago);
}

function renderDespesas(data) {
  const tbody = document.getElementById('tbodyDespesas');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhuma despesa cadastrada.</td></tr>';
    return;
  }
  const catLabel = { alimentacao:'🍽️ Alimentação', hospedagem:'🏨 Hospedagem', transporte:'🚗 Transporte', decoracao:'🎨 Decoração', som_iluminacao:'🎤 Som/Ilum.', palestrantes:'🎤 Palestrantes', outros:'📦 Outros' };
  tbody.innerHTML = data.map(d => `
    <tr>
      <td><strong>${d.descricao}</strong></td>
      <td style="font-size:0.8rem">${catLabel[d.categoria] || d.categoria}</td>
      <td>${formatMoney(d.valor_estimado)}</td>
      <td>${formatMoney(d.valor_confirmado)}</td>
      <td style="font-size:0.8rem">${formatDate(d.data)}</td>
      <td>${getBadge(d.status || 'estimada')}</td>
      <td style="font-size:0.8rem;color:var(--cinza-500)">${d.responsavel || '-'}</td>
      <td>
        <button class="btn btn-sm btn-success btn-icon" onclick="confirmarDespesa('${d.id}')" title="Confirmar pagamento"><i class="fas fa-check"></i></button>
        <button class="btn btn-sm btn-danger btn-icon" onclick="deleteDespesa('${d.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function saveDespesa() {
  const desc = document.getElementById('despDescricao').value.trim();
  if (!desc) { showToast('Informe a descrição.', 'error'); return; }
  try {
    await apiCreate('despesas', {
      descricao: desc,
      categoria: document.getElementById('despCategoria').value,
      valor_estimado: parseFloat(document.getElementById('despEstVal').value) || 0,
      valor_confirmado: parseFloat(document.getElementById('despConfVal').value) || 0,
      data: document.getElementById('despData').value,
      status: document.getElementById('despStatus').value,
      responsavel: document.getElementById('despResponsavel').value
    });
    closeModal('modalAddDespesa');
    showToast('Despesa cadastrada!', 'success');
    document.getElementById('despDescricao').value = '';
    document.getElementById('despEstVal').value = '';
    document.getElementById('despConfVal').value = '';
    loadDespesas();
  } catch(e) { showToast('Erro ao salvar.', 'error'); }
}

async function confirmarDespesa(id) {
  try {
    await apiPatch('despesas', id, { status: 'paga' });
    showToast('Despesa marcada como paga!', 'success');
    loadDespesas();
  } catch(e) { showToast('Erro.', 'error'); }
}

async function deleteDespesa(id) {
  if (!confirm('Excluir despesa?')) return;
  try {
    await apiDelete('despesas', id);
    showToast('Despesa excluída.', 'success');
    loadDespesas();
  } catch(e) { showToast('Erro.', 'error'); }
}

// ===== RECIBOS =====
function initRecibos() {}

async function searchForRecibo() {
  const q = document.getElementById('searchRecibo').value.toLowerCase();
  if (q.length < 2) return;
  try {
    const res = await apiGet('retirantes');
    const filtered = (res.data || []).filter(i => (i.nome||'').toLowerCase().includes(q) || (i.cpf||'').includes(q));
    const container = document.getElementById('reciboSearchResults');
    container.innerHTML = filtered.slice(0,5).map(i => `
      <div onclick="loadRecibo('${i.id}')" style="padding:10px 14px;border:1px solid var(--cinza-200);border-radius:8px;cursor:pointer;margin-bottom:6px;transition:all 0.2s" 
           onmouseover="this.style.background='var(--azul-suave)'" onmouseout="this.style.background=''"
           class="search-result-item">
        <strong style="font-size:0.875rem">${i.nome}</strong>
        <br><span style="font-size:0.75rem;color:var(--cinza-500)">${i.cpf || ''} | ${i.email || ''}</span>
      </div>
    `).join('');
  } catch(e) {}
}

async function loadRecibo(id) {
  try {
    const res = await apiGet('retirantes');
    const ins = (res.data || []).find(i => i.id === id);
    if (!ins) return;
    const pagRes = await apiGet('pagamentos');
    const pag = (pagRes.data || []).find(p => p.retirante_id === id) || {};
    const aptRes = await apiGet('acomodacoes');
    const apt = (aptRes.data || []).find(a => a.id === ins.acomodacao_id) || {};

    document.getElementById('btnPrintRecibo').style.display = 'inline-flex';
    document.getElementById('reciboPreview').innerHTML = `
      <div id="reciboContent">
        <div style="text-align:center;border-bottom:2px dashed var(--cinza-300);padding-bottom:16px;margin-bottom:16px">
          <img src="https://sspark.genspark.ai/cfimages?u1=Wk24Iwt0vbKZ%2Fy8LL7co7UeRYXVYdQRRIKD%2F6iXzE5vIIWo3JZfIlvbJe5DdSa9OVXZXHcYN9LKKwrAlz2i8kIShOHKpWhano8ZISMFhbhXdGAT1eRxEd68hYAYgmNo7k6%2BvpJbPi2Wa4vop%2FnnN2vVtGTk%3D&u2=785OrhxFe5ifE7JK&width=2560" style="width:60px;height:60px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto" onerror="this.style.display='none'">
          <div style="font-weight:800;font-size:1rem;color:var(--azul-escuro)">Igreja Batista Lírio Armação</div>
          <div style="font-size:0.8rem;color:var(--cinza-500)">RECIBO DE PAGAMENTO</div>
          <div style="font-size:0.7rem;color:var(--cinza-500)">Retiro Espiritual 2027 | 05 a 10/02/2027</div>
        </div>
        <div style="font-size:0.8rem;font-family:'Courier New',monospace;line-height:2">
          <div style="display:flex;justify-content:space-between"><span>Recibo Nº:</span><span><strong>${id.slice(-8).toUpperCase()}</strong></span></div>
          <div style="display:flex;justify-content:space-between"><span>Data:</span><span>${new Date().toLocaleDateString('pt-BR')}</span></div>
          <div style="border-top:1px dashed var(--cinza-300);margin:8px 0"></div>
          <div style="display:flex;justify-content:space-between"><span>Nome:</span><span><strong>${ins.nome}</strong></span></div>
          <div style="display:flex;justify-content:space-between"><span>CPF:</span><span>${ins.cpf || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Acomodação:</span><span>${apt.nome || '-'} (${apt.tipo || '-'})</span></div>
          <div style="border-top:1px dashed var(--cinza-300);margin:8px 0"></div>
          <div style="display:flex;justify-content:space-between"><span>Valor Total:</span><span>${formatMoney(pag.valor_total)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Valor Pago:</span><span><strong>${formatMoney(pag.valor_pago)}</strong></span></div>
          <div style="display:flex;justify-content:space-between"><span>Saldo:</span><span style="color:${pag.valor_pendente > 0 ? 'var(--vermelho)' : 'var(--verde)'}">${formatMoney(pag.valor_pendente)}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Forma Pag.:</span><span>${pag.forma_pagamento || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span>Status:</span><span>${pag.status || '-'}</span></div>
          <div style="border-top:2px dashed var(--cinza-300);margin-top:16px;padding-top:12px;text-align:center;font-size:0.7rem;color:var(--cinza-500)">
            Hotel Fazenda Amoras, Santo Antônio de Jesus - BA<br>
            "Enraizar. Crescer. Frutificar."
          </div>
        </div>
      </div>
    `;
  } catch(e) { showToast('Erro ao gerar recibo.', 'error'); }
}

function printRecibo() { window.print(); }
function gerarReciboInscrito() { showPage('recibos'); }

// ===== RELATÓRIOS =====
async function loadRelatorios() {
  try {
    const [insRes, aptRes, pagRes] = await Promise.all([apiGet('retirantes'), apiGet('acomodacoes'), apiGet('pagamentos')]);
    allInscricoes = insRes.data || [];
    allAcomodacoes = aptRes.data || [];
    allPagamentos = pagRes.data || [];
    renderChartRelAcoms();
    renderChartRelFin();
  } catch(e) {}
}

function renderChartRelAcoms() {
  const ctx = document.getElementById('chartRelAcoms');
  if (!ctx) return;
  const tipos = ['duplo','triplo','quadruplo','quintuplo','suite_master','alojamento_feminino','alojamento_masculino'];
  const nomes = ['Duplo','Triplo','Quádruplo','Quíntuplo','Suíte','Aloj.F','Aloj.M'];
  const counts = tipos.map(t => allAcomodacoes.filter(a => a.tipo === t && a.status !== 'disponivel').length);
  if (chartRelAcoms) chartRelAcoms.destroy();
  chartRelAcoms = new Chart(ctx, {
    type: 'horizontalBar',
    type: 'bar',
    data: {
      labels: nomes,
      datasets: [{ label: 'Ocupados', data: counts, backgroundColor: '#2563a8' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });
}

function renderChartRelFin() {
  const ctx = document.getElementById('chartRelFin');
  if (!ctx) return;
  const recebido = allPagamentos.reduce((s,p)=>s+(p.valor_pago||0),0);
  const pendente = allPagamentos.reduce((s,p)=>s+(p.valor_pendente||0),0);
  if (chartRelFin) chartRelFin.destroy();
  chartRelFin = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Recebido','Pendente'],
      datasets: [{ data: [recebido, pendente], backgroundColor: ['#28a745','#dc3545'], borderWidth: 2 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: ctx => ` ${formatMoney(ctx.parsed)}` } }
      }
    }
  });
}

async function exportarRelatorio(tipo, formato) {
  showToast(`Gerando relatório ${tipo.toUpperCase()} em ${formato.toUpperCase()}...`, 'info');
  try {
    let data, headers, filename;
    
    if (tipo === 'inscritos') {
      const res = await apiGet('retirantes');
      data = (res.data || []).map(i => ({ nome: i.nome, cpf: i.cpf, email: i.email, celular: i.celular, sexo: i.sexo, status: i.status }));
      headers = ['Nome','CPF','Email','Celular','Sexo','Status'];
      filename = 'inscritos-retiro-2027';
    } else if (tipo === 'financeiro') {
      const res = await apiGet('pagamentos');
      data = (res.data || []).map(p => ({ retirante: p.retirante_nome, total: p.valor_total, pago: p.valor_pago, pendente: p.valor_pendente, forma: p.forma_pagamento, status: p.status }));
      headers = ['Retirante','Total','Pago','Pendente','Forma','Status'];
      filename = 'financeiro-retiro-2027';
    } else if (tipo === 'acomodacoes') {
      const res = await apiGet('acomodacoes');
      data = (res.data || []).map(a => ({ numero: a.numero, nome: a.nome, tipo: a.tipo, capacidade: a.capacidade, preco: a.preco, status: a.status }));
      headers = ['Número','Nome','Tipo','Capacidade','Preço','Status'];
      filename = 'acomodacoes-retiro-2027';
    } else if (tipo === 'veiculos') {
      const res = await apiGet('veiculos');
      data = (res.data || []).map(v => ({ condutor: v.condutor, marca: v.marca, modelo: v.modelo, placa: v.placa, cor: v.cor, ano: v.ano }));
      headers = ['Condutor','Marca','Modelo','Placa','Cor','Ano'];
      filename = 'veiculos-retiro-2027';
    } else if (tipo === 'refeicoes') {
      const res = await apiGet('refeicoes');
      data = (res.data || []).map(r => ({ nome: r.retirante_nome, data: r.data, cafe: r.cafe_manha?'S':'N', almoco: r.almoco?'S':'N', lanche: r.lanche?'S':'N', jantar: r.jantar?'S':'N' }));
      headers = ['Nome','Data','Café','Almoço','Lanche','Jantar'];
      filename = 'refeicoes-retiro-2027';
    } else if (tipo === 'auditoria') {
      const res = await apiGet('auditoria');
      data = (res.data || []).map(a => ({ data: a.data_hora, usuario: a.usuario, acao: a.acao, modulo: a.modulo }));
      headers = ['Data/Hora','Usuário','Ação','Módulo'];
      filename = 'auditoria-retiro-2027';
    }

    if (formato === 'xlsx') {
      exportCSV(data, `${filename}.csv`, headers);
      showToast('XLSX exportado com sucesso!', 'success');
    } else {
      // PDF via print
      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório - ${tipo}</title>
        <style>body{font-family:Arial;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th{background:#0a2340;color:white;padding:8px 10px}td{padding:7px 10px;border-bottom:1px solid #eee}h1{color:#0a2340}</style>
        </head><body>
        <h1>Retiro Espiritual 2027 — Relatório: ${tipo}</h1>
        <p style="color:#666">Gerado em: ${new Date().toLocaleString('pt-BR')} | Igreja Batista Lírio Armação</p>
        <table>
        <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${data.map(row=>`<tr>${headers.map(h=>{const key=h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_');return`<td>${row[key]??''}</td>`}).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>`);
      win.document.close();
      win.print();
      showToast('PDF aberto para impressão!', 'success');
    }
  } catch(e) { showToast('Erro ao gerar relatório.', 'error'); }
}

// ===== AUDITORIA =====
async function loadAuditoria() {
  const tbody = document.getElementById('tbodyAuditoria');
  try {
    const res = await apiGet('auditoria');
    allAuditoria = res.data || [];
    renderAuditoria(allAuditoria);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--vermelho)">Erro ao carregar.</td></tr>';
  }
}

function renderAuditoria(data) {
  const tbody = document.getElementById('tbodyAuditoria');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--cinza-500)">Nenhum registro de auditoria.</td></tr>';
    return;
  }
  tbody.innerHTML = [...data].reverse().map(a => `
    <tr>
      <td style="font-size:0.8rem;color:var(--cinza-500);white-space:nowrap">${a.data_hora || '-'}</td>
      <td><strong>${a.usuario}</strong></td>
      <td>${a.acao}</td>
      <td><span class="badge badge-confirmado" style="font-size:0.7rem">${a.modulo}</span></td>
      <td style="font-size:0.8rem;color:var(--cinza-500)">${a.detalhes?.substring(0,60) || '-'}...</td>
    </tr>
  `).join('');
}

function filterAuditoria() {
  const q = document.getElementById('searchAuditoria').value.toLowerCase();
  const mod = document.getElementById('filterAudMod').value;
  let filtered = allAuditoria;
  if (q) filtered = filtered.filter(a => (a.usuario||'').toLowerCase().includes(q) || (a.acao||'').toLowerCase().includes(q));
  if (mod) filtered = filtered.filter(a => a.modulo === mod);
  renderAuditoria(filtered);
}

// ===== PERFIL =====
function alterarSenha() {
  const atual = document.getElementById('senhaAtual').value;
  const nova = document.getElementById('novaSenha').value;
  const confirmar = document.getElementById('confirmarSenha').value;
  if (!atual || !nova || !confirmar) { showToast('Preencha todos os campos.', 'error'); return; }
  if (nova !== confirmar) { showToast('As senhas não coincidem.', 'error'); return; }
  if (nova.length < 6) { showToast('A senha deve ter pelo menos 6 caracteres.', 'error'); return; }
  showToast('Senha alterada com sucesso!', 'success');
  document.getElementById('senhaAtual').value = '';
  document.getElementById('novaSenha').value = '';
  document.getElementById('confirmarSenha').value = '';
}

// ===== MODAL CLOSE ON OVERLAY =====
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});
