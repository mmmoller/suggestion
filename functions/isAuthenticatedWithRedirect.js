var infoMenu = require('./infoMenu.js');

module.exports = function (req, res, next) {
    if (req.isAuthenticated()){
        infoMenu(req, res, next);
    }
    else{

        var id = req.params["_id"];
        
        console.log(id)

        res.redirect('/user_external/:'+id);
    }
}