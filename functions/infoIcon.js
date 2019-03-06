var Icon = require('../models/icon.js');

module.exports = function (req, res, next) {
    if (!Object.keys(infoIcon).length){

        Icon.findOne({}, function (err, icon){
            if (err) return handleError(err,req,res);
            if (icon){
                infoIcon = icon.icons;
            }
            else{
                req.flash('message', "!Icon doesn't exist");
            }
            res.locals.infoIcon = infoIcon;
            return next()
        });

    }
    else{
        res.locals.infoIcon = infoIcon;
        return next()
    }
}

var infoIcon = {}