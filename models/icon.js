var mongoose = require('mongoose');

var iconSchema = mongoose.Schema({

	icons: {type: Object, default: {}},

}, {minimize: false});

module.exports = mongoose.model('Icon', iconSchema);