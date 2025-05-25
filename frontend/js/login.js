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

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Erro ao configurar persistência:", error);
    });

let authStateListener = null;
let explicitLogin = false;
let ignoreNextAuthStateChange = false;

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
        
        if (ignoreNextAuthStateChange) {
            ignoreNextAuthStateChange = false;
            return;
        }
        
        if (currentPath.includes('cadastroVendedor')) {
            return;
        }
        
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.style.display = user ? 'block' : 'none';
        }
        
        if (user && !explicitLogin && !['/', '/index.html'].includes(currentPath)) {
            window.location.href = "/html/levantamento.html";
        }
    });
}

function setupAutocompleteHandlers() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha');
    
    if (emailInput && passwordInput) {
        emailInput.addEventListener('focus', () => {
            ignoreNextAuthStateChange = true;
        });
        
        passwordInput.addEventListener('focus', () => {
            ignoreNextAuthStateChange = true;
        });
        
        // Impede o autopreenchimento imediato
        setTimeout(() => {
            emailInput.value = '';
            passwordInput.value = '';
        }, 100);
    }
}

function handleLogin(event) {
    event.preventDefault();
    explicitLogin = true;
    ignoreNextAuthStateChange = false;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value.trim();

    if (!email || !password) {
        showMessage("Por favor, preencha todos os campos.");
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject({ 
            code: 'auth/timeout', 
            message: "Tempo excedido. Verifique sua conexão." 
        }), 15000);
    });

    Promise.race([
        auth.signInWithEmailAndPassword(email, password),
        timeoutPromise
    ])
    .then((userCredential) => {
        localStorage.setItem('userId', userCredential.user.uid);
        showMessage("Login realizado com sucesso!", "success");
        
        window.location.href = "/html/levantamento.html";
        
        db.collection('vendedores').doc(userCredential.user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    localStorage.setItem('userData', JSON.stringify(doc.data()));
                }
            })
            .catch((firestoreError) => {
                console.error("Erro no Firestore (não crítico):", firestoreError);
            });
    })
    .catch((error) => {
        explicitLogin = false;
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        
        let errorMessage = "Erro no login. Tente novamente.";
        switch(error.code) {
            case 'auth/invalid-email':
                errorMessage = "Formato de e-mail inválido";
                break;
            case 'auth/user-disabled':
                errorMessage = "Esta conta foi desativada";
                break;
            case 'auth/user-not-found':
                errorMessage = "E-mail não cadastrado";
                break;
            case 'auth/wrong-password':
                errorMessage = "Senha incorreta";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Muitas tentativas. Tente mais tarde.";
                break;
            case 'auth/timeout':
                errorMessage = "Tempo excedido. Verifique sua conexão.";
                break;
            case 'auth/network-request-failed':
                errorMessage = "Sem conexão com a internet";
                break;
            default:
                console.error("Erro completo:", error);
                errorMessage = "Erro ao fazer login. Tente novamente mais tarde.";
        }
        showMessage(errorMessage);
    });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            localStorage.removeItem('userId');
            localStorage.removeItem('userData');
            sessionStorage.setItem('showLogoutMessage', 'true');
            window.location.href = "/";
        })
        .catch((error) => {
            showMessage("Erro ao sair: " + error.message);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    if (!firebase.apps.length) {
        showMessage("Erro na inicialização do sistema. Recarregue a página.", "error");
        console.error("Firebase não inicializado");
        return;
    }

    setupAuthListener();
    setupAutocompleteHandlers();
    
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

    // Solução adicional para Chrome Android
    setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="password"]');
        inputs.forEach(input => {
            input.type = 'text';
            setTimeout(() => {
                input.type = 'password';
            }, 100);
        });
    }, 500);
});

window.addEventListener('storage', (event) => {
    if (event.key === 'userId' && !event.newValue) {
        window.location.reload();
    }
});