const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');


const handleFirestoreError = (res, error) => {
    console.error('Firestore Error:', error);
    res.status(500).json({ 
        error: 'Erro no banco de dados',
        details: error.message 
    });
};

const itemValidations = [
    body('nome').notEmpty().trim().withMessage('Nome é obrigatório'),
    body('quantidade').isInt({ min: 0 }).withMessage('Quantidade inválida'),
    body('preco').optional().isFloat({ min: 0 }).withMessage('Preço inválido'),
    body('grupo').optional().isString().trim()
];

const clienteValidations = [
    body('nome').notEmpty().trim().withMessage('Nome é obrigatório'),
    body('telefone').notEmpty().withMessage('Telefone é obrigatório')
];

// =============================================
// Rotas de Produtos
// =============================================

router.post('/cadastrar-item', itemValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.userId;
        const item = {
            ...req.body,
            criadoEm: admin.firestore.FieldValue.serverTimestamp(),
            atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .add(item);

        res.status(201).json({ 
            success: true, 
            id: docRef.id,
            item: item
        });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

router.get('/listar-itens', async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 10, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        let query = admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .orderBy('criadoEm', 'desc')
            .limit(parseInt(limit));

        if (offset > 0) {
            query = query.offset(offset);
        }

        const snapshot = await query.get();
        const total = (await snapshot.ref.parent.count().get()).data().count;

        const itens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            itens,
            paginacao: {
                total,
                pagina: parseInt(page),
                porPagina: parseInt(limit),
                totalPaginas: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

router.get('/item/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const itemId = req.params.id;

        const doc = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .doc(itemId)
            .get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }

        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

router.put('/item/:id', itemValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.userId;
        const itemId = req.params.id;
        const updates = {
            ...req.body,
            atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
        };

        await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .doc(itemId)
            .update(updates);

        res.json({ 
            success: true,
            id: itemId,
            updates: updates
        });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

router.delete('/item/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const itemId = req.params.id;

        await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('itens')
            .doc(itemId)
            .delete();

        res.json({ success: true, id: itemId });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

// =============================================
// Rotas de Clientes
// =============================================

router.get('/listar-clientes', async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 10, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        let query = admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('clientes')
            .orderBy('criadoEm', 'desc')
            .limit(parseInt(limit));

        if (offset > 0) {
            query = query.offset(offset);
        }

        const snapshot = await query.get();
        const total = (await snapshot.ref.parent.count().get()).data().count;

        const clientes = snapshot.docs.map(doc => ({
            id: doc.id,
            nome: doc.data().nome,
            endereco: doc.data().endereco,
            telefone: doc.data().telefone,
            criadoEm: doc.data().criadoEm?.toDate().toISOString()
        }));

        res.json({
            clientes,
            paginacao: {
                total,
                pagina: parseInt(page),
                porPagina: parseInt(limit),
                totalPaginas: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

router.post('/cadastrar-cliente', clienteValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.userId;
        const { nome, endereco, telefone } = req.body;

        const docRef = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('clientes')
            .add({
                nome,
                endereco: endereco || '',
                telefone: telefone.replace(/\D/g, ''),
                criadoEm: admin.firestore.FieldValue.serverTimestamp()
            });

        res.status(201).json({ 
            success: true,
            id: docRef.id,
            message: 'Cliente cadastrado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        res.status(500).json({ error: 'Erro ao cadastrar cliente' });
    }
});

router.get('/cliente/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const clienteId = req.params.id;

        const doc = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('clientes')
            .doc(clienteId)
            .get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        res.json({ 
            id: doc.id,
            ...doc.data(),
            criadoEm: doc.data().criadoEm?.toDate().toISOString()
        });
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
});

// =============================================
// Rotas de Grupos
// =============================================

router.get('/listar-grupos', async (req, res) => {
    try {
        const userId = req.userId;
        const snapshot = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('grupos')
            .get();

        const grupos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(grupos);
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

// =============================================
// Rotas de Levantamentos
// =============================================

router.post('/cadastrar-levantamento', async (req, res) => {
    try {
        const userId = req.userId;
        const { clienteId, clienteNome, produtos } = req.body;
        
        if (!clienteId || !produtos || !Array.isArray(produtos)) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const levantamentoRef = await admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('levantamentos')
            .add({
                clienteId,
                clienteNome,
                produtos,
                data: admin.firestore.FieldValue.serverTimestamp(),
                status: 'finalizado',
                userId
            });

        res.status(201).json({ 
            success: true,
            id: levantamentoRef.id 
        });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

router.get('/listar-levantamentos', async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 10, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        let query = admin.firestore()
            .collection('vendedores')
            .doc(userId)
            .collection('levantamentos')
            .orderBy('data', 'desc')
            .limit(parseInt(limit));

        if (offset > 0) {
            query = query.offset(offset);
        }

        const snapshot = await query.get();
        const total = (await snapshot.ref.parent.count().get()).data().count;

        const levantamentos = await Promise.all(snapshot.docs.map(async doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                data: data.data.toDate().toISOString()
            };
        }));

        res.json({
            levantamentos,
            paginacao: {
                total,
                pagina: parseInt(page),
                porPagina: parseInt(limit),
                totalPaginas: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        handleFirestoreError(res, error);
    }
});

// =============================================
// Rota de Teste
// =============================================

router.get('/test-firebase', async (req, res) => {
    try {
        res.json({ 
            status: 'success', 
            message: 'API funcionando',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;