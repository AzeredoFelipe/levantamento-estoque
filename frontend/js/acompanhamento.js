// Configuração do Firebase (adicionada no início do arquivo)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicialização do Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Verificação de autenticação melhorada
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
      window.location.href = "/index.html";
      return;
  }
  
  // Carrega os componentes e cálculos após autenticação
  carregarComponentes();
  inicializarCalculos();
});

// Função para carregar componentes
function carregarComponentes() {
  carregarHeader();
  carregarFooter();
}

// Função para carregar o cabeçalho (com tratamento de erro melhorado)
async function carregarHeader() {
  try {
      const response = await fetch('../html/header.html');
      if (!response.ok) throw new Error('Falha ao carregar cabeçalho');
      const data = await response.text();
      document.getElementById('header-container').innerHTML = data;
  } catch (error) {
      console.error('Erro ao carregar cabeçalho:', error);
      // Pode adicionar um fallback UI aqui
  }
}

// Função para carregar o rodapé (com tratamento de erro melhorado)
async function carregarFooter() {
  try {
      const response = await fetch('../html/footer.html');
      if (!response.ok) throw new Error('Falha ao carregar rodapé');
      const data = await response.text();
      document.getElementById('footer-container').innerHTML = data;
  } catch (error) {
      console.error('Erro ao carregar rodapé:', error);
  }
}

// Lista de feriados (agora como constante fora do escopo global)
const FERIADOS = new Set([
  "2024-12-25", "2024-12-31", "2025-01-01",
  "2025-04-21", "2025-05-01", "2025-09-07",
  "2025-10-12", "2025-11-02", "2025-11-15",
  "2025-12-25", "2025-07-09", "2025-11-20"
]);

// Função para verificar feriados (mais eficiente)
function ehFeriado(data) {
  return FERIADOS.has(data.toISOString().split("T")[0]);
}

// Função para calcular dias úteis (com validação adicional)
function calcularDiasUteis() {
  try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      let diasUteis = 0;
      let diasTrabalhados = 0;
      const hojeSemHora = new Date(hoje.setHours(0, 0, 0, 0));

      for (let dia = new Date(inicioMes); dia <= fimMes; dia.setDate(dia.getDate() + 1)) {
          const diaSemana = dia.getDay();
          if (diaSemana !== 0 && diaSemana !== 6 && !ehFeriado(dia)) {
              diasUteis++;
              if (dia < hojeSemHora) {
                  diasTrabalhados++;
              }
          }
      }

      document.getElementById("diasUteis").value = diasUteis;
      document.getElementById("diasTrabalhados").value = diasTrabalhados;
      document.getElementById("diasFaltantes").value = diasUteis - diasTrabalhados;
  } catch (error) {
      console.error("Erro ao calcular dias úteis:", error);
  }
}

// Funções de cálculo (com validação de entrada)
function atualizarCamposDias() {
  const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) || 0 : 0;
  };

  const diasUteis = getValue("diasUteis");
  const diasTrabalhados = getValue("diasTrabalhados");
  const diasFaltantes = getValue("diasFaltantes");

  if (!diasUteis && !diasTrabalhados && !diasFaltantes) return;

  // Lógica de cálculo mais segura
  if (diasUteis && diasTrabalhados) {
      document.getElementById("diasFaltantes").value = diasUteis - diasTrabalhados;
  } else if (diasUteis && diasFaltantes) {
      document.getElementById("diasTrabalhados").value = diasUteis - diasFaltantes;
  } else if (diasTrabalhados && diasFaltantes) {
      document.getElementById("diasUteis").value = diasTrabalhados + diasFaltantes;
  }
}

function calcularMixFaltante() {
  const mixBase = document.getElementById("mix25").checked ? 25 : 30;
  const mixMedio = parseFloat(document.getElementById("mixMedio").value) || 0;
  const diasUteis = parseFloat(document.getElementById("diasUteis").value) || 0;
  const diasTrabalhados = parseFloat(document.getElementById("diasTrabalhados").value) || 0;
  const diasFaltantes = parseFloat(document.getElementById("diasFaltantes").value) || 0;

  if (mixMedio && diasFaltantes > 0) {
      const mixFaltante = ((diasUteis * mixBase) - (diasTrabalhados * mixMedio)) / diasFaltantes;
      document.getElementById("mixFaltante").value = mixFaltante.toFixed(2);
  } else {
      document.getElementById("mixFaltante").value = "";
  }
}

// Inicialização dos cálculos (com delegação de eventos)
function inicializarCalculos() {
  calcularDiasUteis();
  
  const campos = ["diasUteis", "diasTrabalhados", "diasFaltantes", "mixMedio"];
  campos.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
          element.addEventListener("input", () => {
              atualizarCamposDias();
              calcularMixFaltante();
          });
      }
  });

  document.getElementById("mix25")?.addEventListener("change", calcularMixFaltante);
  document.getElementById("mix30")?.addEventListener("change", calcularMixFaltante);
}

// Carregamento inicial seguro
document.addEventListener('DOMContentLoaded', () => {
  if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  }
});