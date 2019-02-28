var express = require('express');
var router = express.Router();
var isAuthenticated = require('../functions/isAuthenticated.js');
var isAuthenticatedWithRedirect = require('../functions/isAuthenticatedWithRedirect.js');
var handleError = require('../functions/handleError.js');

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');

module.exports = function(passport){


    //#region USER
	router.get('/user/:_id', isAuthenticatedWithRedirect, function(req, res) {

		
		var id = req.params["_id"];

		/*
		var option = "Add";
		if (req.user.friendlist.indexOf(id) > -1){
			option = "Remove";
		}


		if (id == req.user._id){
			option = ""
		}

		console.log(id)*/

		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){

				Suggestion.find({["userRating." + id] : {$exists: true} }, function(err, suggestion){
					if (err) return handleError(err,req,res);
					if (suggestion){

						/*
						var correlation = {}
						if (req.user.correlation[id])
							correlation = req.user.correlation[id];
						var user = {_id : id, name: infosys.usernames[id], correlation: correlation}
						console.log(user);*/

						var ownUser = {_id: req.user._id, correlation: req.user.correlation,
							friendlist: req.user.friendlist, bookmark: req.user.bookmark}
						
						var usersId = [id]


						res.render('user', {usersId: usersId, ownUser: ownUser,
							 suggestion: suggestion, infosys: infosys, message: req.flash("message")});

					}
					else{
						req.flash('message', "!Suggestions does not exist! Contact Admin");
						res.redirect("/account")
					}
				});
			}
			else {
				req.flash('message', "!Infosys does not exist! Contact Admin");
				res.redirect("/account")
			}
		});
	});

	// IMPLEMENT
	router.get('/user_external/:_id', function(req, res){
		res.send("funcionou")
	});

	router.get('/myuser', isAuthenticated, function(req, res) {
		console.log(req.user.correlation)
		res.redirect('/user/' + req.user._id);
	});

	router.get('/userlist', isAuthenticated, function(req, res) {
		var name = req.query["search_name"];
		User.find({$or: [
			{'username': {'$regex': name, "$options": "i"}},
			{'local.email': {'$regex': name, "$options": "i"}},
			{'google.email': {'$regex': name, "$options": "i"}}
		] }, function(err, users) {
			if (err) return handleError(err,req,res);
			if (users){

				/*
				var user = [];
				var user_name;
				var user_button;
				
				for (var i = 0; i < users.length; i++){
					if (String(users[i]._id) != String(req.user._id)){
						user_name = users[i].username;
						if (req.user.friendlist.indexOf(users[i]._id) > -1){
							user_button = "Remove";
						}
						else {
							user_button = "Add";
						}
						user.push({"username": user_name, "action": user_button, "_id": users[i].id})
					}
					
				}*/

				var usersId = []
				for (var i = 0; i < users.length; i++){
					usersId.push(String(users[i]._id))
				}


				Infosys.findOne({}, function(err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){

						var ownUser = {_id: req.user._id, correlation: req.user.correlation,
							friendlist: req.user.friendlist, bookmark: req.user.bookmark}

						res.render('userlist', {ownUser: ownUser, usersId: usersId, 
							infosys:infosys, message: req.flash("message")})
					}
					else {
						req.flash('message', "!Infosys does not exist! Contact Admin");
						res.redirect("/account")
					}
				});

			}
			else{
				req.flash('message', "!No users found.");
				res.redirect('/account');
			}
		});
	});

	router.get('/friendlist', isAuthenticated, function(req, res){

		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){
				
				var usersId = [];

				for (var i = 0; i < req.user.friendlist.length; i++) {
					usersId.push(req.user.friendlist[i])
				}

				var ownUser = {_id: req.user._id, correlation: req.user.correlation,
					friendlist: req.user.friendlist, bookmark: req.user.bookmark}
				

				res.render('userlist', {ownUser: ownUser, usersId: usersId,
					infosys:infosys, message: req.flash("message")})
			}
			else {
				req.flash('message', "!Infosys does not exist! Contact Admin");
				res.redirect("/account")
			}
		});

	});

	router.post('/action_friend', isAuthenticated, function(req, res){

		var target_id = req.body["target_id"];
		var option;

		if (req.user.friendlist.indexOf(target_id) == -1){
			req.user.friendlist.push(target_id)
			option = "fa-user-minus"
			req.flash('message', "User added sucessfully.");
		}
		else{
			req.user.friendlist.splice(req.user.friendlist.indexOf(target_id), 1)
			option = "fa-user-plus"
			req.flash('message', "User removed sucessfully.");
		}

		req.user.markModified("friendlist");
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
		});

		res.send({message: req.flash("message"), option: option})

	});
	//#endregion



    return router;
}