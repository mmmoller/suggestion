var mongoose = require('mongoose');

module.exports = mongoose.model('Relation',{
    _id: String, // {user._id}
    friends_id: [String],
    friends_coeficient: [Number],
});