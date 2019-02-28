module.exports = function (req, res, next) {
    if (req.isAuthenticated() && req.user.permission >= 1)
        return next();

    res.redirect('/');
}
