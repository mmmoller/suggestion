var Username = require('../models/username');

module.exports = function (req, res, next) {
    Username.findOne({}, function (err, username){
        if (err) return handleError(err,req,res);
        if (username){
            res.locals.infoUsername = username.usernames;
        }
        else{
            req.flash('message', "!Username don't exist");
            res.locals.infoUsername = {};
        }
        return next()
    });
}