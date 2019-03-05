module.exports = function (req, res) {
    res.locals.userCategory = req.user.category;
    res.locals.categories = categories;
}

var categories = ["All", "Film", "Music", "Book"]