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

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Função para exibir mensagens
function mostrarMensagem(mensagem, tipo) {
    const mensagemElemento = document.getElementById('mensagem');
    if (mensagemElemento) {
        mensagemElemento.textContent = mensagem;
        mensagemElemento.className = tipo; // 'sucesso' ou 'erro'
    }
}

// Função para carregar o cabeçalho
async function carregarHeader() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const response = await fetch('/html/header.html'); // Busca o arquivo header.html
            const html = await response.text();
            headerContainer.innerHTML = html;
        } catch (error) {
            console.error("Erro ao carregar o cabeçalho:", error);
        }
    }
}

// Função para carregar o rodapé
async function carregarFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        try {
            const response = await fetch('/html/footer.html'); // Busca o arquivo footer.html
            const html = await response.text();
            footerContainer.innerHTML = html;
        } catch (error) {
            console.error("Erro ao carregar o rodapé:", error);
        }
    }
}

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
    carregarHeader();
    carregarFooter();
    carregarClientes(); // Carrega os clientes ao abrir a página

    // Adiciona um evento de submit ao formulário
    const formCadastroCliente = document.getElementById('formCadastroCliente');
    if (formCadastroCliente) {
        formCadastroCliente.addEventListener('submit', cadastrarCliente);
    }
});

// Função para carregar os clientes cadastrados
async function carregarClientes() {
    const userId = localStorage.getItem('userId'); // Recupera o UID do localStorage
    if (!userId) {
        mostrarMensagem("Usuário não autenticado.", "erro");
        window.location.href = "/index.html"; // Redireciona para a página de login
        return;
    }

    const tabelaClientes = document.getElementById('tabelaClientes');
    if (!tabelaClientes) return; // Verifica se a tabela existe

    tabelaClientes.innerHTML = ''; // Limpa a tabela antes de carregar os dados

    try {
        // Recupera os clientes do vendedor logado
        const querySnapshot = await db.collection('vendedores').doc(userId).collection('clientes').get();
        querySnapshot.forEach((doc) => {
            const cliente = doc.data();
            const row = `
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.endereco}</td>
                    <td>${cliente.telefone}</td>
                </tr>
            `;
            tabelaClientes.innerHTML += row;
        });
    } catch (error) {
        console.error('Erro ao carregar clientes: ', error);
        mostrarMensagem("Erro ao carregar clientes.", "erro");
    }
}

// Função para cadastrar um novo cliente
async function cadastrarCliente(event) {
    event.preventDefault();

    const userId = localStorage.getItem('userId'); // Recupera o UID do localStorage
    if (!userId) {
        mostrarMensagem("Usuário não autenticado.", "erro");
        return;
    }

    const nomeCliente = document.getElementById('nomeCliente').value.trim();
    const enderecoCliente = document.getElementById('enderecoCliente').value.trim();
    const telefoneCliente = document.getElementById('telefoneCliente').value.trim();

    if (!nomeCliente || !enderecoCliente || !telefoneCliente) {
        mostrarMensagem("Por favor, preencha todos os campos.", "erro");
        return;
    }

    try {
        // Adiciona os dados ao Firestore, dentro da coleção do vendedor logado
        await db.collection('vendedores').doc(userId).collection('clientes').add({
            nome: nomeCliente,
            endereco: enderecoCliente,
            telefone: telefoneCliente
        });
        mostrarMensagem("Cliente cadastrado com sucesso!", "sucesso");
        document.getElementById('formCadastroCliente').reset(); // Limpa o formulário
        carregarClientes(); // Atualiza a tabela de clientes
    } catch (error) {
        console.error('Erro ao cadastrar cliente: ', error);
        mostrarMensagem("Erro ao cadastrar cliente. Tente novamente.", "erro");
    }
}