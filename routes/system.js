var express = require('express');
var router = express.Router();
var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');

var User = require('../models/user');
var Suggestion = require('../models/suggestion');

var Category = require('../models/category');
var Icon = require('../models/icon');

var mongoose = require('mongoose');

module.exports = function(passport){

    // System 

    router.get('/delete', function(req, res){
        //mongoose.connection.collections['User'].drop( function(err) {
       //     console.log('collection dropped');
        //});

        mongoose.connection.db.dropDatabase(function (err) {
            console.log('db dropped');
            process.exit(0);
          });
        res.send("Deletado");
    });

    router.get('/r', function(req, res){
        
        mongoose.connection.db.dropDatabase(function (err) {
            var newCategory = new Category();
            newCategory.categories = categories;
            newCategory.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Categories recreated')

            var newIcon = new Icon();
            newIcon.icons = icons;
            newIcon.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Icons recreated')

            console.log('Users removed')
            var newUser = new User();
            newUser.local.email = "admin";
            newUser.local.password = newUser.generateHash("admin");
            newUser.username = "admin"
            newUser.permission = 2;

            newUser.save(function(err) {
                if (err) return handleError(err,req,res);
                res.redirect("/");
            });
        });

        /*
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


        User.remove({}, function(err) { 

            console.log('Users removed')
            var newUser = new User();
            newUser.local.email = "admin";
            newUser.local.password = newUser.generateHash("admin");
            newUser.username = "admin"
            newUser.permission = 2;

            

            newUser.save(function(err) {
                if (err) return handleError(err,req,res);
                res.redirect("/");
            });

        });*/
            
    });

    router.get('/category', function(req, res){
        Category.remove({}, function(err) { 
            var newCategory = new Category();
            newCategory.categories = categories;
            newCategory.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Categories recreated')
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
            "Country" : {type: "input"},
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