// Importa as instâncias do Firebase
import { auth } from './firebaseConfig.js';

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

// Função para cadastrar um novo vendedor
function cadastrarVendedor(event) {
    event.preventDefault(); // Evita o recarregamento da página

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    auth.createUserWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            const userId = userCredential.user.uid;
            document.getElementById('mensagem').textContent = "Cadastro realizado com sucesso!";
            console.log("Usuário cadastrado com ID:", userId);
        })
        .catch((error) => {
            document.getElementById('mensagem').textContent = "Erro no cadastro: " + error.message;
            console.error("Erro no cadastro:", error);
        });
}

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
    carregarHeader();
    carregarFooter();

    // Adiciona um evento de submit ao formulário de cadastro de vendedores
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', cadastrarVendedor);
    }
});