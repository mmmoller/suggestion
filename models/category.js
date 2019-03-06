var mongoose = require('mongoose');

var categorySchema = mongoose.Schema({

	categories: {type: Object, default: {}},

}, {minimize: false});

module.exports = mongoose.model('Category', categorySchema);