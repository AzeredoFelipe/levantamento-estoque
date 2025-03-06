// Seletores globais
const headerContainer = document.getElementById('header-container');
const footerContainer = document.getElementById('footer-container');
const searchInput = document.getElementById('searchInput');
const shareButton = document.getElementById('shareButton');
const limparDadosBtn = document.getElementById('limparDados');
const tabelaProdutos = document.getElementById('tabelaProdutos');
const grupoProduto = document.getElementById('grupoProduto');

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

// Função para carregar os produtos dinamicamente
function carregarProdutos() {
    // Exemplo de dados (substitua por uma chamada ao Firestore ou outro banco de dados)
    const produtos = [
        { nome: 'Produto A', grupo: '350ml', estoque: 10, sugestao: 5 },
        { nome: 'Produto B', grupo: '300ml', estoque: 20, sugestao: 10 },
        { nome: 'Produto C', grupo: 'p3', estoque: 15, sugestao: 7 },
    ];

    // Limpa a tabela antes de carregar os dados
    tabelaProdutos.innerHTML = '';

    // Adiciona os produtos à tabela
    produtos.forEach(produto => {
        const row = `
            <tr data-grupo="${produto.grupo}">
                <td>${produto.nome}</td>
                <td contenteditable="true">${produto.estoque}</td>
                <td contenteditable="true">${produto.sugestao}</td>
            </tr>
        `;
        tabelaProdutos.innerHTML += row;
    });
}

// Filtrar produtos pelo grupo selecionado
if (grupoProduto) {
    grupoProduto.addEventListener('change', function () {
        filtrarPorGrupo(this.value);
    });
}

function filtrarPorGrupo(grupo) {
    document.querySelectorAll("#tabelaProdutos tr").forEach(linha => {
        const grupoProduto = linha.getAttribute('data-grupo');
        linha.style.display = (grupo === '' || grupoProduto === grupo) ? '' : 'none';
    });
}

// Função de pesquisa
if (searchInput) {
    searchInput.addEventListener('input', function () {
        const filterValue = this.value.toLowerCase();
        document.querySelectorAll("#tabelaProdutos tr").forEach(linha => {
            const nomeProduto = linha.querySelector("td")?.innerText.toLowerCase();
            linha.style.display = nomeProduto?.includes(filterValue) ? '' : 'none';
        });
    });
}

// Compartilhar no WhatsApp
if (shareButton) {
    shareButton.addEventListener('click', function () {
        let message = 'Segue Levantamento de Estoque e Sugestão de pedido:\n------------------------\n\n';
        document.querySelectorAll("#tabelaProdutos tr").forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            if (colunas.length < 3) return; // Garante que há colunas suficientes

            const nomeProduto = colunas[0].innerText;
            const estoque = colunas[1].innerText.trim();
            const sugestao = colunas[2].innerText.trim();

            if (estoque !== '' && sugestao !== '') {
                message += `Produto: ${nomeProduto}\nEstoque: ${estoque}\nSugestão: ${sugestao}\n\n------------------------\n`;
            }
        });

        if (message === 'Segue Levantamento de Estoque e Sugestão de pedido:\n------------------------\n\n') {
            alert('Falta produto preenchido para compartilhar. Preencha as 2 colunas, Estoque e sugestão, mesmo que seja 0');
            return;
        }

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    });
}

// Salvar dados localmente
function salvarDadosTabela() {
    const dados = [];
    document.querySelectorAll("#tabelaProdutos tr").forEach(linha => {
        const colunas = linha.querySelectorAll('td');
        if (colunas.length < 3) return;

        dados.push({
            produto: colunas[0].innerText,
            estoque: colunas[1].innerText,
            sugestao: colunas[2].innerText
        });
    });

    localStorage.setItem('dadosTabela', JSON.stringify(dados));
}

// Carregar dados salvos
function carregarDadosTabela() {
    const dadosSalvos = localStorage.getItem('dadosTabela');
    if (!dadosSalvos) return;

    const dados = JSON.parse(dadosSalvos);
    document.querySelectorAll("#tabelaProdutos tr").forEach((linha, index) => {
        const colunas = linha.querySelectorAll('td');
        if (colunas.length < 3 || !dados[index]) return;

        colunas[1].innerText = dados[index].estoque;
        colunas[2].innerText = dados[index].sugestao;
    });
}

// Adicionar evento para salvar alterações
document.querySelectorAll('td[contenteditable="true"]').forEach(celula => {
    celula.addEventListener('input', salvarDadosTabela);
});

// Botão LIMPAR DADOS
if (limparDadosBtn) {
    limparDadosBtn.addEventListener('click', function () {
        localStorage.removeItem('dadosTabela');
        document.querySelectorAll("#tabelaProdutos tr td:nth-child(2), #tabelaProdutos tr td:nth-child(3)").forEach(td => td.innerText = '');
        alert('Dados apagados!');
    });
}