require('dotenv').config();
const express = require('express');
const path = require('path');
const admin = require('firebase-admin'); // ÚNICA declaração do admin

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Firebase (versão simplificada e unificada)
if (admin.apps.length === 0) {
  try {
    const firebaseConfig = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    };

    admin.initializeApp(firebaseConfig);
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    process.exit(1);
  }
}

// Middlewares
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

// Middleware de autenticação
const autenticarUsuario = async (req, res, next) => {
  const idToken = req.headers.authorization;
  if (!idToken) return res.status(401).send("Não autorizado");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    res.status(401).send("Token inválido");
  }
};

// Rotas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rotas API protegidas
app.use('/api', autenticarUsuario, require('./routes/estoqueRoutes'));

// Rotas para páginas HTML
const htmlPages = [
  'levantamento',
  'acompanhamento',
  'cadastro',
  'cadastroCliente',
  'cadastroVendedor'
];

htmlPages.forEach(page => {
  const filePath = path.join(__dirname, `../frontend/html/${page}.html`);
  
  app.get(`/${page}`, (req, res) => {
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Erro ao carregar ${page}.html:`, err);
        res.status(404).send('Página não encontrada');
      }
    });
  });
});

// Rota de fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).send('Erro interno do servidor');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;