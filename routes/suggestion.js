var express = require('express');
var router = express.Router();

var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');

module.exports = function(passport){

    //#region SUGGESTION

	router.get('/suggestionlist', isAuthenticated, function(req,res){

		var query = {$and: [
			{ ["userRating." + req.user._id] : {$exists: false} },
			{"_id" : {$nin: req.user.dontshow}}
		]}

		if (req.query["search_name"]){
			query = {$or: [
				{'name': {'$regex': req.query["search_name"], "$options": "i"}},
				{'tag': {'$regex': req.query["search_name"], "$options": "i"}}
			]}
		}
		if (req.query["search_name"] == ""){
			query = {}
		}

		Suggestion.find(query, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){
				
				Infosys.findOne({}, function (err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){
						// Usar ratings e coeficientes

						var ownUser = {_id: req.user._id, correlation: req.user.correlation,
							friendlist: req.user.friendlist, bookmark: req.user.bookmark}

						res.render('suggestionlist', {suggestion: suggestion, infosys: infosys,
							message: req.flash("message"), ownUser: ownUser})
					}
					else{
						req.flash('message', "!Infosys don't exist");
						res.redirect('/account');
					}
				});
			}
			else{
				req.flash('message', "!Suggestion don't exist");
				res.redirect('/account');
			}
		});

	

	});
	
	router.get('/suggestion/:_id', isAuthenticated, function(req, res) {

		var id = req.params["_id"];

		Suggestion.findOne({_id : id}, function(err, suggestion) {
			if (err) return handleError(err,req,res);

			if (suggestion){
				Infosys.findOne({}, function (err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){

						var ownUser = {_id: req.user._id, correlation: req.user.correlation,
							friendlist: req.user.friendlist, bookmark: req.user.bookmark}

						var usersId = [];


						res.render('suggestion', {suggestion: suggestion, infosys: infosys,
							message: req.flash("message"), ownUser: ownUser})
					}
					else{
						req.flash('message', "!Infosys don't exist");
						res.redirect('/account');
					}
				});
			}

			else{
				req.flash('message', "!Suggestion not found");
				res.redirect('/account');
			}
		});
	});

	router.post('/create_suggestion', isAuthenticated, function(req, res) {

		Infosys.findOne({}, function (err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){

				var name = req.body["name"];
				var category = req.body["category"];

				Suggestion.findOne({$and: [{name: name}, {category: category}]}, function (err, suggestion){
					if (err) return handleError(err,req,res);
					if (suggestion){
						req.flash('message', "!Suggestion already exists");
						res.send({success:false, message:req.flash("message")});
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

						console.log(newSuggestion);

						newSuggestion.save(function (err) {
							if (err) return handleError(err,req,res);
						});

						req.flash('message', "Suggestion successfully created");
						res.send({success:true, message:req.flash("message")});
					}
				});
		
			}	
			else{
				req.flash('message', "!Infosys don't exist");
				res.send({success:false, message:req.flash("message")});
			}
		});
	});

	router.post('/edit_suggestion', isAuthenticated, function(req, res) {
		Suggestion.findOne({_id: req.body["suggestionId"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				if (req.body["link"]){
					suggestion.link = req.body["link"];
				}
				else{
					suggestion.link = {};
				}

				suggestion.save(function (err) {
					if (err) return handleError(err,req,res);
				});
				
				req.flash('message', "Suggestion successfully edited");
				res.send({success:true, message:req.flash("message")});

			}
			else{
				req.flash('message', "!Suggestion doesn't exist");
				res.send({success:false, message:req.flash("message")});
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

	router.get('/bookmarklist', isAuthenticated, function(req,res){
		Suggestion.find({_id : {$in : req.user.bookmark}}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){
				
				Infosys.findOne({}, function (err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){

						//var user = {"_id": req.user._id, "correlation": req.user.correlation, "friendlist": req.user.friendlist}
						
						var ownUser = {_id: req.user._id, correlation: req.user.correlation,
							friendlist: req.user.friendlist, bookmark: req.user.bookmark}
						
						res.render('suggestionlist', {suggestion: suggestion, infosys: infosys,
								message: req.flash("message"), ownUser: ownUser});
					}
					else{
						req.flash('message', "!Infosys don't exist");
						res.redirect('/account');
					}
				});
			}
			else{
				req.flash('message', "!Suggestion don't exist");
				res.redirect('/account');
			}
		});
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

	router.get('/dontshowlist', isAuthenticated, function(req,res){
		console.log(req.user)
		Suggestion.find({_id : {$in : req.user.dontshow}}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){
				
				Infosys.findOne({}, function (err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){

						//var user = {"_id": req.user._id, "correlation": req.user.correlation, "friendlist": req.user.friendlist}
						
						var ownUser = {_id: req.user._id, correlation: req.user.correlation,
							friendlist: req.user.friendlist, bookmark: req.user.bookmark}
						
						res.render('suggestionlist', {suggestion: suggestion, infosys: infosys,
								message: req.flash("message"), ownUser: ownUser});
					}
					else{
						req.flash('message', "!Infosys don't exist");
						res.redirect('/account');
					}
				});
			}
			else{
				req.flash('message', "!Suggestion don't exist");
				res.redirect('/account');
			}
		});
	});

	router.post('/action_dontshow', isAuthenticated, function(req, res) {

		var target_id = req.body["target_id"];

		var option;

		if (req.user.dontshow.indexOf(String(target_id)) == -1){
			req.user.dontshow.push(target_id);
			option = "fas fa-times"
		}
		else if (req.user.dontshow.indexOf(String(target_id)) > -1){
			req.user.dontshow.splice(req.user.dontshow.indexOf(String(target_id)), 1)
			option = "fas fa-plus"
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