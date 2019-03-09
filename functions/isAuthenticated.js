var infoMenu = require('./infoMenu.js');

module.exports = function (req, res, next) {
    if (req.isAuthenticated()){
        return infoMenu(req, res, next);
    }

    res.redirect('/');
}