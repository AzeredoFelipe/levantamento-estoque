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

// Controle de estado
let authStateListener = null;
let explicitLogin = false;

// Função para mostrar mensagens formatadas
function showMessage(message, type = 'error') {
    const messageElement = document.getElementById('mensagem');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        messageElement.style.display = 'block';
        
        // Oculta mensagens de sucesso após 3 segundos
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 3000);
        }
    }
}

// Configura o listener de autenticação
function setupAuthListener() {
    // Remove listener anterior se existir
    if (authStateListener) {
        authStateListener();
    }
    
    authStateListener = auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname;
        
        // Não faz nada nas páginas de cadastro
        if (currentPath.includes('cadastroVendedor')) {
            return;
        }
        
        // Atualiza visibilidade do botão de logout
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

// Função de login
function handleLogin(event) {
    event.preventDefault();
    explicitLogin = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value.trim();

    // Validação básica
    if (!email || !password) {
        showMessage("Por favor, preencha todos os campos.");
        return;
    }

    // Mostra estado de carregamento
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Entrando...";

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Armazena apenas o necessário
            localStorage.setItem('userId', userCredential.user.uid);
            showMessage("Login realizado com sucesso!", "success");
            
            // Redireciona após breve delay para visualização da mensagem
            setTimeout(() => {
                window.location.href = "/html/levantamento.html";
            }, 1000);
        })
        .catch((error) => {
            explicitLogin = false;
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            
            // Tratamento de erros específicos
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

// Função de logout
function handleLogout() {
    auth.signOut()
        .then(() => {
            localStorage.removeItem('userId');
            // Usa sessionStorage para mensagem pós-logout
            sessionStorage.setItem('showLogoutMessage', 'true');
            window.location.href = "/";
        })
        .catch((error) => {
            showMessage("Erro ao sair: " + error.message);
        });
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    setupAuthListener();
    
    // Configura formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Configura botão de logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Mostra mensagem de logout se necessário
    if (sessionStorage.getItem('showLogoutMessage') === 'true') {
        showMessage("Você foi desconectado com sucesso.", "success");
        sessionStorage.removeItem('showLogoutMessage');
    }
});

// Sincronização entre abas
window.addEventListener('storage', (event) => {
    if (event.key === 'userId' && !event.newValue) {
        window.location.reload();
    }
});