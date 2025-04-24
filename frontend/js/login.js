const firebaseConfig = {
    apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
    authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
    projectId: "levantamentoestoqueweb-d71cb",
    storageBucket: "levantamentoestoqueweb-d71cb.firebasestorage.app",
    messagingSenderId: "743543905338",
    appId: "1:743543905338:web:189cabbd4d9297effea903",
    measurementId: "G-3ETPR2T1PM"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let authStateListener = null;
let explicitLogin = false;

function showMessage(message, type = 'error') {
    const messageElement = document.getElementById('mensagem');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        messageElement.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 3000);
        }
    }
}

function setupAuthListener() {
    if (authStateListener) {
        authStateListener();
    }
    
    authStateListener = auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('cadastroVendedor')) {
            return;
        }
        
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.style.display = user ? 'block' : 'none';
        }
        
        // Redireciona apenas se:
        // 1. O usuário fez login explicitamente E/OU
        // 2. Está tentando acessar uma página protegida sem autenticação
        if (user && (explicitLogin || !['/', '/index.html'].includes(currentPath))) {
            window.location.href = "/html/levantamento.html";
        } else if (!user && !['/', '/index.html', '/html/cadastroVendedor.html'].includes(currentPath)) {
            window.location.href = "/";
        }
    });
}

function handleLogin(event) {
    event.preventDefault();
    explicitLogin = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value.trim();

    if (!email || !password) {
        showMessage("Por favor, preencha todos os campos.");
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Entrando...";

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            localStorage.setItem('userId', userCredential.user.uid);
            showMessage("Login realizado com sucesso!", "success");
            
            setTimeout(() => {
                window.location.href = "/html/levantamento.html";
            }, 1000);
        })
        .catch((error) => {
            explicitLogin = false;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            
            let errorMessage = "Erro no login";
            switch(error.code) {
                case 'auth/invalid-email':
                    errorMessage = "E-mail inválido";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "Conta desativada";
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "E-mail ou senha incorretos";
                    break;
                default:
                    errorMessage = error.message;
            }
            showMessage(errorMessage);
        });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            localStorage.removeItem('userId');
            sessionStorage.setItem('showLogoutMessage', 'true');
            window.location.href = "/";
        })
        .catch((error) => {
            showMessage("Erro ao sair: " + error.message);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    setupAuthListener();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (sessionStorage.getItem('showLogoutMessage') === 'true') {
        showMessage("Você foi desconectado com sucesso.", "success");
        sessionStorage.removeItem('showLogoutMessage');
    }
});

window.addEventListener('storage', (event) => {
    if (event.key === 'userId' && !event.newValue) {
        window.location.reload();
    }
});