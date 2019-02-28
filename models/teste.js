var mongoose = require('mongoose');

var testeSchema = mongoose.Schema({

	t1: String,
    t2: String,
    t3: {type: Object},
    t5: String,

}, {minimize: false});

module.exports = mongoose.model('Teste', testeSchema);