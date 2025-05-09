if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

if (admin.apps.length === 0) {
  try {
      const config = {
          credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          }),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      };

      if (process.env.NODE_ENV !== 'production' && require.resolve('./serviceAccountKey.json')) {
          config.credential = admin.credential.cert(require('./serviceAccountKey.json'));
      }

      admin.initializeApp(config);
      console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
      process.exit(1);
  }
}

app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

const autenticarUsuario = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Token não fornecido ou formato inválido" });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.userId = decodedToken.uid;
      next();
  } catch (error) {
      console.error("Erro na autenticação:", error);
      res.status(401).json({ 
          error: "Não autorizado",
          details: error.message 
      });
  }
};

app.get('/test-firebase', async (req, res) => {
  try {
      const userRecords = await admin.auth().listUsers(1);
      res.json({
          status: 'success',
          firebase: 'working',
          firstUser: userRecords.users[0]?.email || 'none'
      });
  } catch (error) {
      res.status(500).json({
          status: 'error',
          message: error.message,
          details: error.stack
      });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use('/api', autenticarUsuario, require('./routes/estoqueRoutes'));

['levantamento', 'acompanhamento', 'cadastro', 'cadastroCliente', 'cadastroVendedor'].forEach(page => {
  app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(__dirname, `../frontend/html/${page}.html`), err => {
          err && res.status(404).send('Página não encontrada');
      });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;