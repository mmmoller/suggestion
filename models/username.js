var mongoose = require('mongoose');

var usernameSchema = mongoose.Schema({

	usernames: {type: Object, default: {}}, // {_id: name}

}, {minimize: false});

module.exports = mongoose.model('Username', usernameSchema);