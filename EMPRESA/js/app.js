const state = {
  session: null,
  telares: [],
  produtos: [],
  apontamentos: [],
  currentView: 'dashboard',
  editingTelarId: null,
  editingProdutoId: null,
  editingApontamentoId: null,
  isSubmitting: false
};

const runtimeConfig = window.TECELAGEMPRO_CONFIG || window.__SUPABASE_CONFIG__ || {};

const supabaseClient = (() => {
  const url = runtimeConfig.supabaseUrl || runtimeConfig.url || '';
  const anonKey = runtimeConfig.supabaseAnonKey || runtimeConfig.anonKey || '';

  if (!window.supabase || !url || !anonKey || url.includes('SUA_') || anonKey.includes('SUA_')) {
    return null;
  }

  return window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));

const formatMeters = (value) => `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m`;

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const getEfficiencyTone = (value) => {
  if (value >= 90) return 'success';
  if (value >= 75) return 'warning';
  return 'danger';
};

const ensureSupabaseConfigured = () => {
  if (!supabaseClient) {
    Swal.fire({
      icon: 'warning',
      title: 'Configuração pendente',
      text: 'Preencha a URL e a anon key pública do Supabase em js/config.js ou em window.__SUPABASE_CONFIG__ antes de iniciar o sistema.',
      confirmButtonColor: '#1e3a8a'
    });
    return false;
  }

  return true;
};

const ui = {
  authScreen: document.getElementById('auth-screen'),
  appShell: document.getElementById('app-shell'),
  authSubtitle: document.getElementById('auth-subtitle'),
  registerForm: document.getElementById('register-form'),
  loginForm: document.getElementById('login-form'),
  loginTab: document.getElementById('tab-login'),
  registerTab: document.getElementById('tab-register'),
  loginToggleLink: document.getElementById('login-toggle-link'),
  registerToggleLink: document.getElementById('register-toggle-link'),
  userName: document.getElementById('user-name'),
  logoutButton: document.getElementById('logout-button'),
  navButtons: [...document.querySelectorAll('.nav-button')],
  viewSections: [...document.querySelectorAll('.view-section')],
  dashboardCounter: document.getElementById('dashboard-counter'),
  metricEfficiency: document.getElementById('metric-efficiency'),
  metricProduced: document.getElementById('metric-produced'),
  metricPlanned: document.getElementById('metric-planned'),
  metricLoss: document.getElementById('metric-loss'),
  lossChartCanvas: document.getElementById('loss-by-reason-chart'),
  lossChartEmpty: document.getElementById('loss-chart-empty'),
  reasonFrequencyCanvas: document.getElementById('reason-frequency-chart'),
  reasonFrequencyEmpty: document.getElementById('reason-frequency-empty'),
  dashboardTableBody: document.getElementById('dashboard-table-body'),
  filterStartDate: document.getElementById('filter-start-date'),
  filterEndDate: document.getElementById('filter-end-date'),
  filterTelar: document.getElementById('filter-telar'),
  filterProduto: document.getElementById('filter-produto'),
  telarForm: document.getElementById('telar-form'),
  telarFormTitle: document.getElementById('telar-form-title'),
  telarCodigo: document.getElementById('telar-codigo'),
  telarTipo: document.getElementById('telar-tipo'),
  telarRpm: document.getElementById('telar-rpm'),
  telarStatus: document.getElementById('telar-status'),
  cancelTelarEdit: document.getElementById('cancel-telar-edit'),
  telarTableBody: document.getElementById('telares-table-body'),
  produtoForm: document.getElementById('produto-form'),
  produtoFormTitle: document.getElementById('produto-form-title'),
  produtoNome: document.getElementById('produto-nome'),
  produtoComposicao: document.getElementById('produto-composicao'),
  produtoCusto: document.getElementById('produto-custo'),
  produtoPreco: document.getElementById('produto-preco'),
  cancelProdutoEdit: document.getElementById('cancel-produto-edit'),
  produtosTableBody: document.getElementById('produtos-table-body'),
  apontamentoForm: document.getElementById('apontamento-form'),
  apontamentoFormTitle: document.getElementById('apontamento-form-title'),
  apontamentoTelar: document.getElementById('apontamento-telar'),
  apontamentoProduto: document.getElementById('apontamento-produto'),
  apontamentoData: document.getElementById('apontamento-data'),
  apontamentoTurno: document.getElementById('apontamento-turno'),
  apontamentoPlanejados: document.getElementById('apontamento-planejados'),
  apontamentoProduzidos: document.getElementById('apontamento-produzidos'),
  apontamentoParadas: document.getElementById('apontamento-paradas'),
  apontamentoMotivo: document.getElementById('apontamento-motivo'),
  cancelApontamentoEdit: document.getElementById('cancel-apontamento-edit'),
  apontamentosTableBody: document.getElementById('apontamentos-table-body')
};

let lossByReasonChart = null;
let reasonFrequencyChart = null;

const setView = (view) => {
  state.currentView = view;
  ui.navButtons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle('active', isActive);
    button.classList.toggle('text-brand', isActive);
    button.classList.toggle('text-slate-600', !isActive);
  });

  ui.viewSections.forEach((section) => {
    const isActive = section.id === `${view}-section`;
    section.classList.toggle('hidden', !isActive);
    section.classList.toggle('active', isActive);
  });
};

const setAuthFormMode = (mode) => {
  const loginVisible = mode === 'login';
  ui.loginForm.classList.toggle('hidden', !loginVisible);
  ui.registerForm.classList.toggle('hidden', loginVisible);
  ui.loginTab.classList.toggle('active', loginVisible);
  ui.registerTab.classList.toggle('active', !loginVisible);
  ui.loginTab.classList.toggle('text-brand', loginVisible);
  ui.registerTab.classList.toggle('text-brand', !loginVisible);
  ui.loginTab.classList.toggle('text-slate-500', !loginVisible);
  ui.registerTab.classList.toggle('text-slate-500', loginVisible);
  ui.authSubtitle.textContent = loginVisible ? 'Entre com sua conta para continuar.' : 'Crie sua conta para começar a operar.';
};

const updateSessionUI = () => {
  const isLoggedIn = Boolean(state.session);
  ui.authScreen.classList.toggle('hidden', isLoggedIn);
  ui.appShell.classList.toggle('hidden', !isLoggedIn);

  if (isLoggedIn) {
    const profileName = state.session.user?.user_metadata?.nome_completo || state.session.user?.email || 'Usuário';
    ui.userName.textContent = profileName;
    setView('dashboard');
  }
};

const populateSelects = () => {
  const telarOptions = state.telares
    .map((telar) => `<option value="${telar.id}">${telar.codigo_telar} · ${telar.tipo}</option>`)
    .join('');

  const produtoOptions = state.produtos
    .map((produto) => `<option value="${produto.id}">${produto.nome_tecido}</option>`)
    .join('');

  ui.apontamentoTelar.innerHTML = `<option value="">Selecione um telar</option>${telarOptions}`;
  ui.apontamentoProduto.innerHTML = `<option value="">Selecione um produto</option>${produtoOptions}`;
  ui.filterTelar.innerHTML = `<option value="">Todos</option>${telarOptions}`;
  ui.filterProduto.innerHTML = `<option value="">Todos</option>${produtoOptions}`;
};

const safeError = (error) => {
  const message = error?.message || 'Erro inesperado.';
  Swal.fire({
    icon: 'error',
    title: 'Operação falhou',
    text: message,
    confirmButtonColor: '#1e3a8a'
  });
};

const getFilteredApontamentos = () => {
  const start = ui.filterStartDate.value ? new Date(`${ui.filterStartDate.value}T00:00:00`) : null;
  const end = ui.filterEndDate.value ? new Date(`${ui.filterEndDate.value}T23:59:59`) : null;
  const telarFilter = ui.filterTelar.value;
  const produtoFilter = ui.filterProduto.value;

  return state.apontamentos.filter((item) => {
    const date = new Date(`${item.data_apontamento}T00:00:00`);
    const validStart = !start || date >= start;
    const validEnd = !end || date <= end;
    const validTelar = !telarFilter || item.telar_id === telarFilter;
    const validProduto = !produtoFilter || item.produto_id === produtoFilter;
    return validStart && validEnd && validTelar && validProduto;
  });
};

const renderLossByReasonChart = (filtered) => {
  const totalsByReason = new Map();

  filtered.forEach((item) => {
    const reason = item.motivo_parada?.trim();
    if (!reason) return;
    const loss = Number(item.perda_financeira || 0);
    totalsByReason.set(reason, (totalsByReason.get(reason) || 0) + loss);
  });

  const entries = [...totalsByReason.entries()]
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);

  if (lossByReasonChart) {
    lossByReasonChart.destroy();
    lossByReasonChart = null;
  }

  ui.lossChartCanvas.classList.toggle('hidden', entries.length === 0);
  ui.lossChartEmpty.classList.toggle('hidden', entries.length > 0);
  if (!entries.length || !window.Chart) return;

  lossByReasonChart = new window.Chart(ui.lossChartCanvas, {
    type: 'bar',
    data: {
      labels: entries.map(([reason]) => reason),
      datasets: [{
        label: 'Perda financeira',
        data: entries.map(([, total]) => total),
        backgroundColor: '#0284c7',
        borderRadius: 8,
        maxBarThickness: 48
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (context) => ` ${formatCurrency(context.parsed.x)}` }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { callback: (value) => formatCurrency(value) },
          grid: { color: '#e2e8f0' }
        },
        y: { grid: { display: false } }
      }
    }
  });
};

const renderReasonFrequencyChart = (filtered) => {
  const countsByReason = new Map();
  filtered.forEach((item) => {
    const reason = item.motivo_parada?.trim();
    if (!reason) return;
    countsByReason.set(reason, (countsByReason.get(reason) || 0) + 1);
  });
  const entries = [...countsByReason.entries()].sort((a, b) => b[1] - a[1]);

  if (reasonFrequencyChart) {
    reasonFrequencyChart.destroy();
    reasonFrequencyChart = null;
  }
  ui.reasonFrequencyCanvas.classList.toggle('hidden', entries.length === 0);
  ui.reasonFrequencyEmpty.classList.toggle('hidden', entries.length > 0);
  if (!entries.length || !window.Chart) return;

  reasonFrequencyChart = new window.Chart(ui.reasonFrequencyCanvas, {
    type: 'bar',
    data: {
      labels: entries.map(([reason]) => reason),
      datasets: [{
        label: 'Ocorrências',
        data: entries.map(([, count]) => count),
        backgroundColor: '#dc2626',
        borderRadius: 8,
        maxBarThickness: 48
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (context) => ` ${context.parsed.x} ocorrência${context.parsed.x === 1 ? '' : 's'}` }
        }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 }, grid: { color: '#e2e8f0' } },
        y: { grid: { display: false } }
      }
    }
  });
};

const renderDashboard = () => {
  const filtered = getFilteredApontamentos();
  const totalPlanejado = filtered.reduce((acc, item) => acc + Number(item.metros_planejados || 0), 0);
  const totalProduzido = filtered.reduce((acc, item) => acc + Number(item.metros_produzidos || 0), 0);
  const perdasTotais = filtered.reduce((acc, item) => acc + Number(item.perda_financeira || 0), 0);
  const mediaEf = filtered.length
    ? filtered.reduce((acc, item) => acc + Number(item.eficiencia_percentual || 0), 0) / filtered.length
    : 0;

  ui.metricEfficiency.textContent = formatPercent(mediaEf);
  ui.metricProduced.textContent = formatMeters(totalProduzido);
  ui.metricPlanned.textContent = formatMeters(totalPlanejado);
  ui.metricLoss.textContent = formatCurrency(perdasTotais);

  ui.metricEfficiency.className = `mt-2 text-3xl font-extrabold ${mediaEf >= 90 ? 'text-emerald-600' : mediaEf >= 75 ? 'text-amber-600' : 'text-red-600'}`;

  ui.dashboardCounter.textContent = `${filtered.length} registro${filtered.length === 1 ? '' : 's'}`;
  renderLossByReasonChart(filtered);
  renderReasonFrequencyChart(filtered);

  if (!filtered.length) {
    ui.dashboardTableBody.innerHTML = '<tr><td colspan="9" class="empty-state">Nenhum apontamento encontrado para o período selecionado.</td></tr>';
    return;
  }

  ui.dashboardTableBody.innerHTML = filtered
    .map((item) => {
      const tone = getEfficiencyTone(Number(item.eficiencia_percentual || 0));
      const motivoParada = item.motivo_parada?.trim() ? item.motivo_parada : '—';
      return `
        <tr class="border-b border-slate-100">
          <td class="px-4 py-3">${new Date(`${item.data_apontamento}T00:00:00`).toLocaleDateString('pt-BR')}</td>
          <td class="px-4 py-3">${item.telar?.codigo_telar || '—'}</td>
          <td class="px-4 py-3">${item.produto?.nome_tecido || '—'}</td>
          <td class="px-4 py-3">${item.turnos || '—'}</td>
          <td class="px-4 py-3">${formatMeters(item.metros_planejados)}</td>
          <td class="px-4 py-3">${formatMeters(item.metros_produzidos)}</td>
          <td class="px-4 py-3"><span class="status-badge ${tone}">${formatPercent(item.eficiencia_percentual)}</span></td>
          <td class="px-4 py-3">${formatCurrency(item.perda_financeira)}</td>
          <td class="px-4 py-3">${motivoParada}</td>
        </tr>
      `;
    })
    .join('');
};

const renderTelaresTable = () => {
  if (!state.telares.length) {
    ui.telarTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum telar cadastrado.</td></tr>';
    return;
  }

  ui.telarTableBody.innerHTML = state.telares
    .map((telar) => {
      const tone = telar.status === 'Ativo' ? 'success' : telar.status === 'Manutenção' ? 'warning' : 'danger';
      return `
        <tr class="border-b border-slate-100">
          <td class="px-4 py-3 font-medium text-slate-800">${telar.codigo_telar}</td>
          <td class="px-4 py-3">${telar.tipo}</td>
          <td class="px-4 py-3">${telar.rpm_nominal}</td>
          <td class="px-4 py-3"><span class="status-badge ${tone}">${telar.status}</span></td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <button type="button" class="table-action" data-action="edit-telar" data-id="${telar.id}"><i data-lucide="pencil" class="h-3.5 w-3.5"></i></button>
              <button type="button" class="table-action delete" data-action="delete-telar" data-id="${telar.id}"><i data-lucide="trash-2" class="h-3.5 w-3.5"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const renderProdutosTable = () => {
  if (!state.produtos.length) {
    ui.produtosTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum produto cadastrado.</td></tr>';
    return;
  }

  ui.produtosTableBody.innerHTML = state.produtos
    .map(
      (produto) => `
        <tr class="border-b border-slate-100">
          <td class="px-4 py-3 font-medium text-slate-800">${produto.nome_tecido}</td>
          <td class="px-4 py-3">${produto.composicao}</td>
          <td class="px-4 py-3">${formatCurrency(produto.custo_metro_base)}</td>
          <td class="px-4 py-3">${formatCurrency(produto.preco_venda_metro)}</td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <button type="button" class="table-action" data-action="edit-produto" data-id="${produto.id}"><i data-lucide="pencil" class="h-3.5 w-3.5"></i></button>
              <button type="button" class="table-action delete" data-action="delete-produto" data-id="${produto.id}"><i data-lucide="trash-2" class="h-3.5 w-3.5"></i></button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const renderApontamentosTable = () => {
  if (!state.apontamentos.length) {
    ui.apontamentosTableBody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum apontamento registrado.</td></tr>';
    return;
  }

  ui.apontamentosTableBody.innerHTML = state.apontamentos
    .map((item) => {
      const efficiencyTone = getEfficiencyTone(Number(item.eficiencia_percentual || 0));
      const motivoParada = item.motivo_parada?.trim() ? item.motivo_parada : '—';
      return `
        <tr class="border-b border-slate-100">
          <td class="px-4 py-3">${new Date(`${item.data_apontamento}T00:00:00`).toLocaleDateString('pt-BR')}</td>
          <td class="px-4 py-3">${item.telar?.codigo_telar || '—'}</td>
          <td class="px-4 py-3">${item.produto?.nome_tecido || '—'}</td>
          <td class="px-4 py-3"><span class="status-badge ${efficiencyTone}">${formatPercent(item.eficiencia_percentual)}</span></td>
          <td class="px-4 py-3">${formatCurrency(item.perda_financeira)}</td>
          <td class="px-4 py-3">${item.horas_paradas || '0'} h</td>
          <td class="px-4 py-3">${motivoParada}</td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <button type="button" class="table-action" data-action="edit-apontamento" data-id="${item.id}"><i data-lucide="pencil" class="h-3.5 w-3.5"></i></button>
              <button type="button" class="table-action delete" data-action="delete-apontamento" data-id="${item.id}"><i data-lucide="trash-2" class="h-3.5 w-3.5"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const fetchData = async () => {
  if (!supabaseClient || !state.session) return;

  const userId = state.session.user.id;

  const [telaresResult, produtosResult, apontamentosResult] = await Promise.all([
    supabaseClient.from('telares').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseClient.from('produtos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseClient
      .from('apontamentos')
      .select('*, telar:telares(codigo_telar, tipo), produto:produtos(nome_tecido)')
      .eq('user_id', userId)
      .order('data_apontamento', { ascending: false })
  ]);

  if (telaresResult.error) throw telaresResult.error;
  if (produtosResult.error) throw produtosResult.error;
  if (apontamentosResult.error) throw apontamentosResult.error;

  state.telares = telaresResult.data || [];
  state.produtos = produtosResult.data || [];
  state.apontamentos = apontamentosResult.data || [];

  populateSelects();
  renderTelaresTable();
  renderProdutosTable();
  renderApontamentosTable();
  renderDashboard();
};

const handleAuth = async (event, mode) => {
  event.preventDefault();
  if (!supabaseClient) return;

  const email = mode === 'login' ? document.getElementById('login-email').value.trim() : document.getElementById('register-email').value.trim();
  const password = mode === 'login' ? document.getElementById('login-password').value : document.getElementById('register-password').value;

  try {
    if (mode === 'login') {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      Swal.fire({
        icon: 'success',
        title: 'Login realizado',
        text: 'Acesso liberado com sucesso.',
        confirmButtonColor: '#1e3a8a'
      });
    } else {
      const nomeCompleto = document.getElementById('register-name').value.trim();
      const cargo = document.getElementById('register-role').value.trim();
      const setor = document.getElementById('register-sector').value.trim();

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nomeCompleto,
            cargo,
            setor
          }
        }
      });

      if (error) throw error;
      Swal.fire({
        icon: 'success',
        title: 'Conta criada',
        text: 'Seu cadastro foi realizado. Verifique o e-mail para confirmar a conta.',
        confirmButtonColor: '#1e3a8a'
      });
      setAuthFormMode('login');
    }
  } catch (error) {
    const message = error?.message || 'Não foi possível completar a operação.';
    Swal.fire({
      icon: 'error',
      title: mode === 'login' ? 'Falha ao entrar' : 'Falha ao cadastrar',
      text: message,
      confirmButtonColor: '#1e3a8a'
    });
  }
};

const resetTelarForm = () => {
  state.editingTelarId = null;
  ui.telarForm.reset();
  ui.telarFormTitle.textContent = 'Novo telar';
  ui.cancelTelarEdit.classList.add('hidden');
};

const resetProdutoForm = () => {
  state.editingProdutoId = null;
  ui.produtoForm.reset();
  ui.produtoFormTitle.textContent = 'Novo produto';
  ui.cancelProdutoEdit.classList.add('hidden');
};

const resetApontamentoForm = () => {
  state.editingApontamentoId = null;
  ui.apontamentoForm.reset();
  ui.apontamentoData.value = new Date().toISOString().slice(0, 10);
  ui.apontamentoFormTitle.textContent = 'Novo apontamento';
  ui.cancelApontamentoEdit.classList.add('hidden');
};

const saveTelar = async (event) => {
  event.preventDefault();
  if (!supabaseClient || !state.session) return;

  const payload = {
    codigo_telar: ui.telarCodigo.value.trim(),
    tipo: ui.telarTipo.value,
    rpm_nominal: Number(ui.telarRpm.value),
    status: ui.telarStatus.value,
    user_id: state.session.user.id
  };

  try {
    if (state.editingTelarId) {
      const { error } = await supabaseClient.from('telares').update(payload).eq('id', state.editingTelarId).eq('user_id', state.session.user.id);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Telar atualizado', confirmButtonColor: '#1e3a8a' });
    } else {
      const { error } = await supabaseClient.from('telares').insert([{ ...payload }]);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Telar cadastrado', confirmButtonColor: '#1e3a8a' });
    }

    resetTelarForm();
    await fetchData();
  } catch (error) {
    safeError(error);
  }
};

const saveProduto = async (event) => {
  event.preventDefault();
  if (!supabaseClient || !state.session) return;

  const payload = {
    nome_tecido: ui.produtoNome.value.trim(),
    composicao: ui.produtoComposicao.value.trim(),
    custo_metro_base: Number(ui.produtoCusto.value),
    preco_venda_metro: Number(ui.produtoPreco.value),
    user_id: state.session.user.id
  };

  try {
    if (state.editingProdutoId) {
      const { error } = await supabaseClient.from('produtos').update(payload).eq('id', state.editingProdutoId).eq('user_id', state.session.user.id);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Produto atualizado', confirmButtonColor: '#1e3a8a' });
    } else {
      const { error } = await supabaseClient.from('produtos').insert([{ ...payload }]);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Produto cadastrado', confirmButtonColor: '#1e3a8a' });
    }

    resetProdutoForm();
    await fetchData();
  } catch (error) {
    safeError(error);
  }
};

const saveApontamento = async (event) => {
  event.preventDefault();
  if (!supabaseClient || !state.session) return;

  const payload = {
    telar_id: ui.apontamentoTelar.value,
    produto_id: ui.apontamentoProduto.value,
    data_apontamento: ui.apontamentoData.value,
    turnos: ui.apontamentoTurno.value,
    metros_planejados: Number(ui.apontamentoPlanejados.value),
    metros_produzidos: Number(ui.apontamentoProduzidos.value),
    horas_paradas: Number(ui.apontamentoParadas.value || 0),
    motivo_parada: ui.apontamentoMotivo.value.trim(),
    user_id: state.session.user.id
  };

  try {
    if (state.editingApontamentoId) {
      const { error } = await supabaseClient.from('apontamentos').update(payload).eq('id', state.editingApontamentoId).eq('user_id', state.session.user.id);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Apontamento atualizado', confirmButtonColor: '#1e3a8a' });
    } else {
      const { error } = await supabaseClient.from('apontamentos').insert([{ ...payload }]);
      if (error) throw error;
      Swal.fire({ icon: 'success', title: 'Apontamento registrado', confirmButtonColor: '#1e3a8a' });
    }

    resetApontamentoForm();
    await fetchData();
  } catch (error) {
    safeError(error);
  }
};

const openTelarEditor = (id) => {
  const telar = state.telares.find((item) => item.id === id);
  if (!telar) return;

  state.editingTelarId = id;
  ui.telarFormTitle.textContent = 'Editar telar';
  ui.telarCodigo.value = telar.codigo_telar;
  ui.telarTipo.value = telar.tipo;
  ui.telarRpm.value = telar.rpm_nominal;
  ui.telarStatus.value = telar.status;
  ui.cancelTelarEdit.classList.remove('hidden');
  setView('telares');
};

const openProdutoEditor = (id) => {
  const produto = state.produtos.find((item) => item.id === id);
  if (!produto) return;

  state.editingProdutoId = id;
  ui.produtoFormTitle.textContent = 'Editar produto';
  ui.produtoNome.value = produto.nome_tecido;
  ui.produtoComposicao.value = produto.composicao;
  ui.produtoCusto.value = produto.custo_metro_base;
  ui.produtoPreco.value = produto.preco_venda_metro;
  ui.cancelProdutoEdit.classList.remove('hidden');
  setView('produtos');
};

const openApontamentoEditor = (id) => {
  const item = state.apontamentos.find((record) => record.id === id);
  if (!item) return;

  state.editingApontamentoId = id;
  ui.apontamentoFormTitle.textContent = 'Editar apontamento';
  ui.apontamentoTelar.value = item.telar_id;
  ui.apontamentoProduto.value = item.produto_id;
  ui.apontamentoData.value = item.data_apontamento;
  ui.apontamentoTurno.value = item.turnos;
  ui.apontamentoPlanejados.value = item.metros_planejados;
  ui.apontamentoProduzidos.value = item.metros_produzidos;
  ui.apontamentoParadas.value = item.horas_paradas || 0;
  ui.apontamentoMotivo.value = item.motivo_parada || '';
  ui.cancelApontamentoEdit.classList.remove('hidden');
  setView('apontamentos');
};

const deleteTelar = async (id) => {
  const result = await Swal.fire({
    title: 'Excluir telar?',
    text: 'Essa ação não poderá ser revertida.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Excluir',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed || !supabaseClient || !state.session) return;

  try {
    const { error } = await supabaseClient.from('telares').delete().eq('id', id).eq('user_id', state.session.user.id);
    if (error) throw error;
    Swal.fire({ icon: 'success', title: 'Telar removido', confirmButtonColor: '#1e3a8a' });
    await fetchData();
  } catch (error) {
    safeError(error);
  }
};

const deleteProduto = async (id) => {
  const result = await Swal.fire({
    title: 'Excluir produto?',
    text: 'Esta ação removerá também possíveis vínculos em apontamentos.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Excluir',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed || !supabaseClient || !state.session) return;

  try {
    const { error } = await supabaseClient.from('produtos').delete().eq('id', id).eq('user_id', state.session.user.id);
    if (error) throw error;
    Swal.fire({ icon: 'success', title: 'Produto removido', confirmButtonColor: '#1e3a8a' });
    await fetchData();
  } catch (error) {
    safeError(error);
  }
};

const deleteApontamento = async (id) => {
  const result = await Swal.fire({
    title: 'Excluir apontamento?',
    text: 'Os dados de produção serão removidos do histórico.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Excluir',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed || !supabaseClient || !state.session) return;

  try {
    const { error } = await supabaseClient.from('apontamentos').delete().eq('id', id).eq('user_id', state.session.user.id);
    if (error) throw error;
    Swal.fire({ icon: 'success', title: 'Apontamento removido', confirmButtonColor: '#1e3a8a' });
    await fetchData();
  } catch (error) {
    safeError(error);
  }
};

const bindEvents = () => {
  ui.loginTab.addEventListener('click', () => setAuthFormMode('login'));
  ui.registerTab.addEventListener('click', () => setAuthFormMode('register'));
  ui.loginToggleLink.addEventListener('click', () => setAuthFormMode('register'));
  ui.registerToggleLink.addEventListener('click', () => setAuthFormMode('login'));
  ui.loginForm.addEventListener('submit', (event) => handleAuth(event, 'login'));
  ui.registerForm.addEventListener('submit', (event) => handleAuth(event, 'register'));
  ui.logoutButton.addEventListener('click', async () => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      safeError(error);
      return;
    }

    state.session = null;
    state.telares = [];
    state.produtos = [];
    state.apontamentos = [];
    ui.userName.textContent = 'Usuário';
    updateSessionUI();
  });

  ui.navButtons.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  ui.filterStartDate.addEventListener('change', renderDashboard);
  ui.filterEndDate.addEventListener('change', renderDashboard);
  ui.filterTelar.addEventListener('change', renderDashboard);
  ui.filterProduto.addEventListener('change', renderDashboard);

  ui.telarForm.addEventListener('submit', saveTelar);
  ui.cancelTelarEdit.addEventListener('click', resetTelarForm);
  ui.produtoForm.addEventListener('submit', saveProduto);
  ui.cancelProdutoEdit.addEventListener('click', resetProdutoForm);
  ui.apontamentoForm.addEventListener('submit', saveApontamento);
  ui.cancelApontamentoEdit.addEventListener('click', resetApontamentoForm);

  document.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    const { action, id } = actionButton.dataset;

    if (action === 'edit-telar') openTelarEditor(id);
    if (action === 'delete-telar') deleteTelar(id);
    if (action === 'edit-produto') openProdutoEditor(id);
    if (action === 'delete-produto') deleteProduto(id);
    if (action === 'edit-apontamento') openApontamentoEditor(id);
    if (action === 'delete-apontamento') deleteApontamento(id);
  });

  ui.apontamentoData.value = new Date().toISOString().slice(0, 10);
};

const initialize = async () => {
  bindEvents();
  setAuthFormMode('login');
  updateSessionUI();

  if (!supabaseClient) {
    return;
  }

  try {
    const { data: { session } = {}, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    state.session = session;
    updateSessionUI();

    if (session) {
      await fetchData();
    }

    supabaseClient.auth.onAuthStateChange(async (event, nextSession) => {
      state.session = nextSession;
      updateSessionUI();

      if (nextSession) {
        try {
          await fetchData();
        } catch (fetchError) {
          safeError(fetchError);
        }
      } else {
        state.telares = [];
        state.produtos = [];
        state.apontamentos = [];
        ui.filterTelar.innerHTML = '<option value="">Todos</option>';
        ui.filterProduto.innerHTML = '<option value="">Todos</option>';
        renderTelaresTable();
        renderProdutosTable();
        renderApontamentosTable();
        renderDashboard();
      }
    });
  } catch (error) {
    safeError(error);
  }
};

document.addEventListener('DOMContentLoaded', initialize);

if (window.lucide) {
  window.lucide.createIcons();
}
