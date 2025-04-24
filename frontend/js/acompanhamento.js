const firebaseConfig = {
  apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
  authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
  projectId: "levantamentoestoqueweb-d71cb",
  storageBucket: "levantamentoestoqueweb-d71cb.firebasestorage.app",
  messagingSenderId: "743543905338",
  appId: "1:743543905338:web:189cabbd4d9297effea903",
  measurementId: "G-3ETPR2T1PM"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
function mostrarFeedback(mensagem, tipo = "sucesso") {
  const feedbackElement = document.getElementById('feedback-mensagem') || document.getElementById('mensagem');
  if (feedbackElement) {
      feedbackElement.textContent = mensagem;
      feedbackElement.className = `alert alert-${tipo === 'sucesso' ? 'success' : 'danger'}`;
      feedbackElement.style.display = 'block';
      
      setTimeout(() => {
          feedbackElement.style.display = 'none';
      }, 5000);
  }
  
  tipo === 'erro' ? console.error(mensagem) : console.log(mensagem);
}

// Lista de feriados
const FERIADOS = new Set([
  "2024-12-25", "2024-12-31", "2025-01-01",
  "2025-04-21", "2025-05-01", "2025-09-07",
  "2025-10-12", "2025-11-02", "2025-11-15",
  "2025-12-25", "2025-07-09", "2025-11-20"
]);

const elements = {
  diasUteis: document.getElementById("diasUteis"),
  diasTrabalhados: document.getElementById("diasTrabalhados"),
  diasFaltantes: document.getElementById("diasFaltantes"),
  mixMedio: document.getElementById("mixMedio"),
  mixFaltante: document.getElementById("mixFaltante"),
  mix25: document.getElementById("mix25"),
  mix30: document.getElementById("mix30")
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase === 'undefined') {
      mostrarFeedback("Erro: Biblioteca Firebase não carregada", "erro");
      return;
  }
  
  auth.onAuthStateChanged((user) => {
      if (user) {
          carregarComponentes();
          inicializarCalculos();
      } else {
          window.location.href = "/index.html";
      }
  });
});

async function carregarComponentes() {
  try {
      await Promise.all([
          carregarHeader(),
          carregarFooter()
      ]);
  } catch (error) {
      console.error("Erro ao carregar componentes:", error);
      mostrarFeedback("Erro ao carregar componentes da página", "erro");
  }
}
async function carregarHeader() {
  try {
      const headerContainer = document.getElementById('header-container');
      if (!headerContainer) return;

      const response = await fetch('../html/header.html');
      if (!response.ok) throw new Error('Erro ao carregar cabeçalho');
      
      headerContainer.innerHTML = await response.text();
  } catch (error) {
      console.error("Erro no carregamento do cabeçalho:", error);
      throw error;
  }
}
async function carregarFooter() {
  try {
      const footerContainer = document.getElementById('footer-container');
      if (!footerContainer) return;

      const response = await fetch('../html/footer.html');
      if (!response.ok) throw new Error('Erro ao carregar rodapé');
      
      footerContainer.innerHTML = await response.text();
  } catch (error) {
      console.error("Erro no carregamento do rodapé:", error);
      throw error;
  }
}
function ehFeriado(data) {
  return FERIADOS.has(data.toISOString().split("T")[0]);
}

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

      if (elements.diasUteis) elements.diasUteis.value = diasUteis;
      if (elements.diasTrabalhados) elements.diasTrabalhados.value = diasTrabalhados;
      if (elements.diasFaltantes) elements.diasFaltantes.value = diasUteis - diasTrabalhados;
  } catch (error) {
      console.error("Erro ao calcular dias úteis:", error);
      mostrarFeedback("Erro ao calcular dias úteis", "erro");
  }
}

function atualizarCamposDias() {
  try {
      const getValue = (id) => {
          const el = document.getElementById(id);
          return el ? parseFloat(el.value) || 0 : 0;
      };

      const diasUteis = getValue("diasUteis");
      const diasTrabalhados = getValue("diasTrabalhados");
      const diasFaltantes = getValue("diasFaltantes");

      if (!diasUteis && !diasTrabalhados && !diasFaltantes) return;

      if (diasUteis && diasTrabalhados) {
          if (elements.diasFaltantes) elements.diasFaltantes.value = diasUteis - diasTrabalhados;
      } else if (diasUteis && diasFaltantes) {
          if (elements.diasTrabalhados) elements.diasTrabalhados.value = diasUteis - diasFaltantes;
      } else if (diasTrabalhados && diasFaltantes) {
          if (elements.diasUteis) elements.diasUteis.value = diasTrabalhados + diasFaltantes;
      }
  } catch (error) {
      console.error("Erro ao atualizar campos de dias:", error);
  }
}

function calcularMixFaltante() {
  try {
      const mixBase = elements.mix25?.checked ? 25 : 30;
      const mixMedio = parseFloat(elements.mixMedio?.value) || 0;
      const diasUteis = parseFloat(elements.diasUteis?.value) || 0;
      const diasTrabalhados = parseFloat(elements.diasTrabalhados?.value) || 0;
      const diasFaltantes = parseFloat(elements.diasFaltantes?.value) || 0;

      if (mixMedio && diasFaltantes > 0) {
          const mixFaltante = ((diasUteis * mixBase) - (diasTrabalhados * mixMedio)) / diasFaltantes;
          if (elements.mixFaltante) elements.mixFaltante.value = mixFaltante.toFixed(2);
      } else if (elements.mixFaltante) {
          elements.mixFaltante.value = "";
      }
  } catch (error) {
      console.error("Erro ao calcular mix faltante:", error);
  }
}
function inicializarCalculos() {
  try {
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

      elements.mix25?.addEventListener("change", calcularMixFaltante);
      elements.mix30?.addEventListener("change", calcularMixFaltante);
  } catch (error) {
      console.error("Erro ao inicializar cálculos:", error);
      mostrarFeedback("Erro ao inicializar cálculos", "erro");
  }
}