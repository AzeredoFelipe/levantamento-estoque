require('dotenv').config();
const admin = require('firebase-admin');

console.log("Iniciando teste do Firebase...");

try {
  // Configuração do Firebase
  const firebaseConfig = {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  };

  // Inicialização
  admin.initializeApp(firebaseConfig);
  console.log('✅ Firebase inicializado com sucesso!');

  // Teste adicional: listar usuários (opcional)
  admin.auth().listUsers(1)
    .then((userRecords) => {
      console.log('✅ Teste de autenticação bem-sucedido!');
      console.log('Primeiro usuário:', userRecords.users[0]?.email || 'Nenhum usuário encontrado');
    })
    .catch((error) => {
      console.error('❌ Erro no teste de autenticação:', error.message);
    });
  
} catch (error) {
  console.error('❌ Falha crítica:', error.message);
  process.exit(1);
}