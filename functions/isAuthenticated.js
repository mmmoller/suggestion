var CategoryUpdate = require('../functions/category.js');

module.exports = function (req, res, next) {
    if (req.isAuthenticated()){
        CategoryUpdate(req, res);
        return next();
    }

    res.redirect('/');
}