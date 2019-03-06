var Category = require('../models/category.js');

module.exports = function (req, res, next) {
    if (!Object.keys(infoCategory).length){
        
        Category.findOne({}, function (err, category){
            if (err) return handleError(err,req,res);
            if (category){
                infoCategory = category.categories;
            }
            else{
                req.flash('message', "!Category doesn't exist");
            }
            res.locals.infoCategory = infoCategory;
            return next()
        });

    }
    else{
        res.locals.infoCategory = infoCategory;
        return next()
    }
}

var infoCategory = {}