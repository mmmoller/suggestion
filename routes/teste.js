var express = require('express');
var router = express.Router();

var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');
var isModerator = require('../functions/isModerator.js');

var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto')

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');
var Teste = require ('../models/teste')

module.exports = function(passport){

	//#region /TESTE

	router.get('/testeclean', function(req, res){
		Teste.remove({}, function(err) {
            console.log('Users removed')
		})
		res.send("removed")
	});

	router.get('/t', function(req, res){
		var teste1 = new Teste();
		teste1.t3 = {"banana" : "abacate"}
		teste1.save(function(err) {
		});

		res.send("feito")
	});

	router.get('/teste', function(req, res){
		res.render("teste", {})
	});

	router.get('/teste1', function(req, res){
		Teste.find({}, function(err, teste){
			for (var i = 0; i < teste.length; i++){
				teste[i].t5 = "IGUAL"
				teste[i].save(function(err) {
				});
			}
			console.log(teste)
			res.send(teste)
		});
		
	});
	
	router.get('/a', function(req, res) {

		var newInfosys = new Infosys();
		newInfosys.usernames = {};

		newInfosys.categories = ["Film", "Music"];
		newInfosys.types = {
			"Icon" : {
				fontAwesome: "fas fa-question-circle",
				color: {color: "black"},
				size: {"font-size": "35px"},
				category: ["Film", "Music"]
			},
			"IMDb" : {
				fontAwesome: "fab fa-imdb",
				color: {color: "goldenrod"},
				size: {"font-size": "35px"},
				category: ["Film"]
			},
			"YouTube" : {
				fontAwesome: "fab fa-youtube",
				color: {color: "red"},
				size: {"font-size": "35px"},
				category: ["Film", "Music"]
			},
			"Spotify" : {
				fontAwesome: "fab fa-spotify",
				color: {color: "green"},
				size: {"font-size": "35px"},
				category: ["Music"]
			},
		}

		res.render("teste3", {infosys:newInfosys})
	});

	router.get('/b', function(req, res) {

		var newInfosys = new Infosys();
		newInfosys.usernames = {};

		newInfosys.categories = ["Film", "Music"];
		newInfosys.types = {
			"Icon" : {
				fontAwesome: "fas fa-question-circle",
				color: {color: "black"},
				size: {"font-size": "35px"},
				category: ["Film", "Music"]
			},
			"IMDb" : {
				fontAwesome: "fab fa-imdb",
				color: {color: "goldenrod"},
				size: {"font-size": "35px"},
				category: ["Film"]
			},
			"YouTube" : {
				fontAwesome: "fab fa-youtube",
				color: {color: "red"},
				size: {"font-size": "35px"},
				category: ["Film", "Music"]
			},
			"Spotify" : {
				fontAwesome: "fab fa-spotify",
				color: {color: "green"},
				size: {"font-size": "35px"},
				category: ["Music"]
			},
		}

		var newSuggestion = new Suggestion();
		newSuggestion.name = "Nome";
		newSuggestion.category = "Film";
		newSuggestion.userRating["eu"] = 10;
		newSuggestion.link = { "www.youtube.com" : "Youtube" }

		res.render("teste2", {infosys:newInfosys, suggestion:newSuggestion})
	});

	router.get('/teste2', function(req, res) {

		res.render("teste2")
	});

	router.get('/teste3', function(req, res) {
		res.render("teste3")
	});

	router.post('/teste3', function(req, res) {

		var newSuggestion = new Suggestion();
		newSuggestion.name = req.body["name"];
		newSuggestion.category = req.body["category"];
		if (req.body["rating"])
			newSuggestion.userRating["eu"] = req.body["rating"];
		if (req.body["link"])
			newSuggestion.link = req.body["link"]

		res.send({message: "success", success: "success"})
	});

	//#endregion

    return router;

}