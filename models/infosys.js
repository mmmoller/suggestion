var mongoose = require('mongoose');

var infosysSchema = mongoose.Schema({

	usernames: {type: Object, default: {}}, // {_id: name}
	categories: {type: [String], default: []},
	types: {type: Object, default: {}}

}, {minimize: false});

module.exports = mongoose.model('Infosys', infosysSchema);