var mongoose = require('mongoose');

module.exports = mongoose.model('Infosys',{
	usernames: Object, // {_id: name}
	categories: [String],
});