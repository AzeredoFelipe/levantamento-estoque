// frontend/js/api.js

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

async function getAuthToken() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        return await user.getIdToken();
    } catch (error) {
        console.error('Erro ao obter token:', error);
        throw error;
    }
}

async function fetchApi(endpoint, method = 'GET', data = null) {
    try {
        const token = await getAuthToken();
        console.log(`Enviando requisição para ${endpoint}`, { method, data }); // Debug
        
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: data ? JSON.stringify(data) : null
        });

        console.log(`Resposta para ${endpoint}:`, { 
            status: response.status,
            statusText: response.statusText 
        }); // Debug

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
            error.response = response; // Adiciona a resposta ao erro
            throw error;
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro completo na chamada ${endpoint}:`, {
            message: error.message,
            stack: error.stack,
            response: error.response
        });
        throw error;
    }
}

window.estoqueApi = {
    // Clientes
    async listarClientes() {
        try {
            return await fetchApi('listar-clientes');
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            if (error.message.includes('404')) {
                // Adicione este log para debug
                console.log('URL tentada:', `${API_BASE_URL}/listar-clientes`);
                return [];
            }
            throw new Error('Não foi possível carregar os clientes');
        }
    },

    async cadastrarCliente(cliente) {
        try {
            return await fetchApi('cadastrar-cliente', 'POST', cliente);
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            throw new Error(error.message || 'Falha ao cadastrar cliente');
        }
    },

    // Produtos
    listarProdutos: () => fetchApi('listar-itens'),
    cadastrarProduto: (produto) => fetchApi('cadastrar-item', 'POST', produto),

    // Levantamentos
    salvarLevantamento: (levantamento) => fetchApi('cadastrar-levantamento', 'POST', levantamento),
    listarHistorico: () => fetchApi('listar-levantamentos'),
    
    // Grupos
    listarGrupos: () => fetchApi('listar-grupos')
};