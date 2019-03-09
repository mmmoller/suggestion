module.exports = function (req, res, next) {
    console.log("here")
    if (req.isAuthenticated() && req.user.permission >= 2)
        return next();

    res.redirect('/');
}