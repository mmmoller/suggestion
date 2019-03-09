var express = require('express');
var router = express.Router();

var isTeste = require('../functions/infoCategory.js');

var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');
var isModerator = require('../functions/isModerator.js');

var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto')

var User = require('../models/user');
var Suggestion = require('../models/suggestion');
var Teste = require ('../models/teste')

module.exports = function(passport){

	//#region /TESTE

	router.get('/teste', function(req, res){
		res.render("teste", {})
	});

	router.post('/teste', function(req, res){
		console.log("BANANA")
		//res.render("teste", {})
		res.redirect("/teste")
	});

	router.get('/targetUserId/:_id', function(req, res){
		console.log(req.query)
		res.send(req.query)
	});

	router.get('/testeclean', function(req, res){
		Teste.remove({}, function(err) {
            console.log('Users removed')
		})
		res.send("removed")
	});

	router.get('/rating', function(req, res){
		res.render("ratingColourPallet")
	});
	
	//#endregion

    return router;

}