const express = require('express');
const router = express.Router();

// Rota para cadastrar um item
router.post('/cadastrar-item', (req, res) => {
    const item = req.body;
    console.log('Item recebido:', item);
    // Aqui você pode salvar o item no banco de dados
    res.json({ success: true, message: 'Item cadastrado com sucesso!' });
});

// Rota para listar itens
router.get('/listar-itens', (req, res) => {
    const itens = [
        { nome: 'Item 1', quantidade: 10 },
        { nome: 'Item 2', quantidade: 5 }
    ];
    res.json(itens);
});

module.exports = router; // Exporta o router corretamente