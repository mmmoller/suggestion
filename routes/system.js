var express = require('express');
var router = express.Router();
var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');

var Username = require('../models/username');
var Category = require('../models/category');
var Icon = require('../models/icon');

module.exports = function(passport){

    // System 
    router.get('/infosys', function(req, res) {
        var newInfosys = new Infosys();
        newInfosys.usernames = {};
        newInfosys.categories = infosysCategories;
        newInfosys.types = infosysTypes;

        newInfosys.save(function (err) {
            if (err) return handleError(err,req,res);
            res.send("teste");
        });
    })

    router.get('/delete', function(req, res){
        User.remove({}, function(err) { 
            console.log('Users removed')
        });
        Infosys.remove({}, function(err) { 
            console.log('Infosys removed')
        });
        Suggestion.remove({}, function(err) { 
            console.log('Suggestions removed')
        });
        res.send("Deletado");
    });

    router.get('/r', function(req, res){
        
        Suggestion.remove({}, function(err) { 
            console.log('Suggestions removed')
        });

        Category.remove({}, function(err) { 
            var newCategory = new Category();
            newCategory.categories = categories;
            newCategory.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Categories recreated')
        });

        Icon.remove({}, function(err) { 
            var newIcon = new Icon();
            newIcon.icons = icons;
            newIcon.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Icons recreated')
        });

        Username.remove({}, function(err) {

            User.remove({}, function(err) { 

                console.log('Users removed')
                var newUser = new User();
                newUser.local.email = "admin";
                newUser.local.password = newUser.generateHash("admin");
                newUser.username = "admin"
                newUser.permission = 2;

                console.log('Usernames removed')
                var newUsername = new Username();
                newUsername.usernames = {};
                newUsername.usernames[newUser._id] = newUser.username;
                newUsername.markModified("usernames");

                newUser.save(function(err) {
                    if (err) return handleError(err,req,res);
                    newUsername.save(function (err) {
                        if (err) return handleError(err,req,res);
                        res.redirect("/");
                    });
                });

            });
            
        });
    });
    
    return router;
}

var categories = {
    "Film" : {
        specificInfo : {
            "Plot" : {type: "textarea"},
            "Genre" : {type: "input"},
            "Director" : {type: "input"},
            "Year" : {type: "input"},
        }
    },
    "Music" : {
        specificInfo : {
            "Type" : {
                type: "select",
                options: ["Music", "Artist", "Album", "Playlist"]
            },
            "Artist" : {type: "input"},
            "Album" : {type: "input"},
            "Year" : {type: "input"},
        }
    },
    "Book" : {
        specificInfo : {
            "Type" : {
                type: "select",
                options: ["Book", "Series"]
            },
            "Author" : {type: "input"},
            "Genre" : {type: "input"},
            "Year" : {type: "input"},
        }
    },
}

var icons = {
    "IMDb" : {
        fontAwesome: "fab fa-imdb",
        color: {color: "goldenrod"},
        size: {"font-size": "35px"},
        hostname: ["imdb"],
    },
    "YouTube" : {
        fontAwesome: "fab fa-youtube",
        color: {color: "red"},
        size: {"font-size": "35px"},
        hostname: ["youtube", "youtu.be"]
    },
    "Spotify" : {
        fontAwesome: "fab fa-spotify",
        color: {color: "green"},
        size: {"font-size": "35px"},
        hostname: ["spotify"],
    },
    "Wikipedia" : {
        fontAwesome: "fab fa-wikipedia-w",
        color: {color: "grey"},
        size: {"font-size": "35px"},
        hostname: ["wikipedia"],
    },
    "Unknown" : {
        fontAwesome: "fa fa-question-circle",
        color: {color: "black"},
        size: {"font-size": "35px"},
        hostname: ["unknown"],
    },
};