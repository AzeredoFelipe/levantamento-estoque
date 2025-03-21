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
  
  // Função para exibir mensagens
  function mostrarMensagem(mensagem, tipo) {
      const mensagemElemento = document.getElementById('mensagem');
      if (mensagemElemento) {
          mensagemElemento.textContent = mensagem;
          mensagemElemento.className = tipo; // 'sucesso' ou 'erro'
      }
  }
  
  // Função para realizar o login
  function fazerLogin(event) {
      event.preventDefault(); // Evita o recarregamento da página
  
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value.trim();
  
      if (!email || !senha) {
          mostrarMensagem("Por favor, preencha todos os campos.", "erro");
          return;
      }
  
      auth.signInWithEmailAndPassword(email, senha)
          .then((userCredential) => {
              const userId = userCredential.user.uid;
              localStorage.setItem('userId', userId); // Armazena o UID no localStorage
              mostrarMensagem("Login realizado com sucesso!", "sucesso");
              window.location.href = "/html/levantamento"; // Redireciona para a página de levantamento
          })
          .catch((error) => {
              mostrarMensagem("Erro no login: " + error.message, "erro");
          });
  }
  
  // Função para realizar o logout
  function fazerLogout() {
      auth.signOut()
          .then(() => {
              localStorage.removeItem('userId'); // Remove o UID do localStorage
              mostrarMensagem("Logout realizado com sucesso!", "sucesso");
              window.location.href = "/"; // Redireciona para a página de login
          })
          .catch((error) => {
              mostrarMensagem("Erro no logout: " + error.message, "erro");
          });
  }
  
  // Verifica o estado de autenticação ao carregar a página
  auth.onAuthStateChanged((user) => {
      const logoutButton = document.getElementById('logoutButton');
      if (logoutButton) { // Verifica se o elemento existe
          if (user) {
              // Usuário está logado, mostra o botão de logout
              logoutButton.style.display = 'block';
          } else {
              // Usuário não está logado, esconde o botão de logout
              logoutButton.style.display = 'none';
          }
      }
  });
  
  // Sincroniza o logout entre abas
  window.addEventListener('storage', (event) => {
      if (event.key === 'userId' && !event.newValue) {
          window.location.href = "/"; // Redireciona para a página de login
      }
  });
  
  // Configurações iniciais ao carregar a página
  document.addEventListener('DOMContentLoaded', function () {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
          loginForm.addEventListener('submit', fazerLogin);
      }
  
      const logoutButton = document.getElementById('logoutButton');
      if (logoutButton) {
          logoutButton.addEventListener('click', fazerLogout);
      }
  });