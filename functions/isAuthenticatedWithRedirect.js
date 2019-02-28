module.exports = function (req, res, next) {
    if (req.isAuthenticated())
        return next();

    var id = req.params["_id"];
    
    console.log(id)

    res.redirect('/user_external/:'+id);
}