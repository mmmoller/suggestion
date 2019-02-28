module.exports = function (req, res, next) {
    if (req.isAuthenticated() && req.user.permission >= 2)
        return next();

    res.redirect('/');
}