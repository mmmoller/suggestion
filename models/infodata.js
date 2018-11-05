var mongoose = require('mongoose');

module.exports = mongoose.model('Infodata',{
    category: String,
    users_grade: [Number],
    users_comment: [String],
});