// Importa as instâncias do Firebase
import { auth } from './firebaseConfig.js';

// Função para fazer login
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Autenticação com Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido
            const user = userCredential.user;
            console.log('Usuário logado:', user);

            // Redireciona para a página principal
            window.location.href = '/html/acompanhamento.html';
        })
        .catch((error) => {
            // Trata erros de login
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Erro no login:', errorMessage);
            alert('Erro no login: ' + errorMessage);
        });
});

// Verifica o estado de autenticação ao carregar a página
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário já está logado, redireciona para a página principal
        window.location.href = '/html/acompanhamento.html';
    } else {
        // Usuário não está logado, mantém na página de login
        console.log('Usuário não autenticado');
    }
});