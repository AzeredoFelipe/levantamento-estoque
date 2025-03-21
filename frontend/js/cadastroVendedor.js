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

            // Cria um documento na coleção `vendedores` com o UID como ID
            db.collection('vendedores').doc(userId).set({
                email: email,
                clientes: [], // Array de clientes (pode ser preenchido posteriormente)
                produtos: []  // Array de produtos (pode ser preenchido posteriormente)
            })
            .then(() => {
                document.getElementById('mensagem').textContent = "Cadastro realizado com sucesso!";
                console.log("Usuário cadastrado com ID:", userId);
                window.location.href = "/"; // Redireciona para a página de login
            })
            .catch((error) => {
                document.getElementById('mensagem').textContent = "Erro ao criar documento: " + error.message;
                console.error("Erro ao criar documento:", error);
            });
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