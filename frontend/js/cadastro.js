// Importa as instâncias do Firebase
import { auth, db } from './firebaseConfig.js';

// Verifica se o usuário está autenticado
auth.onAuthStateChanged((user) => {
    if (!user) {
        // Se o usuário não estiver logado, redireciona para a página de login
        window.location.href = '/index.html';
    } else {
        // Usuário está logado, pode continuar
        console.log('Usuário logado:', user);
    }
});


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

// Função para adicionar um produto ao Firestore e à tabela
async function adicionarProduto(event) {
    event.preventDefault();

    const nomeProduto = document.getElementById('nomeProduto').value;
    const grupoProduto = document.getElementById('grupoProduto').value;

    try {
        // Adiciona os dados ao Firestore
        const docRef = await db.collection('produtos').add({
            nome: nomeProduto,
            grupo: grupoProduto
        });
        console.log('Produto cadastrado com ID: ', docRef.id);
        alert('Produto cadastrado com sucesso!');
        document.getElementById('formCadastro').reset();
        carregarProdutos();
    } catch (error) {
        console.error('Erro ao salvar produto: ', error);
        alert('Erro ao cadastrar produto. Tente novamente.');
    }
}

// Função para carregar e exibir os produtos na tabela
async function carregarProdutos() {
    const tabelaBody = document.querySelector('#tabelaProdutos tbody');
    tabelaBody.innerHTML = '';

    try {
        const querySnapshot = await db.collection('produtos').get();
        querySnapshot.forEach((doc) => {
            const produto = doc.data();
            const row = `
                <tr>
                    <td>${produto.nome}</td>
                    <td>${produto.grupo}</td>
                    <td>
                        <button onclick="editarProduto('${doc.id}', '${produto.nome}', '${produto.grupo}')">Editar</button>
                        <button onclick="excluirProduto('${doc.id}')">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaBody.innerHTML += row;
        });
    } catch (error) {
        console.error('Erro ao carregar produtos: ', error);
    }
}

// Função para editar um produto
function editarProduto(id, nome, grupo) {
    // Preenche o formulário com os dados do produto
    document.getElementById('nomeProduto').value = nome;
    document.getElementById('grupoProduto').value = grupo;

    // Altera o botão de "Adicionar Produto" para "Salvar Edição"
    const botao = document.querySelector('#formCadastro button');
    botao.textContent = 'Salvar Edição';

    // Remove o evento de submit atual do formulário
    const formCadastro = document.getElementById('formCadastro');
    formCadastro.removeEventListener('submit', adicionarProduto);

    // Adiciona um novo evento para salvar a edição
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        const nomeProduto = document.getElementById('nomeProduto').value;
        const grupoProduto = document.getElementById('grupoProduto').value;

        try {
            // Atualiza o produto no Firestore
            await db.collection('produtos').doc(id).update({
                nome: nomeProduto,
                grupo: grupoProduto
            });
            alert('Produto atualizado com sucesso!');

            // Limpa o formulário e restaura o botão
            formCadastro.reset();
            botao.textContent = 'Adicionar Produto';

            // Remove o evento de edição e restaura o evento de adição
            formCadastro.removeEventListener('submit', arguments.callee);
            formCadastro.addEventListener('submit', adicionarProduto);

            // Atualiza a tabela
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao atualizar produto: ', error);
            alert('Erro ao atualizar produto. Tente novamente.');
        }
    });
}

// Função para excluir um produto
async function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            // Exclui o produto do Firestore
            await db.collection('produtos').doc(id).delete();
            alert('Produto excluído com sucesso!');
            carregarProdutos(); // Atualiza a tabela
        } catch (error) {
            console.error('Erro ao excluir produto: ', error);
            alert('Erro ao excluir produto. Tente novamente.');
        }
    }
}

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
    carregarHeader();
    carregarFooter();

    // Adiciona um evento de submit ao formulário
    const formCadastro = document.getElementById('formCadastro');
    formCadastro.addEventListener('submit', adicionarProduto);

    // Carrega os produtos ao carregar a página
    carregarProdutos();
});