// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
    authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
    projectId: "levantamentoestoqueweb-d71cb",
    storageBucket: "levantamentoestoqueweb-d71cb.appspot.com",
    messagingSenderId: "743543905338",
    appId: "1:743543905338:web:189cabbd4d9297effea903",
    measurementId: "G-3ETPR2T1PM"
};

// Inicialização do Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Estado global
let clienteSelecionado = null;
let produtosSalvos = [];
let todosProdutos = [];
let todosGrupos = [];

// Elementos da interface
const elementos = {
    selectCliente: document.getElementById('selectCliente'),
    filtroGrupo: document.getElementById('filtroGrupo'),
    filtroNome: document.getElementById('filtroNome'),
    tabelaProdutos: document.getElementById('tabelaProdutos'),
    btnIniciarLevantamento: document.getElementById('btnIniciarLevantamento'),
    btnFinalizarLevantamento: document.getElementById('btnFinalizarLevantamento'),
    etapaCliente: document.getElementById('etapaCliente'),
    etapaProdutos: document.getElementById('etapaProdutos'),
    contadorProdutos: document.getElementById('contadorProdutos'),
    btnEnviarWhatsApp: document.getElementById('btnEnviarWhatsApp'),
    btnSalvarLevantamento: document.getElementById('btnSalvarLevantamento'),
    modalRevisao: new bootstrap.Modal(document.getElementById('modalRevisao'))
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await carregarComponentes();
            await carregarClientes();
            configurarEventos();
        } else {
            window.location.href = "/index.html";
        }
    });
});

// Funções auxiliares
async function carregarComponentes() {
    try {
        const [header, footer] = await Promise.all([
            fetch('/html/header.html').then(r => r.text()),
            fetch('/html/footer.html').then(r => r.text())
        ]);
        
        document.getElementById('header-container').innerHTML = header;
        document.getElementById('footer-container').innerHTML = footer;
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
    }
}

function mostrarFeedback(mensagem, tipo = "success") {
    const feedback = document.createElement('div');
    feedback.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    feedback.style.zIndex = '1000';
    feedback.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 5000);
}

function atualizarContador() {
    const count = produtosSalvos.filter(p => p.sugestao > 0).length;
    elementos.contadorProdutos.textContent = `${count} ${count === 1 ? 'item salvo' : 'itens salvos'}`;
    elementos.contadorProdutos.classList.toggle('d-none', count === 0);
}

// Funções de carregamento de dados
async function carregarClientes() {
    try {
        elementos.selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
        
        const snapshot = await db.collection('vendedores')
            .doc(auth.currentUser.uid)
            .collection('clientes')
            .orderBy('nome')
            .get();
            
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().nome;
            elementos.selectCliente.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        mostrarFeedback("Erro ao carregar clientes", "danger");
    }
}

async function carregarGrupos() {
    try {
        elementos.filtroGrupo.innerHTML = '<option value="todos">Todos os grupos</option>';
        
        const snapshot = await db.collection('vendedores')
            .doc(auth.currentUser.uid)
            .collection('grupos')
            .orderBy('nome')
            .get();
            
        todosGrupos = snapshot.docs.map(doc => ({
            id: doc.id,
            nome: doc.data().nome
        }));
        
        todosGrupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.nome;
            option.textContent = grupo.nome;
            elementos.filtroGrupo.appendChild(option);
        });

        // Carrega produtos após carregar grupos
        await carregarProdutos();
    } catch (error) {
        console.error("Erro ao carregar grupos:", error);
        mostrarFeedback("Erro ao carregar grupos", "danger");
    }
}

async function carregarProdutos() {
    try {
        elementos.tabelaProdutos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-arrow-repeat fs-4 d-block mb-2"></i>
                    Carregando produtos...
                </td>
            </tr>
        `;

        let snapshot = await db.collection('vendedores')
            .doc(auth.currentUser.uid)
            .collection('produtos')
            .orderBy('nome')
            .get();
        
        if (snapshot.empty) {
            snapshot = await db.collection('vendedores')
                .doc(auth.currentUser.uid)
                .collection('itens')
                .orderBy('nome')
                .get();
        }
            
        todosProdutos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nome: data.nome || data.Nome || 'Sem nome',
                grupo: data.grupo || data.Grupo || 'Sem grupo',
                quantidade: data.quantidade || data.Quantidade || data.estoque || data.Estoque || 0,
                preco: data.preco || data.Preco || 0
            };
        });
        
        filtrarProdutos();
        
        if (todosProdutos.length === 0) {
            mostrarFeedback("Nenhum produto cadastrado encontrado", "warning");
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        mostrarFeedback("Erro ao carregar produtos. Verifique o console.", "danger");
    }
}

function filtrarProdutos() {
    if (!todosProdutos || todosProdutos.length === 0) {
        elementos.tabelaProdutos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-exclamation-circle fs-4 d-block mb-2"></i>
                    Nenhum produto cadastrado para filtrar
                </td>
            </tr>
        `;
        return;
    }

    const grupoSelecionado = elementos.filtroGrupo.value;
    const termoBusca = elementos.filtroNome.value.toLowerCase();

    const produtosFiltrados = todosProdutos.filter(produto => {
        const grupoCorresponde = grupoSelecionado === "todos" || produto.grupo === grupoSelecionado;
        const nomeCorresponde = !termoBusca || produto.nome.toLowerCase().includes(termoBusca);
        return grupoCorresponde && nomeCorresponde;
    });

    if (produtosFiltrados.length === 0) {
        elementos.tabelaProdutos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-search fs-4 d-block mb-2"></i>
                    Nenhum produto encontrado com os filtros selecionados
                </td>
            </tr>
        `;
        return;
    }
    
    elementos.tabelaProdutos.innerHTML = produtosFiltrados.map(produto => {
        const produtoSalvo = produtosSalvos.find(p => p.id === produto.id);
        const isSalvo = !!produtoSalvo;
        
        return `
            <tr data-id="${produto.id}" ${isSalvo ? 'class="table-success"' : ''}>
                <td>${produto.nome}</td>
                <td>
                    <input type="number" min="0" 
                           value="${produtoSalvo?.estoque || produto.quantidade || 0}" 
                           class="form-control form-control-sm estoque" 
                           data-id="${produto.id}"
                           ${isSalvo ? 'readonly' : ''}>
                </td>
                <td>
                    <input type="number" min="0" 
                           value="${produtoSalvo?.sugestao || 0}" 
                           class="form-control form-control-sm sugestao" 
                           data-id="${produto.id}"
                           ${isSalvo ? 'readonly' : ''}>
                </td>
                <td>
                    ${isSalvo ? `
                        <span class="text-success">
                            <i class="bi bi-check-circle-fill"></i> Salvo
                        </span>
                    ` : `
                        <button class="btn btn-sm btn-success salvar-produto" data-id="${produto.id}">
                            <i class="bi bi-check-lg"></i> Salvar
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.estoque, .sugestao').forEach(input => {
        if (!input.readOnly) {
            input.addEventListener('change', atualizarProdutoTemporario);
        }
    });

    document.querySelectorAll('.salvar-produto').forEach(btn => {
        btn.addEventListener('click', salvarProduto);
    });
}

function atualizarProdutoTemporario(e) {
    const produtoId = e.target.dataset.id;
    const row = e.target.closest('tr');
    const estoque = parseFloat(row.querySelector('.estoque').value) || 0;
    const sugestao = parseFloat(row.querySelector('.sugestao').value) || 0;

    if (estoque > 0 || sugestao > 0) {
        row.classList.add('table-warning');
    } else {
        row.classList.remove('table-warning');
    }
}

function salvarProduto(e) {
    const produtoId = e.target.dataset.id;
    const row = e.target.closest('tr');
    const produto = todosProdutos.find(p => p.id === produtoId);
    
    if (!produto) return;

    const estoque = parseFloat(row.querySelector('.estoque').value) || 0;
    const sugestao = parseFloat(row.querySelector('.sugestao').value) || 0;

    const index = produtosSalvos.findIndex(p => p.id === produtoId);
    
    if (index >= 0) {
        produtosSalvos[index] = { ...produto, estoque, sugestao };
    } else {
        produtosSalvos.push({ ...produto, estoque, sugestao });
    }

    row.classList.remove('table-warning');
    row.classList.add('table-success');
    row.querySelector('.estoque').readOnly = true;
    row.querySelector('.sugestao').readOnly = true;
    row.querySelector('td:last-child').innerHTML = `
        <span class="text-success">
            <i class="bi bi-check-circle-fill"></i> Salvo
        </span>
    `;

    mostrarFeedback("Produto salvo com sucesso!", "success");
    atualizarContador();
}

function mostrarRevisao() {
    const tbody = document.querySelector('#tabelaRevisao tbody');
    const produtosComSugestao = produtosSalvos.filter(p => p.sugestao > 0);
    
    if (produtosComSugestao.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-exclamation-circle fs-4 d-block mb-2"></i>
                    Nenhum produto com sugestão de pedido
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = produtosComSugestao.map(produto => `
        <tr data-id="${produto.id}">
            <td>${produto.nome}</td>
            <td>${produto.estoque}</td>
            <td>
                <input type="number" min="0" 
                       value="${produto.sugestao}" 
                       class="form-control form-control-sm sugestao-revisao"
                       data-id="${produto.id}">
            </td>
            <td>
                <button class="btn btn-sm btn-danger remover-item">
                    <i class="bi bi-trash"></i> Remover
                </button>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.sugestao-revisao').forEach(input => {
        input.addEventListener('change', (e) => {
            const produtoId = e.target.dataset.id;
            const novaSugestao = parseFloat(e.target.value) || 0;
            
            const index = produtosSalvos.findIndex(p => p.id === produtoId);
            if (index >= 0) {
                produtosSalvos[index].sugestao = novaSugestao;
                mostrarFeedback("Sugestão atualizada!", "success");
            }
        });
    });
    
    document.querySelectorAll('.remover-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const produtoId = e.target.closest('tr').dataset.id;
            produtosSalvos = produtosSalvos.filter(p => p.id !== produtoId);
            e.target.closest('tr').remove();
            atualizarContador();
            filtrarProdutos();
            mostrarFeedback("Produto removido da revisão", "warning");
        });
    });
    
    elementos.modalRevisao.show();
}

function enviarWhatsApp() {
    const produtosComSugestao = produtosSalvos.filter(p => p.sugestao > 0);
    
    if (produtosComSugestao.length === 0) {
        mostrarFeedback("Nenhum produto com sugestão de pedido", "warning");
        return;
    }
    
    const clienteNome = clienteSelecionado.nome;
    const data = new Date().toLocaleDateString('pt-BR');
    
    let mensagem = `*Levantamento de Estoque - ${clienteNome}*\n`;
    mensagem += `Data: ${data}\n\n`;
    mensagem += '*Sugestão de Pedido:*\n\n';
    
    produtosComSugestao.forEach((produto, index) => {
        mensagem += `➤ ${produto.nome}\n`;
        mensagem += `   Estoque Atual: ${produto.estoque} un.\n`;
        mensagem += `   Sugestão: ${produto.sugestao} un.\n\n`;
    });
    
    mensagem += `\n*Total de itens sugeridos:* ${produtosComSugestao.length}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
}

async function iniciarLevantamento() {
    const clienteId = elementos.selectCliente.value;
    const clienteNome = elementos.selectCliente.options[elementos.selectCliente.selectedIndex].text;
    
    if (!clienteId) {
        mostrarFeedback("Selecione um cliente antes de continuar", "warning");
        return;
    }
    
    try {
        elementos.btnIniciarLevantamento.disabled = true;
        elementos.btnIniciarLevantamento.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Carregando...`;
        
        clienteSelecionado = { id: clienteId, nome: clienteNome };
        produtosSalvos = [];
        
        await carregarGrupos(); // Já carrega produtos automaticamente
        
        elementos.selectCliente.disabled = true;
        elementos.etapaCliente.classList.add('d-none');
        elementos.etapaProdutos.classList.remove('d-none');
        elementos.contadorProdutos.classList.add('d-none');
        
        mostrarFeedback(`Levantamento iniciado para ${clienteNome}`, "success");
    } catch (error) {
        console.error("Erro ao iniciar levantamento:", error);
        mostrarFeedback("Erro ao iniciar levantamento", "danger");
    } finally {
        elementos.btnIniciarLevantamento.disabled = false;
        elementos.btnIniciarLevantamento.innerHTML = `<i class="bi bi-check-circle me-1"></i> Iniciar Levantamento`;
    }
}

async function finalizarLevantamento() {
    if (produtosSalvos.length === 0) {
        mostrarFeedback("Salve pelo menos um produto antes de finalizar", "warning");
        return;
    }
    
    mostrarRevisao();
}

async function salvarLevantamento() {
    try {
        elementos.btnSalvarLevantamento.disabled = true;
        elementos.btnSalvarLevantamento.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Salvando...`;
        
        await db.collection('vendedores')
            .doc(auth.currentUser.uid)
            .collection('levantamentos')
            .add({
                clienteId: clienteSelecionado.id,
                clienteNome: clienteSelecionado.nome,
                produtos: produtosSalvos.filter(p => p.sugestao > 0),
                data: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'finalizado'
            });
        
        mostrarFeedback("Levantamento salvo com sucesso!", "success");
        resetarFormulario();
    } catch (error) {
        console.error("Erro ao salvar levantamento:", error);
        mostrarFeedback("Erro ao salvar levantamento", "danger");
    } finally {
        elementos.btnSalvarLevantamento.disabled = false;
        elementos.btnSalvarLevantamento.innerHTML = `<i class="bi bi-save me-1"></i> Salvar Levantamento`;
    }
}

function resetarFormulario() {
    produtosSalvos = [];
    elementos.selectCliente.disabled = false;
    elementos.selectCliente.value = '';
    elementos.filtroNome.value = '';
    elementos.etapaProdutos.classList.add('d-none');
    elementos.etapaCliente.classList.remove('d-none');
    elementos.contadorProdutos.classList.add('d-none');
    
    elementos.tabelaProdutos.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted py-4">
                <i class="bi bi-arrow-repeat fs-4 d-block mb-2"></i>
                Selecione um cliente para iniciar
            </td>
        </tr>
    `;
    
    elementos.modalRevisao.hide();
}

function configurarEventos() {
    elementos.btnIniciarLevantamento.addEventListener('click', iniciarLevantamento);
    elementos.btnFinalizarLevantamento.addEventListener('click', finalizarLevantamento);
    elementos.filtroGrupo.addEventListener('change', filtrarProdutos);
    elementos.filtroNome.addEventListener('input', filtrarProdutos);
    elementos.btnEnviarWhatsApp.addEventListener('click', enviarWhatsApp);
    elementos.btnSalvarLevantamento.addEventListener('click', salvarLevantamento);
}