const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Middleware de autenticação
const autenticarUsuario = async (req, res, next) => {
    const idToken = req.headers.authorization;
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.userId = decodedToken.uid;
        next();
    } catch (error) {
        res.status(401).json({ error: "Não autorizado" });
    }
};

// Rota para cadastrar item específica do usuário
router.post('/cadastrar-item', autenticarUsuario, async (req, res) => {
    try {
        const userId = req.userId;
        const item = req.body;
        
        const docRef = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .add(item);
            
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para listar itens do usuário
router.get('/listar-itens', autenticarUsuario, async (req, res) => {
    try {
        const userId = req.userId;
        const snapshot = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .get();
            
        const itens = [];
        snapshot.forEach(doc => {
            itens.push({ id: doc.id, ...doc.data() });
        });
        
        res.json(itens);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;