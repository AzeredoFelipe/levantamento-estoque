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

// Listener para verificar o estado de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário está autenticado, pode acessar user.uid
        const uid = user.uid;
        console.log("Usuário autenticado, UID:", uid);

        // Chame as funções que dependem do UID aqui
        carregarGrupos(uid);
        carregarProdutos(uid);

        // Configura os eventos após o carregamento da página
        configurarEventos();
    } else {
        // Usuário não está autenticado
        console.log("Usuário não autenticado");
        // Redirecione para a página de login ou mostre uma mensagem de erro
        window.location.href = "/"; // Redireciona para a página inicial
    }
});

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

    const userId = auth.currentUser.uid; // ID do vendedor logado
    const gruposRef = db.collection('vendedores').doc(userId).collection('grupos');

    try {
        // Verifica se o grupo já existe
        const querySnapshot = await gruposRef.where('nome', '==', novoGrupo).get();

        if (!querySnapshot.empty) {
            alert('Este grupo já existe!');
            return;
        }

        // Adiciona o novo grupo ao Firestore
        await gruposRef.add({ nome: novoGrupo });
        alert('Grupo adicionado com sucesso!');
        document.getElementById('novoGrupo').value = ''; // Limpa o campo
        carregarGrupos(userId); // Atualiza a lista de grupos no select
        toggleCampoNovoGrupo(); // Oculta o campo de novo grupo após salvar
    } catch (error) {
        console.error('Erro ao adicionar grupo: ', error);
        alert('Erro ao adicionar grupo. Tente novamente.');
    }
}

// Função para carregar os grupos no select
async function carregarGrupos(userId) {
    const grupoSelect = document.getElementById('grupoProduto');
    grupoSelect.innerHTML = '<option value="">Selecione um grupo</option>'; // Limpa as opções

    try {
        const gruposRef = db.collection('vendedores').doc(userId).collection('grupos');
        const querySnapshot = await gruposRef.get();
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

    const userId = auth.currentUser.uid; // ID do vendedor logado
    const produtosRef = db.collection('vendedores').doc(userId).collection('produtos');

    try {
        // Adiciona os dados ao Firestore
        await produtosRef.add({
            nome: nomeProduto,
            grupo: grupoProduto
        });
        alert('Produto cadastrado com sucesso!');
        document.getElementById('formCadastro').reset();
        carregarProdutos(userId); // Atualiza a lista de produtos
    } catch (error) {
        console.error('Erro ao salvar produto: ', error);
        alert('Erro ao cadastrar produto. Tente novamente.');
    }
}

// Função para carregar e exibir os produtos na tabela
async function carregarProdutos(userId) {
    const tabelaBody = document.querySelector('#tabelaProdutos tbody');
    tabelaBody.innerHTML = '';

    try {
        const produtosRef = db.collection('vendedores').doc(userId).collection('produtos');
        const querySnapshot = await produtosRef.get();
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
    const userId = auth.currentUser.uid; // ID do vendedor logado
    const produtosRef = db.collection('vendedores').doc(userId).collection('produtos');

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
            await produtosRef.doc(id).update({
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
            carregarProdutos(userId);
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
    const userId = auth.currentUser.uid; // ID do vendedor logado
    const produtosRef = db.collection('vendedores').doc(userId).collection('produtos');

    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            await produtosRef.doc(id).delete();
            alert('Produto excluído com sucesso!');
            carregarProdutos(userId); // Atualiza a tabela
        } catch (error) {
            console.error('Erro ao excluir produto: ', error);
            alert('Erro ao excluir produto. Tente novamente.');
        }
    }
}

// Função para configurar os eventos após o carregamento da página
function configurarEventos() {
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
}

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
    carregarHeader();
    carregarFooter();
});