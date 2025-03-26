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

// Sistema de feedback melhorado
function mostrarFeedback(mensagem, tipo = "sucesso") {
    const feedbackElement = document.getElementById('feedback-mensagem') || document.getElementById('mensagem');
    if (feedbackElement) {
        feedbackElement.textContent = mensagem;
        feedbackElement.className = `feedback-${tipo}`;
        feedbackElement.style.display = 'block';
        
        // Oculta após 5 segundos
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }
    
    // Fallback para console
    tipo === 'erro' ? console.error(mensagem) : console.log(mensagem);
}

// Carregar componentes da página
async function carregarComponentes() {
    try {
        await Promise.all([carregarHeader(), carregarFooter()]);
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
        mostrarFeedback("Erro ao carregar componentes da página", "erro");
    }
}

// Função para carregar o cabeçalho
async function carregarHeader() {
    try {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) return;

        const response = await fetch('/html/header.html');
        if (!response.ok) throw new Error('Erro ao carregar cabeçalho');
        
        const html = await response.text();
        headerContainer.innerHTML = html;
    } catch (error) {
        console.error("Erro no carregamento do cabeçalho:", error);
        throw error;
    }
}

// Função para carregar o rodapé
async function carregarFooter() {
    try {
        const footerContainer = document.getElementById('footer-container');
        if (!footerContainer) return;

        const response = await fetch('/html/footer.html');
        if (!response.ok) throw new Error('Erro ao carregar rodapé');
        
        const html = await response.text();
        footerContainer.innerHTML = html;
    } catch (error) {
        console.error("Erro no carregamento do rodapé:", error);
        throw error;
    }
}

// Função para carregar os clientes cadastrados
async function carregarClientes() {
    const user = auth.currentUser;
    if (!user) {
        mostrarFeedback("Sessão expirada. Faça login novamente.", "erro");
        window.location.href = "/index.html";
        return;
    }

    const tabelaClientes = document.getElementById('tabelaClientes');
    if (!tabelaClientes) {
        console.warn("Tabela de clientes não encontrada");
        return;
    }

    try {
        tabelaClientes.innerHTML = ''; // Limpa a tabela
        
        // Adiciona loading state
        tabelaClientes.innerHTML = '<tr><td colspan="3">Carregando clientes...</td></tr>';
        
        const querySnapshot = await db.collection('vendedores')
            .doc(user.uid)
            .collection('clientes')
            .orderBy('nome') // Ordena por nome
            .get();

        if (querySnapshot.empty) {
            tabelaClientes.innerHTML = '<tr><td colspan="3">Nenhum cliente cadastrado</td></tr>';
            return;
        }

        tabelaClientes.innerHTML = ''; // Limpa o loading state
        
        querySnapshot.forEach((doc) => {
            const cliente = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.endereco}</td>
                <td>${formatarTelefone(cliente.telefone)}</td>
            `;
            tabelaClientes.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        tabelaClientes.innerHTML = '<tr><td colspan="3">Erro ao carregar clientes</td></tr>';
        mostrarFeedback("Erro ao carregar lista de clientes", "erro");
    }
}

// Função para formatar número de telefone
function formatarTelefone(telefone) {
    if (!telefone) return '';
    // Remove tudo que não é dígito
    const numeros = telefone.replace(/\D/g, '');
    
    // Formata (XX) XXXXX-XXXX
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// Função para validar dados do cliente
function validarCliente(nome, endereco, telefone) {
    const erros = [];
    
    if (!nome || nome.length < 3) {
        erros.push("Nome deve ter pelo menos 3 caracteres");
    }
    
    if (!endereco || endereco.length < 5) {
        erros.push("Endereço deve ter pelo menos 5 caracteres");
    }
    
    const numerosTelefone = telefone.replace(/\D/g, '');
    if (!numerosTelefone || numerosTelefone.length < 10 || numerosTelefone.length > 11) {
        erros.push("Telefone inválido");
    }
    
    return erros;
}

// Função para cadastrar um novo cliente
async function cadastrarCliente(event) {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        mostrarFeedback("Sessão expirada. Faça login novamente.", "erro");
        window.location.href = "/index.html";
        return;
    }

    const nomeCliente = document.getElementById('nomeCliente')?.value.trim() || '';
    const enderecoCliente = document.getElementById('enderecoCliente')?.value.trim() || '';
    const telefoneCliente = document.getElementById('telefoneCliente')?.value.trim() || '';

    // Validação dos campos
    const erros = validarCliente(nomeCliente, enderecoCliente, telefoneCliente);
    if (erros.length > 0) {
        mostrarFeedback(erros.join(", "), "erro");
        return;
    }

    try {
        // Adiciona os dados ao Firestore
        await db.collection('vendedores')
            .doc(user.uid)
            .collection('clientes')
            .add({
                nome: nomeCliente,
                endereco: enderecoCliente,
                telefone: telefoneCliente.replace(/\D/g, ''), // Salva apenas números
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });

        mostrarFeedback("Cliente cadastrado com sucesso!");
        document.getElementById('formCadastroCliente').reset();
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        mostrarFeedback("Erro ao cadastrar cliente. Tente novamente.", "erro");
    }
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            carregarComponentes();
            carregarClientes();
            
            // Configura o formulário
            const formCadastroCliente = document.getElementById('formCadastroCliente');
            if (formCadastroCliente) {
                formCadastroCliente.addEventListener('submit', cadastrarCliente);
            }
        } else {
            window.location.href = "/index.html";
        }
    });
});