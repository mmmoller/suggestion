var CategoryUpdate = require('../functions/category.js');

module.exports = function (req, res, next) {
    if (req.isAuthenticated()){
        CategoryUpdate(req, res);
        return next();
    }

    var id = req.params["_id"];
    
    console.log(id)

    res.redirect('/user_external/:'+id);
}