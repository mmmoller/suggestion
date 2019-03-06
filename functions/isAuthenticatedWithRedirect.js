var menuCategory = require('./menuCategory.js');

module.exports = function (req, res, next) {
    if (req.isAuthenticated()){
        menuCategory(req, res, next);
    }
    else{

        var id = req.params["_id"];
        
        console.log(id)

        res.redirect('/user_external/:'+id);
    }
}