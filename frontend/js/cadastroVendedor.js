const firebaseConfig = {
    apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
    authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
    projectId: "levantamentoestoqueweb-d71cb",
    storageBucket: "levantamentoestoqueweb-d71cb.firebasestorage.app",
    messagingSenderId: "743543905338",
    appId: "1:743543905338:web:189cabbd4d9297effea903",
    measurementId: "G-3ETPR2T1PM"
};

// Inicialização segura do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Variáveis de controle
let authStateListener = null;
let isProcessingSignUp = false;
let btnOriginalText = '';

// Função para mostrar feedback
function mostrarFeedback(mensagem, tipo = "sucesso") {
    const feedbackElement = document.getElementById('feedback-mensagem');
    if (feedbackElement) {
        feedbackElement.textContent = mensagem;
        feedbackElement.className = `alert alert-${tipo === 'sucesso' ? 'success' : 'danger'}`;
        feedbackElement.style.display = 'block';
        
        // Oculta após 5 segundos para mensagens de sucesso
        if (tipo === 'sucesso') {
            setTimeout(() => {
                feedbackElement.style.display = 'none';
            }, 5000);
        }
    }
    
    // Log no console
    tipo === 'erro' ? console.error(mensagem) : console.log(mensagem);
}

// Função para validar o formulário
function validarFormulario(email, senha, confirmarSenha) {
    const erros = [];
    
    // Validação de email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erros.push("Email inválido");
    }
    
    // Validação de senha
    if (!senha || senha.length < 6) {
        erros.push("Senha deve ter pelo menos 6 caracteres");
    }
    
    // Validação de confirmação de senha
    if (senha !== confirmarSenha) {
        erros.push("As senhas não coincidem");
    }
    
    return erros;
}

// Função para cadastrar um novo vendedor
async function cadastrarVendedor(event) {
    event.preventDefault();
    isProcessingSignUp = true;

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const confirmarSenha = document.getElementById('confirmarSenha').value.trim();

    // Validações
    const erros = validarFormulario(email, senha, confirmarSenha);
    if (erros.length > 0) {
        mostrarFeedback(erros.join(". "), "erro");
        isProcessingSignUp = false;
        return;
    }

    // Configura estado de carregamento
    const btnSubmit = document.querySelector('#cadastroForm button[type="submit"]');
    btnOriginalText = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Cadastrando...";

    try {
        // Cria o usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const userId = userCredential.user.uid;

        // Cria o documento do vendedor no Firestore
        await db.collection('vendedores').doc(userId).set({
            email: email,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            nivelAcesso: "vendedor"
        });

        mostrarFeedback("Cadastro realizado com sucesso! Redirecionando...", "sucesso");
        
        // Remove a flag de cadastro do localStorage
        localStorage.removeItem('isSignUpFlow');
        
        // Redireciona após breve delay
        setTimeout(() => {
            window.location.href = "/html/levantamento.html";
        }, 2000);
    } catch (error) {
        isProcessingSignUp = false;
        
        // Restaura o botão
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = btnOriginalText;
        }
        
        // Mapeia erros comuns para mensagens amigáveis
        let mensagemErro = "Erro ao cadastrar. Tente novamente.";
        switch(error.code) {
            case 'auth/email-already-in-use':
                mensagemErro = "Este email já está em uso.";
                break;
            case 'auth/invalid-email':
                mensagemErro = "Email inválido.";
                break;
            case 'auth/weak-password':
                mensagemErro = "Senha muito fraca (mínimo 6 caracteres).";
                break;
        }
        
        mostrarFeedback(mensagemErro, "erro");
    }
}

// Configuração inicial da página
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se veio do fluxo de cadastro
    const isSignUpFlow = localStorage.getItem('isSignUpFlow') === 'true';
    
    // Configura o listener de autenticação
    authStateListener = auth.onAuthStateChanged((user) => {
        if (isProcessingSignUp) return;
        
        if (user && !isSignUpFlow) {
            // Redireciona se já estiver logado e não for fluxo de cadastro
            window.location.href = "/html/levantamento.html";
        } else if (!user && !isSignUpFlow) {
            // Redireciona para login se não estiver logado e não for fluxo de cadastro
            window.location.href = "/";
        }
    });
    document.getElementById('btnSair').addEventListener('click', function(e) {
        if(confirm('Deseja realmente sair do cadastro? Os dados não salvos serão perdidos.')) {
            window.location.href = '/index.html';
        } else {
            e.preventDefault();
        }
    });

    // Configura o formulário
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', cadastrarVendedor);
        
        // Validação em tempo real
        cadastroForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                const email = document.getElementById('email').value.trim();
                const senha = document.getElementById('senha').value.trim();
                const confirmarSenha = document.getElementById('confirmarSenha').value.trim();
                const erros = validarFormulario(email, senha, confirmarSenha);
                
                input.classList.toggle('is-invalid', erros.length > 0);
            });
        });
    }
});