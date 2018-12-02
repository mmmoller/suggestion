var mongoose = require('mongoose');

var suggestionSchema = mongoose.Schema({

	name: String, // Nome da Informação
    category: String, // Categoria
    link: {type: Object, default: {}}, // {type: url}
    userRating: {type: Object, default: {}}, // {_id : rating}
    userComment: {type: Object, default: {}}, //{_id : comment}
    tag: String,

}, {minimize: false});

module.exports = mongoose.model('Suggestion', suggestionSchema);