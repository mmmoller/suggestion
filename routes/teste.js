var express = require('express');
var router = express.Router();

module.exports = function(passport, functions){


    router.get('/abbc', function(req, res) {
        res.send("foda-se")
    });

    return router;

}