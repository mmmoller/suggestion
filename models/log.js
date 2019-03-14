var mongoose = require('mongoose');

var logSchema = mongoose.Schema({

    user: Object,
    body: Object,
    path: String,
    date: String,

}, {minimize: false});

// create the model for users and expose it to our app
module.exports = mongoose.model('Log', logSchema);