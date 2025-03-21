const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const app = express();
const PORT = 3000;

// Inicializa o Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // Caminho corrigido
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Servir arquivos estáticos (front-end)
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware para processar JSON no body das requisições
app.use(express.json());

// Middleware de autenticação
const autenticarUsuario = async (req, res, next) => {
    const idToken = req.headers.authorization;
    if (!idToken) {
        return res.status(401).send("Não autorizado");
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.userId = decodedToken.uid; // Adiciona o UID à requisição
        next();
    } catch (error) {
        res.status(401).send("Token inválido");
    }
};

// Rotas públicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rotas protegidas
app.use('/api', autenticarUsuario, require('./routes/estoqueRoutes'));

// Rotas para páginas HTML
app.get('/levantamento', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/levantamento.html'));
});

app.get('/acompanhamento', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/acompanhamento.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/cadastro.html'));
});

app.get('/cadastroCliente', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/cadastroCliente.html'));
});

app.get('/cadastroVendedor', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/cadastroVendedor.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});