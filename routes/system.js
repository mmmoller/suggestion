var express = require('express');
var router = express.Router();
var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');

var User = require('../models/user');
var Suggestion = require('../models/suggestion');

var Category = require('../models/category');
var Icon = require('../models/icon');
var Log = require('../models/log');

var mongoose = require('mongoose');

module.exports = function(passport){

    // System 
    router.get('/delete', function(req, res){
        /*

        mongoose.connection.db.dropDatabase(function (err) {
            console.log('db dropped');
            process.exit(0);
          });
        res.send("Deletado");*/
    });

    router.get('/r', function(req, res){
        /*
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
        */
    });

    router.get('/category', function(req, res){
        Category.remove({}, function(err) { 
            console.log(categories)
            var newCategory = new Category();
            newCategory.categories = categories;
            newCategory.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Categories recreated')
            res.redirect("/");
        });
    });
    
    router.get('/icon', function(req, res){
        Icon.remove({}, function(err) { 
            var newIcon = new Icon();
            newIcon.icons = icons;
            newIcon.save(function (err) {
                if (err) return handleError(err,req,res);
            });
            console.log('Icons recreated')
            res.redirect("/");
        });
    });

    router.get('/log', function(req, res){
        Log.find({}, function(err, logs) { 
            if (err) return handleError(err,req,res);
            res.render("log", {logs: logs})
        });
    });
    
    return router;
}

var categories = {
    "Film" : {
        specificInfo : {
            "Plot" : {type: "textarea"},
            "Genre" : {type: "input", addTag: true},
            "Director" : {type: "input", addTag: true},
            "Country" : {type: "input", addTag: true},
            "Runtime" : {type: "input"},
            "Year" : {type: "input"},
        }
    },
    "Music" : {
        specificInfo : {
            "Type" : {
                type: "select",
                options: ["Music", "Artist", "Album", "Playlist", "Radio"],
                addTag: true,
            },
            "Artist" : {type: "input", addTag: true},
            "Album" : {type: "input", addTag: true},
            "Year" : {type: "input"},
        }
    },
    "Book" : {
        specificInfo : {
            "Type" : {
                type: "select",
                options: ["Book", "Series"],
                addTag: true
            },
            "Author" : {type: "input", addTag: true},
            "Genre" : {type: "input", addTag: true},
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