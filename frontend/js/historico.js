const firebaseConfig = {
    apiKey: "AIzaSyBeSJEQukdOUm9CpMfG1O3DDjUCOB1SN7I",
    authDomain: "levantamentoestoqueweb-d71cb.firebaseapp.com",
    projectId: "levantamentoestoqueweb-d71cb",
    storageBucket: "levantamentoestoqueweb-d71cb.appspot.com",
    messagingSenderId: "743543905338",
    appId: "1:743543905338:web:189cabbd4d9297effea903",
    measurementId: "G-3ETPR2T1PM"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos da interface
const elementos = {
    tabelaHistorico: document.getElementById('tabelaHistorico'),
    modalDetalhes: new bootstrap.Modal(document.getElementById('modalDetalhes')),
    detalheCliente: document.getElementById('detalheCliente'),
    detalheData: document.getElementById('detalheData'),
    detalheProdutos: document.getElementById('detalheProdutos'),
    btnReenviarWhatsApp: document.getElementById('btnReenviarWhatsApp')
};

// Variável para armazenar o levantamento selecionado
let levantamentoSelecionado = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await carregarComponentes();
            await carregarHistorico();
            configurarEventos();
        } else {
            window.location.href = "/index.html";
        }
    });
});

async function carregarComponentes() {
    try {
        const [header] = await Promise.all([
            fetch('/html/header.html').then(r => r.text()),
        ]);
        
        document.getElementById('header-container').innerHTML = header;
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
    }
}

async function carregarHistorico() {
    try {
        elementos.tabelaHistorico.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-arrow-repeat fs-4 d-block mb-2"></i>
                    Carregando histórico...
                </td>
            </tr>
        `;

        const snapshot = await db.collection('vendedores')
            .doc(auth.currentUser.uid)
            .collection('levantamentos')
            .orderBy('data', 'desc')
            .get();

        if (snapshot.empty) {
            elementos.tabelaHistorico.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-exclamation-circle fs-4 d-block mb-2"></i>
                        Nenhum levantamento encontrado
                    </td>
                </tr>
            `;
            return;
        }

        elementos.tabelaHistorico.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const dataFormatada = data.data?.toDate ? data.data.toDate().toLocaleString('pt-BR') : 'Data não disponível';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${data.clienteNome}</td>
                <td>${data.produtos.length} itens</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-ver-detalhes" data-id="${doc.id}">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                </td>
            `;
            elementos.tabelaHistorico.appendChild(row);
        });

        // Adiciona eventos aos botões de detalhes
        document.querySelectorAll('.btn-ver-detalhes').forEach(btn => {
            btn.addEventListener('click', verDetalhes);
        });

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        elementos.tabelaHistorico.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-exclamation-circle fs-4 d-block mb-2"></i>
                    Erro ao carregar histórico
                </td>
            </tr>
        `;
    }
}

async function verDetalhes(e) {
    const levantamentoId = e.target.closest('button').dataset.id;
    
    try {
        const doc = await db.collection('vendedores')
            .doc(auth.currentUser.uid)
            .collection('levantamentos')
            .doc(levantamentoId)
            .get();

        if (doc.exists) {
            const data = doc.data();
            levantamentoSelecionado = data;
            
            // Preencher modal de detalhes
            elementos.detalheCliente.textContent = data.clienteNome;
            elementos.detalheData.textContent = data.data?.toDate ? data.data.toDate().toLocaleString('pt-BR') : 'Data não disponível';
            
            // Limpar e preencher tabela de produtos
            elementos.detalheProdutos.innerHTML = '';
            data.produtos.forEach(produto => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${produto.nome}</td>
                    <td>${produto.estoque}</td>
                    <td>${produto.sugestao}</td>
                `;
                elementos.detalheProdutos.appendChild(row);
            });
            
            // Mostrar modal
            elementos.modalDetalhes.show();
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        alert("Erro ao carregar detalhes do levantamento");
    }
}

function reenviarWhatsApp() {
    if (!levantamentoSelecionado) return;
    
    const { clienteNome, produtos } = levantamentoSelecionado;
    const data = new Date().toLocaleDateString('pt-BR');
    
    let mensagem = `*Reenvio de Levantamento - ${clienteNome}*\n`;
    mensagem += `Data original: ${elementos.detalheData.textContent}\n`;
    mensagem += `Reenvio em: ${data}\n\n`;
    mensagem += '*Sugestão de Pedido:*\n\n';
    
    produtos.forEach((produto, index) => {
        if (produto.sugestao > 0) {
            mensagem += `➤ ${produto.nome}\n`;
            mensagem += `   Estoque Atual: ${produto.estoque} un.\n`;
            mensagem += `   Sugestão: ${produto.sugestao} un.\n\n`;
        }
    });
    
    mensagem += `\n*Total de itens sugeridos:* ${produtos.filter(p => p.sugestao > 0).length}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
}

function configurarEventos() {
    elementos.btnReenviarWhatsApp.addEventListener('click', reenviarWhatsApp);
}