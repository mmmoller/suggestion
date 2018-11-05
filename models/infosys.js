var mongoose = require('mongoose');

module.exports = mongoose.model('Infosys',{
	users: [String],
	categories: [String]
});