// Importa as instâncias do Firebase
import { auth, db } from './firebaseConfig.js';

// Função para carregar o cabeçalho
function carregarHeader() {
    fetch('../html/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
        })
        .catch(error => console.error('Erro ao carregar o cabeçalho:', error));
}

// Função para carregar o rodapé
function carregarFooter() {
    fetch('../html/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-container').innerHTML = data;
        })
        .catch(error => console.error('Erro ao carregar o rodapé:', error));
}

// Função para carregar os clientes cadastrados
async function carregarClientes() {
    const tabelaClientes = document.getElementById('tabelaClientes');
    tabelaClientes.innerHTML = '';

    try {
        const querySnapshot = await db.collection('clientes').get();
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
    }
}

// Função para cadastrar um novo cliente
async function cadastrarCliente(event) {
    event.preventDefault();

    const nomeCliente = document.getElementById('nomeCliente').value;
    const enderecoCliente = document.getElementById('enderecoCliente').value;
    const telefoneCliente = document.getElementById('telefoneCliente').value;

    if (!nomeCliente || !enderecoCliente || !telefoneCliente) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        // Adiciona os dados ao Firestore
        await db.collection('clientes').add({
            nome: nomeCliente,
            endereco: enderecoCliente,
            telefone: telefoneCliente
        });
        alert('Cliente cadastrado com sucesso!');
        document.getElementById('formCadastroCliente').reset();
        carregarClientes(); // Atualiza a tabela de clientes
    } catch (error) {
        console.error('Erro ao cadastrar cliente: ', error);
        alert('Erro ao cadastrar cliente. Tente novamente.');
    }
}

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
    carregarHeader();
    carregarFooter();
    carregarClientes(); // Carrega os clientes ao abrir a página

    // Adiciona um evento de submit ao formulário
    const formCadastroCliente = document.getElementById('formCadastroCliente');
    formCadastroCliente.addEventListener('submit', cadastrarCliente);
});