var express = require('express');
var router = express.Router();

var isAuthenticated = require('../functions/isAuthenticated.js');
var isModerator = require('../functions/isModerator.js');
var handleError = require('../functions/handleError.js');

var infoCategory = require('../functions/infoCategory.js');
var infoIcon = require('../functions/infoIcon.js');
var infoUser = require('../functions/infoUser.js');

var toLog = require('../functions/log.js');

var User = require('../models/user');

var Suggestion = require('../models/suggestion');

module.exports = function(passport){

    //#region SUGGESTION

	router.get('/suggestionlist', isAuthenticated, infoCategory, infoIcon, function(req,res){
		SuggestionList(req,res)
	});
	
	router.get('/suggestion/:_id', isAuthenticated, infoCategory, infoIcon, function(req, res) {

		var id = req.params["_id"];

		Suggestion.findOne({_id : id}, function(err, suggestion) {
			if (err) return handleError(err,req,res);

			if (suggestion){
				
				var ownUser = {_id: req.user._id, correlation: req.user.correlation,
					friendlist: req.user.friendlist, bookmark: req.user.bookmark,
					dontshow: req.user.dontshow}
				
				var usersId = []
				for (var id in suggestion.userRating){
					if (suggestion.userRating.hasOwnProperty(id))
						usersId.push(id)
				}
				
				infoUser(true, true, usersId, req, res, function(){

					res.render('suggestion', {suggestion: suggestion, usersId: usersId, 
						message: req.flash("message"), ownUser: ownUser, 
						userPermission: req.user.permission})
				});

			}

			else{
				req.flash('message', "!Suggestion not found");
				res.redirect('/account');
			}
		});
	});

	router.post('/create_suggestion', isAuthenticated, toLog, function(req, res) {

		var name = req.body["name"];
		var category = req.body["category"];

		Suggestion.findOne({$and: [{name: name}, {category: category}]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				res.send({type:"error", message:"Suggestion already exists"});

			}
			else{

				var newSuggestion = new Suggestion();
				newSuggestion.name = name;
				newSuggestion.category = category;
				if (req.body["rating"])
					newSuggestion.userRating[req.user._id] = req.body["rating"];
				if (req.body["link"])
					newSuggestion.link = req.body["link"];
				newSuggestion.extraInfo = req.body["extraInfo"];
				newSuggestion.tag = req.body["tag"]

				console.log(newSuggestion);

				newSuggestion.save(function (err) {
					if (err) return handleError(err,req,res);
				});

				res.send({type:"success", message:"Suggestion successfully created"});
			}
		});
		
	});

	router.post('/edit_suggestion', isModerator, toLog, function(req, res) {
		Suggestion.findOne({_id: req.body["suggestionId"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				suggestion.name = req.body["name"]

				if (req.body["link"]){
					suggestion.link = req.body["link"];
				}
				else{
					suggestion.link = {};
				}
				suggestion.extraInfo = req.body["extraInfo"];
				suggestion.tag = req.body["tag"]

				suggestion.save(function (err) {
					if (err) return handleError(err,req,res);
				});
				
				res.send({type:"success", message:"Suggestion successfully edited"});

			}
			else{
				res.send({type:"error", message:"Suggestion doesn't exist"});
			}
		});
	});

	router.post('/review_suggestion', isAuthenticated, function(req, res) {

		//console.log("Suggestion ID: " + req.body.target_id)
		//console.log("Rating: " + req.body.rating)

		Suggestion.findOne({_id: req.body["target_id"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				var usersRatedIds = [];

				for (var id in suggestion.userRating) {
					if (suggestion.userRating.hasOwnProperty(id)) {
						usersRatedIds.push(id);
					}
				}

				var oldRating = "";
				//console.log("my id: " + req.user._id);
				//console.log(usersRatedIds)

				if (suggestion.userRating[req.user._id]){
					oldRating = suggestion.userRating[req.user._id]
					usersRatedIds.splice(usersRatedIds.indexOf(String(req.user._id)), 1);
				}

				User.find({_id : {$in : usersRatedIds}}, function(err, user){
					if (err) return handleError(err,req,res);
					//console.log(user)
					for (var i = 0; i < user.length; i++){

						if (req.body.rating == ""){

							if (oldRating != ""){
								req.user.correlation[user[i]._id][suggestion.category].ratingSum
									-= Number(10 - Math.abs(suggestion.userRating[req.user._id] - suggestion.userRating[user[i]._id]))
							}

							req.user.correlation[user[i]._id][suggestion.category].ratingCount -= 1;

						}
						else {
							if (!req.user.correlation[user[i]._id]){
								req.user.correlation[user[i]._id] = {};
							}

							if (!req.user.correlation[user[i]._id][suggestion.category]){
								req.user.correlation[user[i]._id][suggestion.category] = {"ratingSum": 0, "ratingCount": 0};
							}

							req.user.correlation[user[i]._id][suggestion.category].ratingSum
								+= Number(10 - Math.abs(req.body["rating"] - suggestion.userRating[user[i]._id]));

							if (oldRating != ""){
								req.user.correlation[user[i]._id][suggestion.category].ratingSum
									-= Number(10 - Math.abs(suggestion.userRating[req.user._id] - suggestion.userRating[user[i]._id]))
							} else {
								req.user.correlation[user[i]._id][suggestion.category].ratingCount += 1;
							}
						}

						if (req.user.correlation[user[i]._id][suggestion.category].ratingCount == 0){
							delete req.user.correlation[user[i]._id][suggestion.category];
							delete user[i].correlation[req.user._id][suggestion.category];
							if (!Object.keys(req.user.correlation[user[i]._id]).length){
								delete req.user.correlation[user[i]._id]
								delete user[i].correlation[req.user._id]
							}
							
						} else {
							user[i].correlation[req.user._id] = req.user.correlation[user[i]._id];
						}

						user[i].markModified("correlation");
						user[i].save(function (err) {
							if (err) return handleError(err,req,res);
						});
					}

					req.user.markModified("correlation")
					req.user.save(function (err) {
						if (err) return handleError(err,req,res);
					});

					if (req.body["rating"] == "")
						delete suggestion.userRating[req.user._id]
					else
						suggestion.userRating[req.user._id] = req.body["rating"]

					suggestion.markModified("userRating");
					suggestion.save(function (err) {
						if (err) return handleError(err,req,res);
					});

					
					req.flash('message', "Suggestion sucessfully reviewed");
					res.send({success: true, message:req.flash("message"),
						ownUserCorrelation: req.user.correlation, suggestionUserRating: suggestion.userRating})

				});
				
			}
			else{
				req.flash('message', "!Suggestion doesn't exist");
				res.send({success: false, message:req.flash("message")})
				//res.redirect('/account');
			}
		});
	});

	// GOTTA IMPLEMENT NOT WORKING, IT'S COPY PASTA FROM REVIEW
	router.post('/delete_suggestion', isModerator, toLog, function(req, res) {

		Suggestion.findOne({_id: req.body["suggestionId"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				var usersId = [];

				var category = suggestion.category;

				for (var id in suggestion.userRating) {
					if (suggestion.userRating.hasOwnProperty(id)) {
						usersId.push(id);
					}
				}

				User.find({_id : {$in : usersId}}, function(err, user){
					if (err) return handleError(err,req,res);

					for (var i = 0; i < user.length; i++){
						for (var j = 0; j < usersId.length; j++){
							if (user[i]._id != usersId[j]){
								user[i].correlation[usersId[j]][category].ratingSum -= 
									Number(10 - Math.abs(suggestion.userRating[user[i]._id] - suggestion.userRating[usersId[j]]))
								user[i].correlation[usersId[j]][category].ratingCount -= 1
								if (user[i].correlation[usersId[j]][category].ratingCount == 0){
									delete user[i].correlation[usersId[j]][category];
									if (!Object.keys(user[i].correlation[usersId[j]]).length){
										delete user[i].correlation[usersId[j]]
									}
								}
							}
						}

						user[i].markModified("correlation");
						user[i].save(function (err) {
							if (err) return handleError(err,req,res);
						});
					}

					suggestion.remove(function (err) {
						if (err) return handleError(err,req,res);
					});

					
					res.send({type:"success", message:"Suggestion successfully deleted"});

				});
				
			}
			else{
				res.send({type:"error", message:"Suggestion doesn't exist"});
			}
		});
	});

	router.get('/bookmarklist', isAuthenticated, infoIcon, function(req,res){
		SuggestionList(req,res)
	});

	router.post('/action_bookmark', isAuthenticated, function(req, res) {

		var target_id = req.body["target_id"];

		var option;

		if (req.user.bookmark.indexOf(String(target_id)) == -1){
			req.user.bookmark.push(target_id);
			option = "fas"
		}
		else{
			req.user.bookmark.splice(req.user.bookmark.indexOf(String(target_id)), 1)
			option = "far"
		}

		req.user.markModified("bookmark")
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
			res.send({option: option})
		});

	});

	router.get('/dontshowlist', isAuthenticated, infoIcon, function(req,res){
		SuggestionList(req,res);
	});

	router.post('/action_dontshow', isAuthenticated, function(req, res) {

		var target_id = req.body["target_id"];

		var option;

		if (req.user.dontshow.indexOf(String(target_id)) == -1){
			req.user.dontshow.push(target_id);
			option = "fa-eye"
		}
		else if (req.user.dontshow.indexOf(String(target_id)) > -1){
			req.user.dontshow.splice(req.user.dontshow.indexOf(String(target_id)), 1)
			option = "fa-eye-slash"
		}
		else
			option = ""

		req.user.markModified("dontshow")
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
			res.send({option: option})
		});

	});

	//#endregion

    return router;
}

function SuggestionList(req, res){
	
	var mainQuery = MainQuery(req)
	var categoryQuery = CategoryQuery(req)
	
	var query = {$and: [
		mainQuery,
		categoryQuery,
	]}

	var showCreateSuggestion = false;
	if (req.query["search_name"] != undefined){
		showCreateSuggestion = true;
	}


	Suggestion.find(query, function (err, suggestion){
		if (err) return handleError(err,req,res);
		if (suggestion){
			
			// Usar ratings e coeficientes

			var ownUser = {_id: req.user._id, correlation: req.user.correlation,
				friendlist: req.user.friendlist, bookmark: req.user.bookmark,
				dontshow: req.user.dontshow}

			res.render('suggestionlist', {suggestion: suggestion, 
				message: req.flash("message"), ownUser: ownUser, showCreateSuggestion: showCreateSuggestion})
		
		}
		else{
			req.flash('message', "!Suggestion don't exist");
			res.redirect('/account');
		}
	});
}

function CategoryQuery (req){
	var categoryQuery = (req.user.category == "All") ? {} : {"category" : req.user.category}
	return categoryQuery
}

function MainQuery(req){
	var mainQuery = {};
	if (req.path == "/suggestionlist"){
		// SEARCHING
		if (req.query["search_name"] != undefined){
			if (req.query["search_name"] == ""){
				mainQuery = {}
			}
			else {
				
				var split = req.query["search_name"].split(/[\s\p{P}]+/)
				regex = split.map(function (e) { return new RegExp(e, "i"); });

				console.log(regex)

				mainQuery = {$or: [
					{'name': {'$regex': req.query["search_name"], "$options": "i"}},
					{'tag': { $all: regex }}
				]}
			}
		}
		// DISCOVER NEW
		else {
			mainQuery = {$and: [
				{ ["userRating." + req.user._id] : {$exists: false} },
				{"_id" : {$nin: req.user.dontshow}}
			]}
		}
	}
	else if (req.path == "/bookmarklist"){
		mainQuery = {_id : {$in : req.user.bookmark}}
	}
	else if (req.path == "/dontshowlist"){
		mainQuery = {_id : {$in : req.user.dontshow}}
	}

	return mainQuery
}