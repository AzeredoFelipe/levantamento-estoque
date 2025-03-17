// Importa as instâncias do Firebase
import { auth } from './firebaseConfig.js';

// Função para realizar o login
function fazerLogin(event) {
    event.preventDefault(); // Evita o recarregamento da página

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    auth.signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            const userId = userCredential.user.uid;
            document.getElementById('mensagem').textContent = "Login realizado com sucesso!";
            console.log("Usuário logado com ID:", userId);

            // Redireciona para a página de levantamento após o login
            window.location.href = "/html/levantamento.html";
        })
        .catch((error) => {
            document.getElementById('mensagem').textContent = "Erro no login: " + error.message;
            console.error("Erro no login:", error);
        });
}

// Adiciona um evento de submit ao formulário de login
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', fazerLogin);
    }
});