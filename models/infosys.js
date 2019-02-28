var mongoose = require('mongoose');

var infosysSchema = mongoose.Schema({

	usernames: {type: Object, default: {}}, // {_id: name}
	categories: {type: Object, default: {}},
	types: {type: Object, default: {}}, // icons

}, {minimize: false});

module.exports = mongoose.model('Infosys', infosysSchema);