// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
    authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
    projectId: "levantamentoestoqueweb-d71cb",
    storageBucket: "levantamentoestoqueweb-d71cb.firebasestorage.app",
    messagingSenderId: "743543905338",
    appId: "1:743543905338:web:189cabbd4d9297effea903",
    measurementId: "G-3ETPR2T1PM"
};

// Inicialização segura do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Sistema de feedback
function mostrarFeedback(mensagem, tipo = "sucesso") {
    const feedbackElement = document.getElementById('feedback-mensagem');
    if (feedbackElement) {
        feedbackElement.textContent = mensagem;
        feedbackElement.className = `alert alert-${tipo === 'sucesso' ? 'success' : 'danger'}`;
        feedbackElement.style.display = 'block';
        
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }
}

// Variáveis globais
let produtosSelecionados = [];

// Elementos da interface
const elements = {
    clienteSelect: document.getElementById('cliente'),
    grupoSelect: document.getElementById('grupoProduto'),
    searchInput: document.getElementById('searchInput'),
    tabelaProdutos: document.getElementById('tabelaProdutos'),
    btnRelatorio: document.getElementById('btnRelatorio'),
    btnCompartilhar: document.getElementById('btnCompartilhar'),
    btnLimpar: document.getElementById('btnLimpar'),
    painelRelatorio: document.getElementById('painelRelatorio'),
    btnFecharRelatorio: document.getElementById('btnFecharRelatorio'),
    relatorioCliente: document.getElementById('relatorioCliente'),
    relatorioData: document.getElementById('relatorioData'),
    relatorioItens: document.getElementById('relatorioItens'),
    btnImprimirRelatorio: document.getElementById('btnImprimirRelatorio'),
    btnFinalizarLevantamento: document.getElementById('btnFinalizarLevantamento'),
    painelHistorico: document.getElementById('painelHistorico'),
    btnFecharHistorico: document.getElementById('btnFecharHistorico'),
    tabelaHistorico: document.getElementById('tabelaHistorico')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
});

// Funções principais
async function verificarAutenticacao() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = "/index.html";
        return;
    }
    
    try {
        await Promise.all([
            carregarComponentes(),
            carregarDados(userId)
        ]);
        configurarEventos();
    } catch (error) {
        console.error("Erro na inicialização:", error);
        mostrarFeedback("Erro ao carregar a página", "erro");
    }
}

async function carregarComponentes() {
    try {
        await Promise.all([
            carregarHeader(),
            carregarFooter()
        ]);
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
        throw error;
    }
}

async function carregarHeader() {
    try {
        const response = await fetch('../html/header.html');
        if (!response.ok) throw new Error('Erro ao carregar cabeçalho');
        document.getElementById('header-container').innerHTML = await response.text();
    } catch (error) {
        console.error("Erro no carregamento do cabeçalho:", error);
        throw error;
    }
}

async function carregarFooter() {
    try {
        const response = await fetch('../html/footer.html');
        if (!response.ok) throw new Error('Erro ao carregar rodapé');
        document.getElementById('footer-container').innerHTML = await response.text();
    } catch (error) {
        console.error("Erro no carregamento do rodapé:", error);
        throw error;
    }
}

async function carregarDados(userId) {
    try {
        await Promise.all([
            carregarClientes(userId),
            carregarGrupos(userId),
            carregarProdutos(userId),
            carregarHistorico(userId)
        ]);
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        mostrarFeedback("Erro ao carregar dados", "erro");
        throw error;
    }
}

async function carregarClientes(userId) {
    try {
        elements.clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        const snapshot = await db.collection('vendedores').doc(userId).collection('clientes')
            .orderBy('nome')
            .get();
            
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().nome;
            elements.clienteSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        mostrarFeedback("Erro ao carregar lista de clientes", "erro");
        throw error;
    }
}

async function carregarGrupos(userId) {
    try {
        elements.grupoSelect.innerHTML = '<option value="">Todos os produtos</option>';
        const snapshot = await db.collection('vendedores').doc(userId).collection('grupos')
            .orderBy('nome')
            .get();
            
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.data().nome;
            option.textContent = doc.data().nome;
            elements.grupoSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar grupos:", error);
        mostrarFeedback("Erro ao carregar grupos de produtos", "erro");
        throw error;
    }
}

async function carregarProdutos(userId) {
    try {
        elements.tabelaProdutos.innerHTML = '<tr><td colspan="4" class="text-center py-4">Carregando produtos...</td></tr>';
        
        const snapshot = await db.collection('vendedores').doc(userId).collection('produtos')
            .orderBy('nome')
            .get();
        
        if (snapshot.empty) {
            elements.tabelaProdutos.innerHTML = '<tr><td colspan="4" class="text-center py-4">Nenhum produto cadastrado</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const produto = doc.data();
            html += `
                <tr data-id="${doc.id}" data-grupo="${produto.grupo || ''}">
                    <td>${produto.nome}</td>
                    <td><input type="number" min="0" value="${produto.estoque || 0}" class="form-control form-control-sm estoque"></td>
                    <td><input type="number" min="0" value="${produto.sugestao || 0}" class="form-control form-control-sm sugestao"></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary btn-adicionar" data-id="${doc.id}">
                            <i class="bi bi-plus-circle"></i> Adicionar
                        </button>
                    </td>
                </tr>
            `;
        });

        elements.tabelaProdutos.innerHTML = html;
        adicionarEventosProdutos();
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        elements.tabelaProdutos.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Erro ao carregar produtos</td></tr>';
        mostrarFeedback("Erro ao carregar produtos", "erro");
        throw error;
    }
}

async function carregarHistorico(userId) {
    try {
        if (!elements.tabelaHistorico) return;
        
        elements.tabelaHistorico.innerHTML = '<tr><td colspan="4">Carregando histórico...</td></tr>';
        
        const snapshot = await db.collection('vendedores').doc(userId).collection('levantamentos')
            .orderBy('data', 'desc')
            .limit(10)
            .get();
        
        if (snapshot.empty) {
            elements.tabelaHistorico.innerHTML = '<tr><td colspan="4">Nenhum histórico encontrado</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const levantamento = doc.data();
            html += `
                <tr>
                    <td>${new Date(levantamento.data?.toDate()).toLocaleDateString()}</td>
                    <td>${levantamento.clienteNome}</td>
                    <td>${levantamento.produtos?.length || 0}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary btn-ver-levantamento" data-id="${doc.id}">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        });

        elements.tabelaHistorico.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        if (elements.tabelaHistorico) {
            elements.tabelaHistorico.innerHTML = '<tr><td colspan="4">Erro ao carregar histórico</td></tr>';
        }
    }
}

// Funções de eventos
function configurarEventos() {
    // Filtros
    elements.grupoSelect?.addEventListener('change', filtrarProdutos);
    elements.searchInput?.addEventListener('input', filtrarProdutos);
    
    // Botões principais
    elements.btnRelatorio?.addEventListener('click', mostrarRelatorio);
    elements.btnFecharRelatorio?.addEventListener('click', () => elements.painelRelatorio?.classList.add('d-none'));
    elements.btnCompartilhar?.addEventListener('click', compartilharWhatsApp);
    elements.btnLimpar?.addEventListener('click', limparLevantamento);
    elements.btnImprimirRelatorio?.addEventListener('click', imprimirRelatorio);
    elements.btnFinalizarLevantamento?.addEventListener('click', finalizarLevantamento);
    elements.btnFecharHistorico?.addEventListener('click', () => elements.painelHistorico?.classList.add('d-none'));
}

function adicionarEventosProdutos() {
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const produto = {
                id: this.dataset.id,
                nome: row.querySelector('td').textContent,
                estoque: row.querySelector('.estoque').value,
                sugestao: row.querySelector('.sugestao').value
            };
            adicionarProduto(produto, this);
        });
    });
}

function filtrarProdutos() {
    const filtroGrupo = elements.grupoSelect?.value || '';
    const filtroTexto = elements.searchInput?.value.toLowerCase() || '';
    
    document.querySelectorAll("#tabelaProdutos tr").forEach(row => {
        if (!row.dataset.id) return;
        
        const grupo = row.dataset.grupo || '';
        const nome = row.querySelector('td').textContent.toLowerCase();
        
        const mostraGrupo = !filtroGrupo || grupo === filtroGrupo;
        const mostraTexto = !filtroTexto || nome.includes(filtroTexto);
        
        row.style.display = mostraGrupo && mostraTexto ? '' : 'none';
    });
}

// Funções de negócio
function adicionarProduto(produto, botao) {
    const index = produtosSelecionados.findIndex(p => p.id === produto.id);
    
    if (index >= 0) {
        produtosSelecionados[index] = produto;
        botao.innerHTML = '<i class="bi bi-check-circle"></i> Atualizado';
    } else {
        produtosSelecionados.push(produto);
        botao.innerHTML = '<i class="bi bi-check-circle-fill"></i> Adicionado';
        botao.classList.replace('btn-primary', 'btn-success');
    }
    
    botao.disabled = true;
    setTimeout(() => {
        botao.disabled = false;
        botao.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar';
        if (index < 0) {
            botao.classList.replace('btn-success', 'btn-primary');
        }
    }, 1500);
}

function mostrarRelatorio() {
    if (produtosSelecionados.length === 0) {
        mostrarFeedback("Nenhum produto foi adicionado ao levantamento ainda.", "erro");
        return;
    }
    
    const clienteSelecionado = elements.clienteSelect?.options[elements.clienteSelect.selectedIndex]?.text || 'Não selecionado';
    elements.relatorioCliente.textContent = clienteSelecionado;
    elements.relatorioData.textContent = new Date().toLocaleDateString();
    
    let html = '';
    produtosSelecionados.forEach(produto => {
        html += `
            <tr>
                <td>${produto.nome}</td>
                <td class="text-end">${produto.estoque}</td>
                <td class="text-end">${produto.sugestao}</td>
            </tr>
        `;
    });
    elements.relatorioItens.innerHTML = html;
    
    elements.painelRelatorio.classList.remove('d-none');
}

function compartilharWhatsApp() {
    if (produtosSelecionados.length === 0) {
        mostrarFeedback("Adicione produtos antes de compartilhar.", "erro");
        return;
    }
    
    const cliente = elements.clienteSelect?.options[elements.clienteSelect.selectedIndex]?.text || 'Cliente não especificado';
    
    let message = `*Levantamento de Estoque*\n\n`;
    message += `*Cliente:* ${cliente}\n`;
    message += `*Data:* ${new Date().toLocaleDateString()}\n\n`;
    message += `*Itens:*\n`;
    
    produtosSelecionados.forEach(produto => {
        message += `- ${produto.nome}\n  Estoque: ${produto.estoque} | Sugestão: ${produto.sugestao}\n`;
    });
    
    message += `\nTotal de itens: ${produtosSelecionados.length}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function limparLevantamento() {
    if (produtosSelecionados.length === 0) return;
    
    if (confirm('Tem certeza que deseja limpar todo o levantamento atual?')) {
        produtosSelecionados = [];
        document.querySelectorAll('.estoque, .sugestao').forEach(input => {
            input.value = '0';
        });
        elements.painelRelatorio.classList.add('d-none');
        mostrarFeedback("Levantamento limpo com sucesso!");
    }
}

function imprimirRelatorio() {
    window.print();
}

async function finalizarLevantamento() {
    const userId = localStorage.getItem('userId');
    const clienteId = elements.clienteSelect?.value;
    
    if (!clienteId) {
        mostrarFeedback("Selecione um cliente antes de finalizar.", "erro");
        return;
    }
    
    if (produtosSelecionados.length === 0) {
        mostrarFeedback("Adicione produtos antes de finalizar.", "erro");
        return;
    }
    
    try {
        elements.btnFinalizarLevantamento.disabled = true;
        elements.btnFinalizarLevantamento.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
        
        await db.collection('vendedores')
            .doc(userId)
            .collection('levantamentos')
            .add({
                clienteId,
                clienteNome: elements.clienteSelect.options[elements.clienteSelect.selectedIndex].text,
                produtos: produtosSelecionados,
                data: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'finalizado'
            });
        
        mostrarFeedback("Levantamento finalizado e salvo com sucesso!");
        limparLevantamento();
        await carregarHistorico(userId);
    } catch (error) {
        console.error("Erro ao salvar levantamento:", error);
        mostrarFeedback("Erro ao salvar levantamento. Tente novamente.", "erro");
    } finally {
        elements.btnFinalizarLevantamento.disabled = false;
        elements.btnFinalizarLevantamento.innerHTML = '<i class="bi bi-check-circle me-1"></i> Finalizar Levantamento';
    }
}