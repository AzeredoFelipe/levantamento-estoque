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

// Função para exibir/ocultar o campo de novo grupo
function toggleCampoNovoGrupo() {
    const campoNovoGrupo = document.getElementById('campoNovoGrupo');
    campoNovoGrupo.style.display = campoNovoGrupo.style.display === 'none' ? 'block' : 'none';
}

// Função para ocultar/mostrar o ícone de "+"
function toggleIconeAdicionarGrupo(mostrar) {
    const btnAdicionarGrupo = document.getElementById('btnAdicionarGrupo');
    if (btnAdicionarGrupo) {
        btnAdicionarGrupo.style.display = mostrar ? 'block' : 'none';
    }
}

// Função para adicionar um novo grupo
async function adicionarGrupo() {
    const novoGrupo = document.getElementById('novoGrupo').value.trim();

    if (!novoGrupo) {
        alert('Por favor, insira o nome do grupo.');
        return;
    }

    try {
        // Verifica se o grupo já existe
        const gruposRef = db.collection('grupos');
        const querySnapshot = await gruposRef.where('nome', '==', novoGrupo).get();

        if (!querySnapshot.empty) {
            alert('Este grupo já existe!');
            return;
        }

        // Adiciona o novo grupo ao Firestore
        await gruposRef.add({ nome: novoGrupo });
        alert('Grupo adicionado com sucesso!');
        document.getElementById('novoGrupo').value = ''; // Limpa o campo
        carregarGrupos(); // Atualiza a lista de grupos no select
        toggleCampoNovoGrupo(); // Oculta o campo de novo grupo após salvar
    } catch (error) {
        console.error('Erro ao adicionar grupo: ', error);
        alert('Erro ao adicionar grupo. Tente novamente.');
    }
}

// Função para carregar os grupos no select
async function carregarGrupos() {
    const grupoSelect = document.getElementById('grupoProduto');
    grupoSelect.innerHTML = '<option value="">Selecione um grupo</option>'; // Limpa as opções

    try {
        const querySnapshot = await db.collection('grupos').get();
        querySnapshot.forEach((doc) => {
            const grupo = doc.data().nome;
            const option = document.createElement('option');
            option.value = grupo;
            option.textContent = grupo;
            grupoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar grupos: ', error);
    }
}

// Função para adicionar um produto ao Firestore e à tabela
async function adicionarProduto(event) {
    event.preventDefault();

    const nomeProduto = document.getElementById('nomeProduto').value;
    const grupoProduto = document.getElementById('grupoProduto').value;

    if (!nomeProduto || !grupoProduto) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

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
                        <button class="btn-editar" data-id="${doc.id}" data-nome="${produto.nome}" data-grupo="${produto.grupo}">Editar</button>
                        <button class="btn-excluir" data-id="${doc.id}">Excluir</button>
                    </td>
                </tr>
            `;
            tabelaBody.innerHTML += row;
        });

        // Adiciona os eventos após carregar os produtos
        adicionarEventos();
    } catch (error) {
        console.error('Erro ao carregar produtos: ', error);
    }
}

// Função para adicionar eventos de edição e exclusão
function adicionarEventos() {
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const nome = btn.getAttribute('data-nome');
            const grupo = btn.getAttribute('data-grupo');
            editarProduto(id, nome, grupo);
        });
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            excluirProduto(id);
        });
    });
}

// Função para editar um produto
function editarProduto(id, nome, grupo) {
    // Oculta o campo de novo grupo e o ícone de "+"
    document.getElementById('campoNovoGrupo').style.display = 'none';
    toggleIconeAdicionarGrupo(false); // Oculta o ícone de "+"

    // Mostra o botão de cancelar
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    if (btnCancelarEdicao) {
        btnCancelarEdicao.style.display = 'inline-block';
    }

    // Preenche o formulário com os dados do produto
    document.getElementById('nomeProduto').value = nome;
    document.getElementById('grupoProduto').value = grupo;

    // Altera o botão de "Adicionar Produto" para "Salvar Edição"
    const botao = document.querySelector('#formCadastro button[type="submit"]');
    botao.textContent = 'Salvar Edição';

    // Remove o evento de submit atual do formulário
    const formCadastro = document.getElementById('formCadastro');
    formCadastro.removeEventListener('submit', adicionarProduto);

    // Função para salvar a edição
    const salvarEdicao = async (e) => {
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
            formCadastro.removeEventListener('submit', salvarEdicao);
            formCadastro.addEventListener('submit', adicionarProduto);

            // Restaura o ícone de "+"
            toggleIconeAdicionarGrupo(true);

            // Oculta o botão de cancelar
            if (btnCancelarEdicao) {
                btnCancelarEdicao.style.display = 'none';
            }

            // Atualiza a tabela
            carregarProdutos();
        } catch (error) {
            console.error('Erro ao atualizar produto: ', error);
            alert('Erro ao atualizar produto. Tente novamente.');
        }
    };

    // Adiciona o evento de salvar edição
    formCadastro.addEventListener('submit', salvarEdicao);
}

// Função para cancelar a edição
function cancelarEdicao() {
    const formCadastro = document.getElementById('formCadastro');
    formCadastro.reset(); // Limpa o formulário

    const botao = document.querySelector('#formCadastro button[type="submit"]');
    botao.textContent = 'Adicionar Produto'; // Restaura o botão

    // Remove o evento de edição e restaura o evento de adição
    formCadastro.removeEventListener('submit', salvarEdicao);
    formCadastro.addEventListener('submit', adicionarProduto);

    // Restaura o ícone de "+"
    toggleIconeAdicionarGrupo(true);

    // Oculta o botão de cancelar
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    if (btnCancelarEdicao) {
        btnCancelarEdicao.style.display = 'none';
    }
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
    carregarGrupos(); // Carrega os grupos ao abrir a página

    // Adiciona um evento de submit ao formulário
    const formCadastro = document.getElementById('formCadastro');
    formCadastro.addEventListener('submit', adicionarProduto);

    // Adiciona um evento ao botão de "+" para exibir/ocultar o campo de novo grupo
    const btnAdicionarGrupo = document.getElementById('btnAdicionarGrupo');
    if (btnAdicionarGrupo) {
        btnAdicionarGrupo.addEventListener('click', toggleCampoNovoGrupo);
    }

    // Adiciona um evento ao botão de "Salvar" para adicionar o novo grupo
    const btnSalvarGrupo = document.getElementById('btnSalvarGrupo');
    if (btnSalvarGrupo) {
        btnSalvarGrupo.addEventListener('click', adicionarGrupo);
    }

    // Adiciona um evento ao botão de "Cancelar"
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
    if (btnCancelarEdicao) {
        btnCancelarEdicao.addEventListener('click', cancelarEdicao);
    }

    // Carrega os produtos ao carregar a página
    carregarProdutos();
});