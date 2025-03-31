const admin = require('firebase-admin');

// Configuração segura para Vercel e local
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log('Firebase Admin inicializado com sucesso');
}

const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const app = express();

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Inicialização segura do Firebase para Vercel e local
if (admin.apps.length === 0) {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Configuração para produção no Vercel
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    } else {
      // Configuração para desenvolvimento local
      const serviceAccount = require('./serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    process.exit(1); // Encerra o servidor se o Firebase falhar
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
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;