const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const app = express();

// Configuração da porta (usando a do Vercel ou 3000 local)
const PORT = process.env.PORT || 3000;

// Inicialização condicional do Firebase Admin
if (admin.apps.length === 0) {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Middlewares
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

// Middleware de autenticação (mantido igual)
const autenticarUsuario = async (req, res, next) => {
    // ... (seu código existente)
};

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rotas API protegidas
app.use('/api', autenticarUsuario, require('./routes/estoqueRoutes'));

// Rotas para páginas HTML - Modificado para o Vercel
const htmlPages = [
    'levantamento',
    'acompanhamento',
    'cadastro',
    'cadastroCliente',
    'cadastroVendedor'
];

htmlPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `../frontend/html/${page}.html`));
    });
    
    // Adiciona rota alternativa com /html/ para compatibilidade
    app.get(`/html/${page}`, (req, res) => {
        res.redirect(`/${page}`);
    });
});

// Rota de fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; // Adicionado para o Vercel