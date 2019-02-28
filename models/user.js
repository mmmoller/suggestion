var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({

    username: String,
    
    correlation: {type: Object, default: {}},

    /*correlation:{
        _id : {
            //isFriend: Boolean, (OLD, NOT WORKING ANYMORE)
            (forEach Category in Infosys){
                Category: {
                    ratingSum : Number
                    ratingCount : Number
                }
            }
        }
    }*/

    friendlist: [String],
    bookmark: [String],
    dontshow: [String],

    permission: {type: Number, default: 0}, // 0: normal, 1: moderator, 2: admin

    local            : {
        email        : String,
        password     : String,
        resetPasswordToken       : String,
        resetPasswordExpires : Date
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },

}, {minimize: false});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// checking if token is valid
userSchema.methods.validToken = function(token){
	return bcrypt.compareSync(token, this.google.token);
}

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);