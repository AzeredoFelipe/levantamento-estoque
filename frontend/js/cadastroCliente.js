// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
    authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
    projectId: "levantamentoestoqueweb-d71cb",
    storageBucket: "levantamentoestoqueweb-d71cb.appspot.com",
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
let clienteEmEdicao = null;

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
    const tabela = document.getElementById('tabelaClientes');
    if (!tabela) return;
    
    tabela.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted py-4">
                <i class="bi bi-info-circle fs-4 d-block mb-2"></i>
                Clique em "Ver Clientes" para carregar a lista
            </td>
        </tr>
    `;
    
    const contador = document.getElementById('contadorClientes');
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
    const formCadastro = document.getElementById('formCadastroCliente');
    if (formCadastro) {
        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (user) {
                clienteEmEdicao ? editarCliente(user.uid) : cadastrarCliente(user.uid);
            }
        });
    }

    // Máscara para telefone
    document.getElementById('telefoneCliente')?.addEventListener('input', function(e) {
        const value = this.value.replace(/\D/g, '');
        if (value.length > 11) return false;
        
        // Formatação: (00) 00000-0000
        let formatted = value;
        if (value.length > 2) formatted = `(${value.substring(0,2)}) ${value.substring(2)}`;
        if (value.length > 7) formatted = `(${value.substring(0,2)}) ${value.substring(2,7)}-${value.substring(7,11)}`;
        
        this.value = formatted;
    });

    // Botão cancelar edição
    document.getElementById('btnCancelarEdicao')?.addEventListener('click', cancelarEdicao);
}

// Função para listar todos os clientes
function listarTodosClientes(userId) {
    carregarClientes(userId);
}

// Funções para clientes
async function carregarClientes(userId) {
    const tabela = document.getElementById('tabelaClientes');
    const contador = document.getElementById('contadorClientes');
    
    if (!tabela) return;

    try {
        tabela.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

        const snapshot = await db.collection('vendedores')
            .doc(userId)
            .collection('clientes')
            .orderBy('criadoEm', 'desc')
            .get();
        
        const clientes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            criadoEm: doc.data().criadoEm?.toDate().toLocaleDateString()
        }));

        if (contador) {
            contador.textContent = clientes.length;
        }

        if (clientes.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-person-x fs-5 d-block mb-2"></i>
                        Nenhum cliente cadastrado
                    </td>
                </tr>
            `;
            return;
        }

        tabela.innerHTML = clientes.map(cliente => `
            <tr>
                <td>${cliente.nome}</td>
                <td>${cliente.endereco || ''}</td>
                <td>${formatarTelefone(cliente.telefone)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary btn-editar me-2" 
                            data-id="${cliente.id}" 
                            data-nome="${cliente.nome}" 
                            data-endereco="${cliente.endereco || ''}" 
                            data-telefone="${cliente.telefone}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" 
                            data-id="${cliente.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        configurarEventosTabela();

    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-4">
                    Erro ao carregar clientes: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Formatador de telefone
function formatarTelefone(telefone) {
    if (!telefone) return '';
    const nums = telefone.replace(/\D/g, '');
    if (nums.length === 11) {
        return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (nums.length === 10) {
        return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
}

// Validação de cliente
function validarCliente(nome, telefone) {
    const erros = [];
    if (!nome || nome.length < 3) erros.push("Nome precisa ter pelo menos 3 caracteres");
    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
        erros.push("Telefone inválido (mínimo 10 dígitos)");
    }
    return erros;
}

// Cadastrar novo cliente
async function cadastrarCliente(userId) {
    const btnSubmit = document.getElementById('btnSubmitForm');
    const originalText = btnSubmit.innerHTML;
    
    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Salvando...';

        const nome = document.getElementById('nomeCliente').value.trim();
        const endereco = document.getElementById('enderecoCliente').value.trim();
        const telefone = document.getElementById('telefoneCliente').value.trim();

        const erros = validarCliente(nome, telefone);
        if (erros.length > 0) {
            mostrarFeedback(erros.join(", "), "warning");
            return;
        }

        await db.collection('vendedores')
            .doc(userId)
            .collection('clientes')
            .add({
                nome,
                endereco,
                telefone: telefone.replace(/\D/g, ''),
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

        mostrarFeedback("Cliente cadastrado com sucesso!", "success");
        document.getElementById('formCadastroCliente').reset();
        await carregarClientes(userId);
    } catch (error) {
        console.error("Erro ao cadastrar cliente:", error);
        mostrarFeedback("Erro ao cadastrar cliente", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

// Editar cliente existente
async function editarCliente(userId) {
    if (!clienteEmEdicao) return;

    const btnSubmit = document.getElementById('btnSubmitForm');
    const originalText = btnSubmit.innerHTML;
    
    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Atualizando...';

        const nome = document.getElementById('nomeCliente').value.trim();
        const endereco = document.getElementById('enderecoCliente').value.trim();
        const telefone = document.getElementById('telefoneCliente').value.trim();

        const erros = validarCliente(nome, telefone);
        if (erros.length > 0) {
            mostrarFeedback(erros.join(", "), "warning");
            return;
        }

        await db.collection('vendedores')
            .doc(userId)
            .collection('clientes')
            .doc(clienteEmEdicao.id)
            .update({
                nome,
                endereco,
                telefone: telefone.replace(/\D/g, ''),
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

        mostrarFeedback("Cliente atualizado com sucesso!", "success");
        document.getElementById('formCadastroCliente').reset();
        clienteEmEdicao = null;
        document.getElementById('btnCancelarEdicao').style.display = 'none';
        await carregarClientes(userId);
    } catch (error) {
        console.error("Erro ao editar cliente:", error);
        mostrarFeedback("Erro ao editar cliente", "danger");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

// Configurar eventos da tabela
function configurarEventosTabela() {
    // Botões editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => {
            clienteEmEdicao = {
                id: btn.dataset.id,
                nome: btn.dataset.nome,
                endereco: btn.dataset.endereco,
                telefone: btn.dataset.telefone
            };
            
            document.getElementById('nomeCliente').value = clienteEmEdicao.nome;
            document.getElementById('enderecoCliente').value = clienteEmEdicao.endereco || '';
            document.getElementById('telefoneCliente').value = clienteEmEdicao.telefone;
            document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
            document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-save"></i> Atualizar Cliente';
            
            document.getElementById('formCadastroCliente').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Botões excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', () => excluirCliente(btn.dataset.id));
    });
}

// Excluir cliente
async function excluirCliente(clienteId) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    const user = auth.currentUser;
    if (!user) {
        mostrarFeedback("Sessão expirada. Faça login novamente.", "danger");
        return;
    }

    try {
        await db.collection('vendedores')
            .doc(user.uid)
            .collection('clientes')
            .doc(clienteId)
            .delete();

        mostrarFeedback("Cliente excluído com sucesso!", "success");
        await carregarClientes(user.uid);
    } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        mostrarFeedback("Erro ao excluir cliente", "danger");
    }
}

// Cancelar edição
function cancelarEdicao() {
    clienteEmEdicao = null;
    document.getElementById('formCadastroCliente').reset();
    document.getElementById('btnCancelarEdicao').style.display = 'none';
    document.getElementById('btnSubmitForm').innerHTML = '<i class="bi bi-save"></i> Salvar Cliente';
}