var Log = require('../models/log.js');
var moment = require('moment');

module.exports = function (req, res, next) {
    var newLog = new Log();
    newLog.body = req.body;
    newLog.path = req.path;
    newLog.date = moment();
    newLog.user = {"_id": req.user._id, "username" : req.user.username};
    console.log(newLog)
    newLog.save(function (err) {
        if (err) return handleError(err,req,res);
        return next();
    });
    
}
