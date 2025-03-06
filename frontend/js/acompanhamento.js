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

// Carregar o cabeçalho e o rodapé quando a página for carregada
document.addEventListener('DOMContentLoaded', function () {
  carregarHeader();
  carregarFooter();
});

// Lista de feriados no formato AAAA-MM-DD
const feriados = [
  "2024-12-25", // Natal de 2024
  "2024-12-31", // Folga
  "2025-01-01", // Ano Novo 2025
  "2025-04-21", // Tiradentes 2025
  "2025-05-01", // Dia do Trabalhador 2025
  "2025-09-07", // Independência do Brasil 2025
  "2025-10-12", // Nossa Senhora Aparecida 2025
  "2025-11-02", // Finados 2025
  "2025-11-15", // Proclamação da República 2025
  "2025-12-25", // Natal de 2025
  "2025-07-09", // Revolução Constitucionalista 2025
  "2025-11-20", // Consciência Negra 2025
];

// Função para calcular se uma data é feriado
function ehFeriado(data) {
  const dataFormatada = data.toISOString().split("T")[0];
  return feriados.includes(dataFormatada);
}

// Função para calcular dias úteis do mês atual
function calcularDiasUteis() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  let diasUteis = 0;
  let diasTrabalhados = 0;

  for (let dia = new Date(inicioMes); dia <= fimMes; dia.setDate(dia.getDate() + 1)) {
      const diaSemana = dia.getDay();
      if (diaSemana !== 0 && diaSemana !== 6 && !ehFeriado(dia)) {
          diasUteis++;
          if (dia < hoje.setHours(0, 0, 0, 0)) {
              diasTrabalhados++;
          }
      }
  }

  const diasFaltantes = diasUteis - diasTrabalhados;

  document.getElementById("diasUteis").value = diasUteis;
  document.getElementById("diasTrabalhados").value = diasTrabalhados;
  document.getElementById("diasFaltantes").value = diasFaltantes;
}

// Função para atualizar os campos dinamicamente
function atualizarCamposDias() {
  const diasUteisInput = document.getElementById("diasUteis");
  const diasTrabalhadosInput = document.getElementById("diasTrabalhados");
  const diasFaltantesInput = document.getElementById("diasFaltantes");

  const diasUteis = parseFloat(diasUteisInput.value);
  const diasTrabalhados = parseFloat(diasTrabalhadosInput.value);
  const diasFaltantes = parseFloat(diasFaltantesInput.value);

  if (diasUteisInput.value === "" || diasTrabalhadosInput.value === "" || diasFaltantesInput.value === "") {
      return;
  }

  if (!isNaN(diasUteis) && !isNaN(diasTrabalhados)) {
      diasFaltantesInput.value = diasUteis - diasTrabalhados;
  } else if (!isNaN(diasUteis) && !isNaN(diasFaltantes)) {
      diasTrabalhadosInput.value = diasUteis - diasFaltantes;
  } else if (!isNaN(diasTrabalhados) && !isNaN(diasFaltantes)) {
      diasUteisInput.value = diasTrabalhados + diasFaltantes;
  }
}

// Função para calcular Mix Faltante
function calcularMixFaltante() {
  const diasUteis = parseFloat(document.getElementById("diasUteis").value) || 0;
  const diasTrabalhados = parseFloat(document.getElementById("diasTrabalhados").value) || 0;
  const diasFaltantes = parseFloat(document.getElementById("diasFaltantes").value) || 0;
  const mixMedio = parseFloat(document.getElementById("mixMedio").value);

  const mix25Selecionado = document.getElementById("mix25").checked;
  const mix30Selecionado = document.getElementById("mix30").checked;
  const mixBase = mix25Selecionado ? 25 : 30;

  if (!isNaN(mixMedio) && diasFaltantes > 0) {
      const mixFaltante = ((diasUteis * mixBase) - (diasTrabalhados * mixMedio)) / diasFaltantes;
      document.getElementById("mixFaltante").value = mixFaltante.toFixed(2);
  } else {
      document.getElementById("mixFaltante").value = "";
  }
}

// Inicializar o cálculo ao carregar a página
window.onload = function () {
  calcularDiasUteis();

  document.getElementById("diasUteis").addEventListener("input", () => {
      atualizarCamposDias();
      calcularMixFaltante();
  });

  document.getElementById("diasTrabalhados").addEventListener("input", () => {
      atualizarCamposDias();
      calcularMixFaltante();
  });

  document.getElementById("diasFaltantes").addEventListener("input", () => {
      atualizarCamposDias();
      calcularMixFaltante();
  });

  document.getElementById("mixMedio").addEventListener("input", calcularMixFaltante);
  document.getElementById("mix25").addEventListener("change", calcularMixFaltante);
  document.getElementById("mix30").addEventListener("change", calcularMixFaltante);
};