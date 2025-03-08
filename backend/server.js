const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir arquivos estáticos (front-end)
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware para processar JSON no body das requisições
app.use(express.json());

// Rotas da API
const estoqueRoutes = require('./routes/estoqueRoutes');
app.use('/api', estoqueRoutes);

// Rota para a página de levantamento
app.get('/levantamento', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/levantamento.html'));
});

// Rota para a página de acompanhamento
app.get('/acompanhamento', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/acompanhamento.html'));
});

// Rota para a página de cadastro de produtos
app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/cadastro.html'));
});

// Rota para a página de cadastro de clientes
app.get('/cadastroCliente', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/cadastroCliente.html'));
});

// Rota inicial (página de login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});