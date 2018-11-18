var mongoose = require('mongoose');

var testeSchema = mongoose.Schema({

	t1: String, // Nome da Informação
    t2: String, // Categoria

}, {minimize: false});

module.exports = mongoose.model('Teste', testeSchema);