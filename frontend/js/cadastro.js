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

// Inicialização do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Variáveis globais
let produtoEmEdicao = null;

// Listener de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Usuário autenticado:", user.uid);
        inicializarAplicacao(user.uid);
    } else {
        console.log("Usuário não autenticado - redirecionando...");
        window.location.href = "/index.html";
    }
});

// Função principal de inicialização
async function inicializarAplicacao(userId) {
    try {
        await carregarComponentes();
        await carregarGruposParaSelect(userId);
        await carregarGruposParaFiltro(userId);
        configurarEventos();
        mostrarEstadoInicial();
        mostrarFeedback("Sistema carregado com sucesso!", "success");
    } catch (error) {
        console.error("Erro na inicialização:", error);
        mostrarFeedback("Erro ao carregar o sistema", "danger");
    }
}

// Mostra o estado inicial da tabela
function mostrarEstadoInicial() {
    const tabela = document.getElementById('tabelaProdutos');
    if (!tabela) return;
    
    tabela.innerHTML = `
        <tr>
            <td colspan="3" class="text-center text-muted py-4">
                <i class="bi bi-info-circle fs-4 d-block mb-2"></i>
                Use os filtros acima para buscar produtos
            </td>
        </tr>
    `;
    
    const contador = document.getElementById('contadorProdutos');
    if (contador) {
        contador.textContent = '0';
    }
}

// Função para mostrar feedback
function mostrarFeedback(mensagem, tipo = "success") {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    feedbackElement.style.zIndex = '1000';
    feedbackElement.role = 'alert';
    feedbackElement.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(feedbackElement);
    
    setTimeout(() => {
        feedbackElement.remove();
    }, 5000);
}

// Carregar componentes da página
async function carregarComponentes() {
    try {
        await Promise.all([carregarHeader(), carregarFooter()]);
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
        throw error;
    }
}

async function carregarHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    try {
        const response = await fetch('/html/header.html');
        if (!response.ok) throw new Error('Erro ao carregar cabeçalho');
        headerContainer.innerHTML = await response.text();
    } catch (error) {
        console.error("Erro no cabeçalho:", error);
        throw error;
    }
}

async function carregarFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    try {
        const response = await fetch('/html/footer.html');
        if (!response.ok) throw new Error('Erro ao carregar rodapé');
        footerContainer.innerHTML = await response.text();
    } catch (error) {
        console.error("Erro no rodapé:", error);
        throw error;
    }
}

// Configuração de eventos
function configurarEventos() {
    // Formulário de cadastro
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (user) {
                produtoEmEdicao ? editarProduto(user.uid) : cadastrarProduto(user.uid);
            }
        });
    }

    // Botão adicionar grupo
    document.getElementById('btnAdicionarGrupo')?.addEventListener('click', toggleCampoNovoGrupo);
    
    // Botão salvar grupo
    document.getElementById('btnSalvarGrupo')?.addEventListener('click', salvarNovoGrupo);
    
    // Botão cancelar edição
    document.getElementById('btnCancelarEdicao')?.addEventListener('click', cancelarEdicao);
    
    // Configurar pesquisa e filtros
    configurarPesquisa();
}

// Função para listar todos os produtos
function listarTodosProdutos(userId) {
    document.getElementById('searchProdutos').value = '';
    document.getElementById('grupoProdutoFilter').value = '';
    carregarProdutos(userId);
}

// Funções para grupos
async function carregarGruposParaSelect(userId) {
    const select = document.getElementById('grupoProduto');
    if (!select) return;

    try {
        select.innerHTML = '<option value="">Selecione um grupo</option>';
        const snapshot = await db.collection('vendedores').doc(userId).collection('grupos').orderBy('nome').get();
        
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.data().nome;
            option.textContent = doc.data().nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar grupos:", error);
        throw error;
    }
}

async function carregarGruposParaFiltro(userId) {
    const select = document.getElementById('grupoProdutoFilter');
    if (!select) return;

    try {
        select.innerHTML = '<option value="">Todos os grupos</option>';
        const snapshot = await db.collection('vendedores').doc(userId).collection('grupos').orderBy('nome').get();
        
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.data().nome;
            option.textContent = doc.data().nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar grupos para filtro:", error);
        throw error;
    }
}

async function salvarNovoGrupo() {
    const user = auth.currentUser;
    if (!user) {
        mostrarFeedback("Sessão expirada. Faça login novamente.", "danger");
        return;
    }

    const nomeGrupo = document.getElementById('novoGrupo')?.value.trim();
    if (!nomeGrupo || nomeGrupo.length < 2) {
        mostrarFeedback("Nome do grupo deve ter pelo menos 2 caracteres", "warning");
        return;
    }

    try {
        // Verifica se grupo já existe
        const snapshot = await db.collection('vendedores')
            .doc(user.uid)
            .collection('grupos')
            .where('nome', '==', nomeGrupo)
            .get();

        if (!snapshot.empty) {
            mostrarFeedback("Este grupo já existe!", "warning");
            return;
        }

        // Adiciona novo grupo
        await db.collection('vendedores')
            .doc(user.uid)
            .collection('grupos')
            .add({
                nome: nomeGrupo,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

        mostrarFeedback("Grupo adicionado com sucesso!", "success");
        document.getElementById('novoGrupo').value = '';
        toggleCampoNovoGrupo();
        await Promise.all([
            carregarGruposParaSelect(user.uid),
            carregarGruposParaFiltro(user.uid)
        ]);
    } catch (error) {
        console.error("Erro ao salvar grupo:", error);
        mostrarFeedback("Erro ao salvar grupo", "danger");
    }
}

// Funções para produtos
async function cadastrarProduto(userId) {
    const btnSubmit = document.getElementById('btnSubmitForm');
    const originalText = btnSubmit.innerHTML;
    
    try {
        // Mostrar loading
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';

        const nomeProduto = document.getElementById('nomeProduto').value.trim();
        const grupoProduto = document.getElementById('grupoProduto').value;

        if (!validarDadosProduto(nomeProduto, grupoProduto)) return;

        await db.collection('vendedores')
            .doc(userId)
            .collection('produtos')
            .add({
                nome: nomeProduto,
                grupo: grupoProduto,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

        mostrarFeedback("Produto cadastrado com sucesso!", "success");
        document.getElementById('formCadastro').reset();
        await carregarProdutos(userId);
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        mostrarFeedback("Erro ao cadastrar produto", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

async function editarProduto(userId) {
    if (!produtoEmEdicao) return;

    const btnSubmit = document.getElementById('btnSubmitForm');
    const originalText = btnSubmit.innerHTML;
    
    try {
        // Mostrar loading
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Atualizando...';

        const nomeProduto = document.getElementById('nomeProduto').value.trim();
        const grupoProduto = document.getElementById('grupoProduto').value;

        if (!validarDadosProduto(nomeProduto, grupoProduto)) return;

        await db.collection('vendedores')
            .doc(userId)
            .collection('produtos')
            .doc(produtoEmEdicao.id)
            .update({
                nome: nomeProduto,
                grupo: grupoProduto,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

        mostrarFeedback("Produto atualizado com sucesso!", "success");
        document.getElementById('formCadastro').reset();
        produtoEmEdicao = null;
        document.getElementById('btnCancelarEdicao').style.display = 'none';
        await carregarProdutos(userId);
    } catch (error) {
        console.error("Erro ao editar produto:", error);
        mostrarFeedback("Erro ao editar produto", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

function validarDadosProduto(nome, grupo) {
    if (!nome || nome.length < 2) {
        mostrarFeedback("Nome do produto deve ter pelo menos 2 caracteres", "warning");
        return false;
    }
    if (!grupo) {
        mostrarFeedback("Selecione um grupo para o produto", "warning");
        return false;
    }
    return true;
}

// Configuração da pesquisa
function configurarPesquisa() {
    const searchInput = document.getElementById('searchProdutos');
    const grupoFilter = document.getElementById('grupoProdutoFilter');
    const btnLimpar = document.getElementById('btnLimparFiltros');
    const btnListarTodos = document.getElementById('btnListarTodos');
    const user = auth.currentUser;

    if (!user) return;

    // Configurar evento do botão Listar Todos
    btnListarTodos.addEventListener('click', () => {
        listarTodosProdutos(user.uid);
    });

    // Configurar evento de busca
    let timeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const texto = searchInput.value.trim().toLowerCase();
            const grupo = grupoFilter.value;
            carregarProdutos(user.uid, texto, grupo);
        }, 400);
    });

    // Configurar evento do filtro de grupo
    grupoFilter.addEventListener('change', () => {
        const grupo = grupoFilter.value;
        const texto = searchInput.value.trim().toLowerCase();
        carregarProdutos(user.uid, texto, grupo);
    });

    // Configurar botão limpar filtros
    btnLimpar.addEventListener('click', () => {
        listarTodosProdutos(user.uid);
    });
}

// Carregar produtos com filtros
async function carregarProdutos(userId, filtroTexto = '', grupoSelecionado = '') {
    const tabela = document.getElementById('tabelaProdutos');
    const contador = document.getElementById('contadorProdutos');
    
    if (!tabela) return;

    try {
        // Mostrar estado de carregamento
        tabela.innerHTML = '<tr><td colspan="3" class="text-center py-4">Carregando...</td></tr>';

        let query = db.collection('vendedores')
                    .doc(userId)
                    .collection('produtos');

        // Estratégia para evitar necessidade de índice composto:
        // 1. Primeiro busca todos os produtos ordenados por nome
        const snapshot = await query.orderBy('nome').get();
        let produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Aplica filtros localmente
        if (grupoSelecionado) {
            produtos = produtos.filter(p => p.grupo === grupoSelecionado);
        }
        
        if (filtroTexto) {
            const termo = filtroTexto.toLowerCase();
            produtos = produtos.filter(p => p.nome.toLowerCase().includes(termo));
        }

        // Limitar a 100 resultados para performance
        produtos = produtos.slice(0, 100);

        // Atualizar contador
        if (contador) {
            contador.textContent = produtos.length;
        }

        // Tratar resultados vazios
        if (produtos.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">
                        <i class="bi bi-search fs-4 d-block mb-2"></i>
                        Nenhum produto encontrado com esses filtros
                    </td>
                </tr>
            `;
            return;
        }

        // Preencher tabela
        tabela.innerHTML = produtos.map(produto => `
            <tr>
                <td>${produto.nome}</td>
                <td><span class="badge bg-secondary">${produto.grupo}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary btn-editar me-2" 
                            data-id="${produto.id}" 
                            data-nome="${produto.nome}" 
                            data-grupo="${produto.grupo}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" 
                            data-id="${produto.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        configurarEventosTabela();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        tabela.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger py-4">
                    Erro ao carregar produtos: ${error.message}
                </td>
            </tr>
        `;
        
        // Mostra o link para criar o índice se for esse o erro
        if (error.code === 'failed-precondition') {
            mostrarFeedback(`
                Erro de índice. 
                <a href="${error.message.match(/https:\/\/[^\s]+/)[0]}" target="_blank">
                    Clique aqui para criar o índice necessário
                </a>
            `, "danger");
        }
    }
}

// Configurar eventos da tabela
function configurarEventosTabela() {
    // Botões editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => {
            produtoEmEdicao = {
                id: btn.dataset.id,
                nome: btn.dataset.nome,
                grupo: btn.dataset.grupo
            };
            
            document.getElementById('nomeProduto').value = produtoEmEdicao.nome;
            document.getElementById('grupoProduto').value = produtoEmEdicao.grupo;
            document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
            document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-save"></i> Atualizar Produto';
            
            // Scroll para o formulário
            document.getElementById('formCadastro').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Botões excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', () => excluirProduto(btn.dataset.id));
    });
}

// Excluir produto
async function excluirProduto(produtoId) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    const user = auth.currentUser;
    if (!user) {
        mostrarFeedback("Sessão expirada. Faça login novamente.", "danger");
        return;
    }

    try {
        await db.collection('vendedores')
            .doc(user.uid)
            .collection('produtos')
            .doc(produtoId)
            .delete();

        mostrarFeedback("Produto excluído com sucesso!", "success");
        await carregarProdutos(user.uid);
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        mostrarFeedback("Erro ao excluir produto", "danger");
    }
}

// Funções auxiliares
function toggleCampoNovoGrupo() {
    const campo = document.getElementById('campoNovoGrupo');
    if (!campo) return;

    campo.style.display = campo.style.display === 'none' ? 'block' : 'none';
    if (campo.style.display === 'block') {
        document.getElementById('novoGrupo').focus();
    }
}

function cancelarEdicao() {
    produtoEmEdicao = null;
    document.getElementById('formCadastro').reset();
    document.getElementById('btnCancelarEdicao').style.display = 'none';
    document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-save"></i> Salvar Produto';
}