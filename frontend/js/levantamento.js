// Importa as instâncias do Firebase
import { auth, db } from './firebaseConfig.js';

// Verifica se o Firebase foi carregado corretamente
console.log('Firebase config carregado:', db, auth);

// Seletores globais
const clienteSelect = document.getElementById('cliente');
const grupoProdutoSelect = document.getElementById('grupoProduto');
const tabelaProdutos = document.getElementById('tabelaProdutos');
const tabelaProdutosLevantados = document.getElementById('tabelaProdutosLevantados');
const searchInput = document.getElementById('searchInput');
const shareButton = document.getElementById('shareButton');
const limparDadosBtn = document.getElementById('limparDados');
const verHistoricoBtn = document.getElementById('verHistorico');

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


// Função para carregar clientes do Firestore
async function carregarClientes() {
    try {
        const querySnapshot = await db.collection('clientes').get();
        clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>'; // Limpa as opções

        querySnapshot.forEach((doc) => {
            const cliente = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // Usa o ID do documento como valor
            option.textContent = cliente.nome; // Exibe o nome do cliente
            clienteSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes: ', error);
    }
}

// Função para carregar grupos do Firestore
async function carregarGrupos() {
    try {
        const querySnapshot = await db.collection('grupos').get();
        grupoProdutoSelect.innerHTML = '<option value="">Todos Produtos</option>'; // Limpa as opções

        querySnapshot.forEach((doc) => {
            const grupo = doc.data();
            const option = document.createElement('option');
            option.value = grupo.nome; // Usa o nome do grupo como valor
            option.textContent = grupo.nome; // Exibe o nome do grupo
            grupoProdutoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar grupos: ', error);
    }
}

// Função para carregar produtos do Firestore
async function carregarProdutos() {
    try {
        const querySnapshot = await db.collection('produtos').get();
        tabelaProdutos.innerHTML = ''; // Limpa a tabela

        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            const row = `
                <tr data-grupo="${produto.grupo}">
                    <td>${produto.nome}</td>
                    <td contenteditable="true">${produto.estoque || 0}</td>
                    <td contenteditable="true">${produto.sugestao || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-success btn-levantar">Levantar</button>
                    </td>
                </tr>
            `;
            tabelaProdutos.innerHTML += row;
        });

        // Adiciona eventos aos botões de "Levantar"
        document.querySelectorAll('.btn-levantar').forEach(btn => {
            btn.addEventListener('click', function () {
                const linha = this.closest('tr');
                moverParaProdutosLevantados(linha);
            });
        });
    } catch (error) {
        console.error('Erro ao carregar produtos: ', error);
    }
}

// Função para mover um produto para a tabela de "Produtos Levantados"
function moverParaProdutosLevantados(linha) {
    const nome = linha.querySelector('td').innerText;
    const estoque = linha.querySelector('td:nth-child(2)').innerText;
    const sugestao = linha.querySelector('td:nth-child(3)').innerText;

    const row = `
        <tr>
            <td>${nome}</td>
            <td>${estoque}</td>
            <td>${sugestao}</td>
        </tr>
    `;
    tabelaProdutosLevantados.innerHTML += row;

    // Remove o produto da tabela principal
    linha.remove();
}

// Função de pesquisa
if (searchInput) {
    searchInput.addEventListener('input', function () {
        const filterValue = this.value.toLowerCase();
        document.querySelectorAll("#tabelaProdutos tr").forEach(linha => {
            const nomeProduto = linha.querySelector("td")?.innerText.toLowerCase();
            linha.style.display = nomeProduto?.includes(filterValue) ? '' : 'none';
        });
    });
}

// Compartilhar no WhatsApp
if (shareButton) {
    shareButton.addEventListener('click', function () {
        let message = 'Segue Levantamento de Estoque e Sugestão de pedido:\n------------------------\n\n';
        document.querySelectorAll("#tabelaProdutosLevantados tr").forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            if (colunas.length < 3) return;

            const nomeProduto = colunas[0].innerText;
            const estoque = colunas[1].innerText.trim();
            const sugestao = colunas[2].innerText.trim();

            if (estoque !== '' && sugestao !== '') {
                message += `Produto: ${nomeProduto}\nEstoque: ${estoque}\nSugestão: ${sugestao}\n\n------------------------\n`;
            }
        });

        if (message === 'Segue Levantamento de Estoque e Sugestão de pedido:\n------------------------\n\n') {
            alert('Falta produto preenchido para compartilhar. Preencha as 2 colunas, Estoque e sugestão, mesmo que seja 0');
            return;
        }

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    });
}

// Botão LIMPAR DADOS
if (limparDadosBtn) {
    limparDadosBtn.addEventListener('click', function () {
        localStorage.removeItem('dadosTabela');
        document.querySelectorAll("#tabelaProdutos tr td:nth-child(2), #tabelaProdutos tr td:nth-child(3)").forEach(td => td.innerText = '');
        tabelaProdutosLevantados.innerHTML = '';
        alert('Dados apagados!');
    });
}

// Botão VER HISTÓRICO
if (verHistoricoBtn) {
    verHistoricoBtn.addEventListener('click', function () {
        alert('Funcionalidade de histórico ainda não implementada.');
    });
}

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
    carregarHeader();
    carregarFooter();
    carregarClientes(); // Carrega os clientes
    carregarGrupos();   // Carrega os grupos
    carregarProdutos(); // Carrega os produtos
});