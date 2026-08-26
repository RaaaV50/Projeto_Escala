
let enfermeiros = [];
let folgas = [];
let feriados = [];
let escala = {}; // { nurseId: { dias: 'M'|'T'|'N'|'F'|'D'|'FO'|'FE' } }
let config = {
  mes: new Date().getMonth(),
  ano: new Date().getFullYear(),
  minManha: 2, minTarde: 2, minNoite: 1, minFds: 1
};
let activeCell = null;
let idCounter = 1;

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];


//  TABS

function goTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const tabs = ['enfermeiros', 'configuracoes', 'escala', 'relatorio'];
  const idx = tabs.indexOf(tab);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
}


//  LOCAL STORAGE — HISTÓRICO DE ESCALAS

const LS_HISTORICO = 'escala_historico_v2';
const LS_ATUAL = 'escala_atual_v2';

function salvarNoLocalStorage() {
  const data = { enfermeiros, folgas, feriados, escala, config, idCounter, dataGravacao: new Date().toISOString() };
  localStorage.setItem(LS_ATUAL, JSON.stringify(data));
}

function carregarDoLocalStorage() {
  const data = localStorage.getItem(LS_ATUAL);
  if (data) {
    const parsed = JSON.parse(data);
    enfermeiros = parsed.enfermeiros || [];
    folgas = parsed.folgas || [];
    feriados = parsed.feriados || [];
    escala = parsed.escala || {};
    config = parsed.config || config;
    idCounter = parsed.idCounter || 1;
    document.getElementById('cfgMes').value = config.mes;
    document.getElementById('cfgAno').value = config.ano;
    document.getElementById('cfgMinManha').value = config.minManha;
    document.getElementById('cfgMinTarde').value = config.minTarde;
    document.getElementById('cfgMinNoite').value = config.minNoite;
    document.getElementById('cfgMinFds').value = config.minFds;
    renderTabelaEnfermeiros();
    renderListaFolgas();
    renderFeriados();
    updateFolgaSelect();
    if (Object.keys(escala).length > 0) { renderEscala(); renderRelatorio(); }
  }
}

function salvarEscalaNoHistorico() {
  if (!Object.keys(escala).length) return;
  const historico = JSON.parse(localStorage.getItem(LS_HISTORICO) || '[]');
  const entrada = {
    id: Date.now(),
    dataGravacao: new Date().toISOString(),
    label: `${MESES[config.mes]} ${config.ano}`,
    config: JSON.parse(JSON.stringify(config)),
    enfermeiros: JSON.parse(JSON.stringify(enfermeiros)),
    folgas: JSON.parse(JSON.stringify(folgas)),
    feriados: JSON.parse(JSON.stringify(feriados)),
    escala: JSON.parse(JSON.stringify(escala)),
    idCounter
  };

  // Substituir se já existe o mesmo mês/ano
  const idx = historico.findIndex(h => h.config.mes === config.mes && h.config.ano === config.ano);
  if (idx >= 0) historico[idx] = entrada;
  else historico.unshift(entrada);

  // Manter no máximo 20 escalas
  if (historico.length > 20) historico.length = 20;
  localStorage.setItem(LS_HISTORICO, JSON.stringify(historico));
}

function abrirHistorico() {
  const historico = JSON.parse(localStorage.getItem(LS_HISTORICO) || '[]');
  const div = document.getElementById('historicoList');
  if (!historico.length) {
    div.innerHTML = `<div class="empty-state"><i data-lucide="folder-open" class="empty-icon"></i><h3>Nenhuma escala salva</h3><p>Gere e salve uma escala para ela aparecer aqui.</p></div>`;
  } else {
    div.innerHTML = historico.map(h => {
      const data = new Date(h.dataGravacao);
      const dataFmt = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `
      <div class="hist-item">
        <div class="hist-info">
          <div class="hist-title">${h.label}</div>
          <div class="hist-meta">Salva em ${dataFmt} · ${h.enfermeiros.length} enfermeiro(s) · ${h.feriados.length} feriado(s)</div>
        </div>
        <div class="hist-actions">
          <button class="btn btn-blue btn-sm" onclick="restaurarEscala(${h.id})"><i data-lucide="folder-open" class="btn-icon"></i> Carregar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirHistorico(${h.id})"><i data-lucide="trash-2" class="btn-icon"></i></button>
        </div>
      </div>`;
    }).join('');
  }
  document.getElementById('historicoOverlay').classList.add('show');
}

function fecharHistorico(e) {
  if (e.target === document.getElementById('historicoOverlay'))
    document.getElementById('historicoOverlay').classList.remove('show');
}

function restaurarEscala(id) {
  const historico = JSON.parse(localStorage.getItem(LS_HISTORICO) || '[]');
  const h = historico.find(x => x.id === id);
  if (!h) return;
  enfermeiros = h.enfermeiros;
  folgas = h.folgas;
  feriados = h.feriados;
  escala = h.escala;
  config = h.config;
  idCounter = h.idCounter;
  document.getElementById('cfgMes').value = config.mes;
  document.getElementById('cfgAno').value = config.ano;
  document.getElementById('cfgMinManha').value = config.minManha;
  document.getElementById('cfgMinTarde').value = config.minTarde;
  document.getElementById('cfgMinNoite').value = config.minNoite;
  document.getElementById('cfgMinFds').value = config.minFds;
  salvarNoLocalStorage();
  renderTabelaEnfermeiros();
  renderListaFolgas();
  renderFeriados();
  updateFolgaSelect();
  renderEscala();
  renderRelatorio();
  document.getElementById('historicoOverlay').classList.remove('show');
  goTab('escala');
}

function excluirHistorico(id) {
  let historico = JSON.parse(localStorage.getItem(LS_HISTORICO) || '[]');
  historico = historico.filter(h => h.id !== id);
  localStorage.setItem(LS_HISTORICO, JSON.stringify(historico));
  abrirHistorico();
}


//  ENFERMEIROS

function adicionarEnfermeiro() {
  const nome = document.getElementById('nomeEnf').value.trim();
  const coren = document.getElementById('corenEnf').value.trim();
  const turno = document.getElementById('turnoEnf').value;
  const diaInicio = parseInt(document.getElementById('diaInicioEnf').value) || 1;
  const fdsInicio = document.getElementById('fdsInicioEnf').value;
  if (!nome) { alert('Informe o nome do enfermeiro.'); return; }
  enfermeiros.push({ id: idCounter++, nome, coren, turno, fds: fdsInicio, diaInicio });
  document.getElementById('nomeEnf').value = '';
  document.getElementById('corenEnf').value = '';
  renderTabelaEnfermeiros();
  updateFolgaSelect();
  salvarNoLocalStorage();
  document.getElementById('modalOverlay').classList.add('show');
}

function adicionarExemplos() {
  const exemplos = [
    { nome: 'Ana Paula Silva', coren: 'SP-112233', turno: 'M', fds: 'S' },
    { nome: 'Bruno Costa', coren: 'SP-223344', turno: 'M', fds: 'D' },
    { nome: 'Carla Mendes', coren: 'SP-334455', turno: 'T', fds: 'S' },
    { nome: 'Diego Ferreira', coren: 'SP-445566', turno: 'T', fds: 'D' },
    { nome: 'Elaine Rodrigues', coren: 'SP-556677', turno: 'N', fds: 'S', diaInicio: 1 },
    { nome: 'Fábio Nascimento', coren: 'SP-667788', turno: 'N', fds: 'S', diaInicio: 2 },
  ];
  exemplos.forEach(e => enfermeiros.push({ id: idCounter++, ...e }));
  renderTabelaEnfermeiros();
  updateFolgaSelect();
  salvarNoLocalStorage();
}

function removerEnfermeiro(id) {
  enfermeiros = enfermeiros.filter(e => e.id !== id);
  renderTabelaEnfermeiros();
  updateFolgaSelect();
  salvarNoLocalStorage();
}

const TURNO_LABEL = { M: 'Manhã', T: 'Tarde', N: 'Noite', FL: 'Flexível' };
const TURNO_BADGE = { M: 'badge-manha', T: 'badge-tarde', N: 'badge-noite', FL: 'badge-flexivel' };
const FDS_LABEL = { S: 'Sábado', D: 'Domingo', A: 'Alternado' };

// Mostrar/ocultar campos conforme turno selecionado
document.getElementById('turnoEnf').addEventListener('change', function () {
  const isNoite = this.value === 'N';
  document.getElementById('diaInicioGroup').style.display = isNoite ? '' : 'none';
  document.getElementById('fdsInicioGroup').style.display = isNoite ? 'none' : '';
});

function renderTabelaEnfermeiros() {
  document.getElementById('nurseCount').textContent = enfermeiros.length;
  const div = document.getElementById('tabelaEnfermeiros');
  if (!enfermeiros.length) {
    div.innerHTML = `<div class="empty-state"><i data-lucide="users" class="empty-icon"></i><h3>Nenhum enfermeiro cadastrado</h3><p>Adicione enfermeiros ou carregue os exemplos</p></div>`;
    return;
  }
  div.innerHTML = `
    <table class="nurses-table">
      <thead><tr>
        <th>Nome</th><th>COREN</th><th>Turno</th><th>FDS / Ciclo Noite</th><th></th>
      </tr></thead>
      <tbody>
        ${enfermeiros.map(e => `
          <tr>
            <td><strong>${e.nome}</strong></td>
            <td style="font-family:'DM Mono',monospace;font-size:0.8rem;color:var(--text2);">${e.coren || '—'}</td>
            <td><span class="badge ${TURNO_BADGE[e.turno]}">${TURNO_LABEL[e.turno]}</span></td>
            <td style="color:var(--text2);font-size:0.8rem;">${e.turno === 'N' ? `${e.diaInicio === 2 ? 'Folga' : 'Trabalha'} no dia 1` : `FDS: começa ${e.fds === 'S' ? 'Sábado' : 'Domingo'}`}</td>
            <td><button class="btn btn-danger btn-sm" onclick="removerEnfermeiro(${e.id})">✕ Remover</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}


//  FOLGAS

function updateFolgaSelect() {
  const sel = document.getElementById('folgaNurse');
  sel.innerHTML = enfermeiros.map(e => `<option value="${e.id}">${e.nome}</option>`).join('');
}

function adicionarFolga() {
  const nurseId = parseInt(document.getElementById('folgaNurse').value);
  const tipo = document.getElementById('folgaTipo').value;
  const inicio = document.getElementById('folgaInicio').value;
  const fim = document.getElementById('folgaFim').value;
  if (!nurseId || !inicio) { alert('Selecione o enfermeiro e a data.'); return; }
  folgas.push({ nurseId, tipo, inicio, fim: fim || inicio });
  renderListaFolgas();
  salvarNoLocalStorage();
}

function removerFolga(idx) {
  folgas.splice(idx, 1);
  renderListaFolgas();
  salvarNoLocalStorage();
}

function renderListaFolgas() {
  const div = document.getElementById('listaFolgas');
  if (!folgas.length) { div.innerHTML = ''; return; }
  div.innerHTML = folgas.map((f, i) => {
    const enf = enfermeiros.find(e => e.id === f.nurseId);
    const label = f.tipo === 'FE' ? 'Férias' : 'Folga';
    const datas = f.inicio === f.fim ? f.inicio : `${f.inicio} → ${f.fim}`;
    return `<div class="tag">${label} · <strong>${enf ? enf.nome.split(' ')[0] : '?'}</strong> · ${datas}<button onclick="removerFolga(${i})">×</button></div>`;
  }).join('');
}


//  FERIADOS
function adicionarFeriado() {
  const data = document.getElementById('feriadoData').value;
  const desc = document.getElementById('feriadoDesc').value.trim() || 'Feriado';
  if (!data) return;
  // Evitar duplicata
  if (feriados.some(f => f.data === data)) { alert('Este feriado já está cadastrado.'); return; }
  feriados.push({ data, desc });
  renderFeriados();
  salvarNoLocalStorage();
}

function removerFeriado(i) { feriados.splice(i, 1); renderFeriados(); salvarNoLocalStorage(); }

function renderFeriados() {
  document.getElementById('listaFeriados').innerHTML = feriados.map((f, i) =>
    `<div class="tag">${f.data} · ${f.desc}<button onclick="removerFeriado(${i})">×</button></div>`
  ).join('');
}

// Busca feriados nacionais na Brasil API e adiciona automaticamente
async function importarFeriadosBrasilAPI(silencioso = false) {
  const ano = parseInt(document.getElementById('cfgAno').value) || config.ano;
  const mes = parseInt(document.getElementById('cfgMes').value);
  const btn = document.getElementById('btnImportarFeriados');

  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader" class="btn-icon"></i> Buscando...';

  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
    if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
    const todos = await res.json();

    // Filtra apenas os do mês selecionado
    const mesPadded = String(mes + 1).padStart(2, '0');
    const doMes = todos.filter(f => f.date.startsWith(`${ano}-${mesPadded}`));

    // Adiciona os feriados do mês atual se não existirem
    let adicionados = 0;
    doMes.forEach(f => {
      if (!feriados.some(x => x.data === f.date)) {
        feriados.push({ data: f.date, desc: f.name });
        adicionados++;
      }
    });

    renderFeriados();
    salvarNoLocalStorage();

    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="calendar-plus" class="btn-icon"></i> Importar Feriados Nacionais';

    if (!silencioso) {
      if (!doMes.length) {
        alert(`Nenhum feriado nacional encontrado em ${MESES[mes]} ${ano}.`);
      } else {
        alert(`${adicionados} feriado(s) importado(s) para ${MESES[mes]} ${ano}!${adicionados < doMes.length ? `\n(${doMes.length - adicionados} já estavam cadastrados)` : ''}`);
      }
    }

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="calendar-plus" class="btn-icon"></i> Importar Feriados Nacionais';
    if (!silencioso) {
      alert(`❌ Erro ao buscar feriados: ${err.message}\nVerifique sua conexão e tente novamente.`);
    }
  }
}

// Importação automática ao trocar mês ou ano
document.getElementById('cfgMes').addEventListener('change', () => importarFeriadosBrasilAPI(true));
document.getElementById('cfgAno').addEventListener('change', () => importarFeriadosBrasilAPI(true));


//  CONFIG
function salvarConfig() {
  config.mes = parseInt(document.getElementById('cfgMes').value);
  config.ano = parseInt(document.getElementById('cfgAno').value);
  config.minManha = parseInt(document.getElementById('cfgMinManha').value);
  config.minTarde = parseInt(document.getElementById('cfgMinTarde').value);
  config.minNoite = parseInt(document.getElementById('cfgMinNoite').value);
  config.minFds = parseInt(document.getElementById('cfgMinFds').value);
  salvarNoLocalStorage();
  alert('Configurações salvas!');
}

// Importação automática de feriados ao iniciar a página
window.addEventListener('DOMContentLoaded', () => {

  // Pequeno delay para garantir que o DOM e localStorage já foram carregados
  setTimeout(() => importarFeriadosBrasilAPI(true), 500);
});


//  GERAR ESCALA
function diasDoMes(mes, ano) {
  return new Date(ano, mes + 1, 0).getDate();
}

function diaDaSemana(dia, mes, ano) {
  return new Date(ano, mes, dia).getDay();
}

function isFeriado(dia) {
  const d = `${config.ano}-${String(config.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  return feriados.some(f => f.data === d);
}

function getFolgaTipo(nurseId, dia) {
  const d = `${config.ano}-${String(config.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  for (const f of folgas) {
    if (f.nurseId !== nurseId) continue;
    if (d >= f.inicio && d <= f.fim) return f.tipo;
  }
  return null;
}

function gerarEscala() {
  if (!enfermeiros.length) { alert('Cadastre pelo menos um enfermeiro antes de gerar a escala.'); return; }

  // Ler config atual antes de gerar
  config.mes = parseInt(document.getElementById('cfgMes').value);
  config.ano = parseInt(document.getElementById('cfgAno').value);
  config.minManha = parseInt(document.getElementById('cfgMinManha').value);
  config.minTarde = parseInt(document.getElementById('cfgMinTarde').value);
  config.minNoite = parseInt(document.getElementById('cfgMinNoite').value);
  config.minFds = parseInt(document.getElementById('cfgMinFds').value);

  const totalDias = diasDoMes(config.mes, config.ano);
  // Resetar escala completamente ao (re)gerar — edições manuais são descartadas
  escala = {};
  enfermeiros.forEach(e => { escala[e.id] = {}; });

  for (let dia = 1; dia <= totalDias; dia++) {
    const dow = diaDaSemana(dia, config.mes, config.ano);
    const ehSabado = dow === 6;
    const ehDomingo = dow === 0;
    const ehFer = isFeriado(dia);

    enfermeiros.forEach(enf => {

      // Folgas/férias pré-registradas têm prioridade
      const folgaTipo = getFolgaTipo(enf.id, dia);
      if (folgaTipo) { escala[enf.id][dia] = folgaTipo; return; }

      // ── NOTURNO 12x36
      // Ciclo IGNORA feriados e fins de semana — apenas conta os dias corridos.
      // diaInicio: 1 = trabalha no dia 1, folga dia 2, trabalha dia 3...
      //            2 = folga dia 1, trabalha dia 2, folga dia 3...

      if (enf.turno === 'N') {
        const diaInicio = enf.diaInicio || 1;
        // posição no ciclo: 0 = trabalha (N), 1 = folga (FO)
        const pos = (dia - diaInicio) % 2;
        if (pos === 0) {
          escala[enf.id][dia] = 'N';
        } else {
          escala[enf.id][dia] = 'FO';
        }
        return;
      }

      // FERIADO em dia útil → marca como FERIADO
      if (ehFer) {
        escala[enf.id][dia] = 'FERIADO';
        return;
      }

      // FIM DE SEMANA — regra: Sáb trabalha → Dom folga; próximo Sáb folga → Dom trabalha
      if (ehSabado || ehDomingo) {
        // Encontra o domingo desta semana para identificar o par (Sáb/Dom) de forma única
        const domingoDaSemana = ehSabado ? dia + 1 : dia;
        // Calcula o índice do fim de semana no mês (0, 1, 2, 3, 4) de forma matemática,
        // corrigindo o bug onde o mês começando no domingo falhava a alternância.
        const idxFds = Math.floor((domingoDaSemana - 1) / 7);

        // fds='S': índice par → Sáb trabalha, Dom folga | índice ímpar → Sáb folga, Dom trabalha
        // fds='D': índice par → Sáb folga, Dom trabalha | índice ímpar → Sáb trabalha, Dom folga
        const sabTrabalha = enf.fds === 'S' ? (idxFds % 2 === 0) : (idxFds % 2 !== 0);
        if (ehSabado) { escala[enf.id][dia] = sabTrabalha ? 'F' : 'FO'; return; }
        if (ehDomingo) { escala[enf.id][dia] = sabTrabalha ? 'FO' : 'D'; return; }
      }

      // DIAS ÚTEIS
      if (enf.turno === 'M') { escala[enf.id][dia] = 'M'; return; }
      if (enf.turno === 'T') { escala[enf.id][dia] = 'T'; return; }
      if (enf.turno === 'FL') {
        escala[enf.id][dia] = (dia % 2 === 0) ? 'T' : 'M';
        return;
      }
    });
  }

  // Validar cobertura e avisar sem bloquear
  const alertas = verificarCobertura(totalDias);

  renderEscala();
  renderRelatorio();
  salvarNoLocalStorage();
  salvarEscalaNoHistorico();
  goTab('escala');

  if (alertas.length > 0) {
    const msgs = alertas.slice(0, 8).map(a => `• ${a}`).join('\n');
    const extra = alertas.length > 8 ? `\n... e mais ${alertas.length - 8} alertas (veja o Relatório).` : '';
    setTimeout(() => alert(`Escala gerada com ${alertas.length} alerta(s) de cobertura mínima:\n\n${msgs}${extra}`), 100);
  }
}

//   ESCALA
function renderEscala() {
  const totalDias = diasDoMes(config.mes, config.ano);
  document.getElementById('escalaTitle').textContent = `Escala — ${MESES[config.mes]} ${config.ano}`;

  let html = `<table class="schedule-grid"><thead><tr>
    <th class="nurse-col">Enfermeiro</th>`;

  for (let d = 1; d <= totalDias; d++) {
    const dow = diaDaSemana(d, config.mes, config.ano);
    const isFer = isFeriado(d);
    let cls = '';
    if (dow === 6) cls = 'weekend-col';
    else if (dow === 0) cls = 'sunday-col';

    const label = isFer
      ? `<span class="feriado-header" title="${getFeriadoDesc(d)}">${d}</span>`
      : d;
    html += `<th class="${cls}" title="${DIAS_SEMANA[dow]}">${label}<br><small style="font-weight:400;opacity:0.6">${DIAS_SEMANA[dow]}</small></th>`;
  }
  html += `</tr></thead><tbody>`;

  enfermeiros.forEach((enf) => {
    html += `<tr>
      <td class="nurse-name">${enf.nome}<br><small style="font-size:0.65rem;color:var(--text2);">${TURNO_LABEL[enf.turno]}</small></td>`;
    for (let d = 1; d <= totalDias; d++) {
      const val = escala[enf.id]?.[d] || '';
      const isFer = isFeriado(d);
      const dow = diaDaSemana(d, config.mes, config.ano);
      let colCls = '';
      if (dow === 6) colCls = 'weekend-col';
      else if (dow === 0) colCls = 'sunday-col';

      let cellCls, display, title;
      if (val === 'FERIADO') {
        cellCls = 'cell-FERIADO';
        display = ''; cellCls = 'cell-FERIADO';
        const desc = getFeriadoDesc(d).replace(/"/g, '&quot;');
        title = `${enf.nome} — ${desc}`;
      } else {
        cellCls = val ? `cell-${val}` : '';
        display = { M: 'M', T: 'T', N: 'N', F: 'S', D: 'D', FO: 'F', FE: 'V', '': '' }[val] || val;
        title = `${enf.nome} — dia ${d}${isFer ? ' (Feriado)' : ''}`;
      }

      html += `<td class="${cellCls} ${colCls}" onmousedown="openCtx(event,${enf.id},${d})" title="${title}">${display}</td>`;
    }
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  document.getElementById('escalaGrid').innerHTML = html;
}

function getFeriadoDesc(dia) {
  const d = `${config.ano}-${String(config.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const f = feriados.find(f => f.data === d);
  return f ? f.desc : 'Feriado';
}

//  CONTEXT MENU — ALTERAÇÃO DE TURNOS
let ctxOpen = false;

function openCtx(e, nurseId, day) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  activeCell = { nurseId, day };
  const menu = document.getElementById('ctxMenu');
  const x = Math.min(e.clientX, window.innerWidth - 180);
  const y = Math.min(e.clientY, window.innerHeight - 300);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.add('show');
  ctxOpen = true;
}

function setCellValue(val) {
  if (!activeCell) return;
  if (!escala[activeCell.nurseId]) escala[activeCell.nurseId] = {};
  escala[activeCell.nurseId][activeCell.day] = val;
  document.getElementById('ctxMenu').classList.remove('show');
  ctxOpen = false;
  activeCell = null;
  renderEscala();
  renderRelatorio();
  salvarNoLocalStorage();
}

// Fechar menu ao clicar fora
document.addEventListener('mousedown', (e) => {
  const menu = document.getElementById('ctxMenu');
  if (menu && !menu.contains(e.target)) {
    menu.classList.remove('show');
    ctxOpen = false;
  }
});

//  VERIFICAR COBERTURA MÍNIMA
function verificarCobertura(totalDias) {
  const alertas = [];
  for (let d = 1; d <= totalDias; d++) {
    const dow = diaDaSemana(d, config.mes, config.ano);
    const ehFer = isFeriado(d);
    const ehSab = dow === 6, ehDom = dow === 0;
    let countM = 0, countT = 0, countN = 0, countFds = 0;
    enfermeiros.forEach(enf => {
      const v = escala[enf.id]?.[d] || '';
      if (v === 'M') countM++;
      if (v === 'T') countT++;
      if (v === 'N') countN++;
      if (v === 'F' || v === 'D') countFds++;
    });
    if (!ehSab && !ehDom && !ehFer) {
      if (countM < config.minManha) alertas.push(`Dia ${d}: Manhã insuficiente (${countM}/${config.minManha})`);
      if (countT < config.minTarde) alertas.push(`Dia ${d}: Tarde insuficiente (${countT}/${config.minTarde})`);
    } else if (ehSab || ehDom) {
      if (countFds < config.minFds) alertas.push(`FDS Dia ${d}: Cobertura insuficiente (${countFds}/${config.minFds})`);
    }

    // Noite: verificar todos os dias (12x36 pode naturalmente ter folgas)
    if (countN < config.minNoite) alertas.push(`Dia ${d}: Noite insuficiente (${countN}/${config.minNoite})`);
  }
  return alertas;
}

//  RELATÓRIO
function renderRelatorio() {
  const totalDias = diasDoMes(config.mes, config.ano);
  const div = document.getElementById('relatorioContent');

  if (!enfermeiros.length || !Object.keys(escala).length) {
    div.innerHTML = `<div class="empty-state"><i data-lucide="bar-chart-2" class="empty-icon"></i><h3>Gere a escala primeiro</h3></div>`;
    return;
  }

  const resumo = enfermeiros.map(enf => {
    const dias = escala[enf.id] || {};
    let horas = 0, plantoes = { M: 0, T: 0, N: 0, F: 0, D: 0, FO: 0, FE: 0 };
    for (let d = 1; d <= totalDias; d++) {
      const v = dias[d] || '';
      if (plantoes[v] !== undefined) plantoes[v]++;
      if (v === 'M') horas += 6;
      else if (v === 'T') horas += 6;
      else if (v === 'N') horas += 12;
      else if (v === 'F' || v === 'D') horas += 10;
    }
    return { enf, horas, plantoes };
  });

  const alerts = verificarCobertura(totalDias);

  let html = `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Total de Enfermeiros</div><div class="stat-value">${enfermeiros.length}</div><div class="stat-sub">profissionais cadastrados</div></div>
    <div class="stat-card"><div class="stat-label">Dias no Mês</div><div class="stat-value">${totalDias}</div><div class="stat-sub">${MESES[config.mes]} ${config.ano}</div></div>
    <div class="stat-card"><div class="stat-label">Alertas de Cobertura</div><div class="stat-value" style="color:${alerts.length > 0 ? 'var(--accent3)' : 'var(--accent)'}">${alerts.length}</div><div class="stat-sub">${alerts.length === 0 ? 'cobertura OK' : 'verifique a escala'}</div></div>
    <div class="stat-card"><div class="stat-label">Feriados</div><div class="stat-value">${feriados.length}</div><div class="stat-sub">no mês configurado</div></div>
  </div>`;

  if (alerts.length) {
    html += alerts.slice(0, 8).map(a => `<div class="alert alert-warning">${a.replace('', '')}</div>`).join('');
    if (alerts.length > 8) html += `<div class="alert alert-info">... e mais ${alerts.length - 8} alertas. Revise a escala.</div>`;
  } else {
    html += `<div class="alert alert-success">Cobertura mínima garantida em todos os dias do mês.</div>`;
  }

  html += `
  <div class="card">
    <div class="card-title" style="margin-bottom:1rem;">Resumo por Enfermeiro</div>
    <table class="cobertura-table">
      <thead><tr>
        <th style="text-align:left;">Enfermeiro</th>
        <th>Horas</th>
        <th>Manhã</th>
        <th>Tarde</th>
        <th>Noite</th>
        <th>FDS</th>
        <th>Folgas</th>
        <th>Férias</th>
      </tr></thead>
      <tbody>
        ${resumo.map(r => `
          <tr>
            <td style="text-align:left;font-weight:500;">${r.enf.nome}</td>
            <td><strong>${r.horas}h</strong></td>
            <td>${r.plantoes.M}</td>
            <td>${r.plantoes.T}</td>
            <td>${r.plantoes.N}</td>
            <td>${r.plantoes.F + r.plantoes.D}</td>
            <td>${r.plantoes.FO}</td>
            <td>${r.plantoes.FE}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;

  div.innerHTML = html;
}


// EXPORTA PARA CSV
function exportExcel() {
  if (!Object.keys(escala).length) {
    alert('Gere a escala antes de exportar.');
    return;
  }

  const totalDias = diasDoMes(config.mes, config.ano);
  const displayMap = { M: 'M', T: 'T', N: 'N', F: 'SAB', D: 'DOM', FO: 'FOLGA', FE: 'FERIAS', FERIADO: 'FERIADO', '': '' };

  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headers = ['Enfermeiro', 'Turno', 'COREN'];
  for (let d = 1; d <= totalDias; d++) {
    const dow = diaDaSemana(d, config.mes, config.ano);
    headers.push(`${d}-${DIAS_SEMANA[dow]}`);
  }
  headers.push('Total Horas');

  const rows = [headers.map(escape).join(',')];

  enfermeiros.forEach(enf => {
    const turnoLabel = { M: 'Manha', T: 'Tarde', N: 'Noite', FL: 'Flexivel' }[enf.turno] || enf.turno;
    const row = [enf.nome, turnoLabel, enf.coren || ''];
    let horas = 0;
    for (let d = 1; d <= totalDias; d++) {
      const v = escala[enf.id]?.[d] || '';
      row.push(displayMap[v] || v);
      if (v === 'M' || v === 'T') horas += 6;
      else if (v === 'N') horas += 12;
      else if (v === 'F' || v === 'D') horas += 10;
    }
    row.push(horas + 'h');
    rows.push(row.map(escape).join(','));
  });

  const bom = '\uFEFF';
  const csv = bom + rows.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Escala_${MESES[config.mes]}_${config.ano}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

//  INIT
(function init() {
  const agora = new Date();
  config.mes = agora.getMonth();
  config.ano = agora.getFullYear();
  document.getElementById('cfgMes').value = config.mes;
  document.getElementById('cfgAno').value = config.ano;

  carregarDoLocalStorage();
  renderTabelaEnfermeiros();
})();