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

// Inicialização segura do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Sistema de feedback melhorado
function mostrarFeedback(mensagem, tipo = "sucesso") {
    const feedbackElement = document.getElementById('feedback-mensagem') || document.getElementById('mensagem');
    if (feedbackElement) {
        feedbackElement.textContent = mensagem;
        feedbackElement.className = `feedback-${tipo}`;
        feedbackElement.style.display = 'block';
        
        // Oculta após 5 segundos
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }
    
    // Fallback para console
    tipo === 'erro' ? console.error(mensagem) : console.log(mensagem);
}

// Carregar componentes da página
async function carregarComponentes() {
    try {
        await Promise.all([carregarHeader(), carregarFooter()]);
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
        mostrarFeedback("Erro ao carregar componentes da página", "erro");
    }
}

// Função para carregar o cabeçalho
async function carregarHeader() {
    try {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) return;

        const response = await fetch('/html/header.html');
        if (!response.ok) throw new Error('Erro ao carregar cabeçalho');
        
        const html = await response.text();
        headerContainer.innerHTML = html;
    } catch (error) {
        console.error("Erro no carregamento do cabeçalho:", error);
        throw error;
    }
}

// Função para carregar o rodapé
async function carregarFooter() {
    try {
        const footerContainer = document.getElementById('footer-container');
        if (!footerContainer) return;

        const response = await fetch('/html/footer.html');
        if (!response.ok) throw new Error('Erro ao carregar rodapé');
        
        const html = await response.text();
        footerContainer.innerHTML = html;
    } catch (error) {
        console.error("Erro no carregamento do rodapé:", error);
        throw error;
    }
}

// Função para validar o formulário
function validarFormulario(email, senha) {
    const erros = [];
    
    // Validação de email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erros.push("Email inválido");
    }
    
    // Validação de senha
    if (!senha || senha.length < 6) {
        erros.push("Senha deve ter pelo menos 6 caracteres");
    }
    
    return erros;
}

// Função para cadastrar um novo vendedor
async function cadastrarVendedor(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value.trim() || '';
    const senha = document.getElementById('senha')?.value.trim() || '';
    const confirmarSenha = document.getElementById('confirmarSenha')?.value.trim() || '';

    // Validações
    const erros = validarFormulario(email, senha);
    
    if (senha !== confirmarSenha) {
        erros.push("As senhas não coincidem");
    }

    if (erros.length > 0) {
        mostrarFeedback(erros.join(". "), "erro");
        return;
    }

    try {
        // Mostra estado de carregamento
        const btnSubmit = document.querySelector('#cadastroForm button[type="submit"]');
        const btnOriginalText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Cadastrando...";

        // Cria o usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const userId = userCredential.user.uid;

        // Cria o documento do vendedor no Firestore
        await db.collection('vendedores').doc(userId).set({
            email: email,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            ultimoAcesso: firebase.firestore.FieldValue.serverTimestamp(),
            nivelAcesso: "vendedor" // Padrão de nível de acesso
        });

        mostrarFeedback("Cadastro realizado com sucesso! Redirecionando...");
        
        // Redireciona após breve delay
        setTimeout(() => {
            window.location.href = "/";
        }, 2000);
    } catch (error) {
        console.error("Erro no cadastro:", error);
        
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
        
        // Restaura o botão
        const btnSubmit = document.querySelector('#cadastroForm button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = btnOriginalText;
        }
    }
}

// Configuração inicial da página
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se já está autenticado (impede acesso à página de cadastro se logado)
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = "/html/levantamento.html";
        } else {
            carregarComponentes();
            
            // Configura o formulário
            const cadastroForm = document.getElementById('cadastroForm');
            if (cadastroForm) {
                cadastroForm.addEventListener('submit', cadastrarVendedor);
                
                // Adiciona validação em tempo real
                cadastroForm.querySelectorAll('input').forEach(input => {
                    input.addEventListener('input', () => {
                        const email = document.getElementById('email')?.value.trim() || '';
                        const senha = document.getElementById('senha')?.value.trim() || '';
                        const erros = validarFormulario(email, senha);
                        
                        if (erros.length > 0) {
                            input.classList.add('input-invalido');
                        } else {
                            input.classList.remove('input-invalido');
                        }
                    });
                });
            }
        }
    });
});