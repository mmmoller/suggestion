var mongoose = require('mongoose');

module.exports = mongoose.model('Recommendation',{
    name: String, // Nome da Informação
    category: String, // Categoria
    grades: Object, // {_id : grade}
    comments: Object, // {_id : comment}
});