var Category = require('../models/category.js');

module.exports = function (req, res, next) {
    if (categories.length == 0){

        Category.findOne({}, function (err, category){
            if (err) return handleError(err,req,res);
            if (category){
                console.log("teste")
                
                for (key in category.categories){
                    categories.push(key)
                }

                res.locals.userCategory = req.user.category;
                res.locals.menuCategories = categories;

            }
            else{
                req.flash('message', "!Category don't exist");
            }
            return next()
        });
    }
    else{
        console.log("not using DB anymore")

        res.locals.userCategory = req.user.category;
        res.locals.menuCategories = categories;

        return next()
    }
}

var categories = []