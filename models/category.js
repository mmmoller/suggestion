var mongoose = require('mongoose');

var categorySchema = mongoose.Schema({

	categories: {type: Object, default: {}},
	types: {type: Object, default: {}}, // icons

}, {minimize: false});

module.exports = mongoose.model('Category', categorySchema);