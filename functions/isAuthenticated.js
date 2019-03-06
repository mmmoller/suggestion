var menuCategory = require('./menuCategory.js');

module.exports = function (req, res, next) {
    if (req.isAuthenticated()){
        return menuCategory(req, res, next);
    }

    res.redirect('/');
}