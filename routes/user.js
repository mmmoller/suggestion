var express = require('express');
var router = express.Router();
var isAdmin = require('../functions/isAdmin.js');
var isAuthenticated = require('../functions/isAuthenticated.js');
var isAuthenticatedWithRedirect = require('../functions/isAuthenticatedWithRedirect.js');
var handleError = require('../functions/handleError.js');

var infoCategory = require('../functions/infoCategory.js');
var infoIcon = require('../functions/infoIcon.js');
var infoUser = require('../functions/infoUser.js');

var User = require('../models/user');
var Suggestion = require('../models/suggestion');

module.exports = function(passport){


    //#region USER
	router.get('/user/:_id', isAuthenticatedWithRedirect, infoIcon, infoCategory, function(req, res) {

		var id = req.params["_id"];
		var categoryQuery = (req.user.category == "All") ? {} : {"category" : req.user.category}
		var mainQuery = {["userRating." + id] : {$exists: true}}
		var query = {$and: [
			mainQuery,
			categoryQuery,
		]}

		Suggestion.find(query, function(err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){


				var ownUser = {_id: req.user._id, correlation: req.user.correlation,
					friendlist: req.user.friendlist, bookmark: req.user.bookmark,
					dontshow: req.user.dontshow}
				
				var usersId = [id]

				infoUser(true, true, usersId, req, res, function(users){

					console.log(users)
					var userDescription = users[0].description;
					var userUrl = users[0].url

					res.render('user', {usersId: usersId, ownUser: ownUser, 
						suggestion: suggestion, message: req.flash("message"), 
						ownPermission: req.user.permission, 
						userDescription: userDescription, userUrl: userUrl});
				});

			}
			else{
				req.flash('message', "!Suggestions does not exist! Contact Admin");
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

	router.get('/userlist', isAuthenticated, infoCategory, function(req, res) {
		var name = req.query["search_name"];
		User.find({$or: [
			{'username': {'$regex': name, "$options": "i"}},
			{'local.email': {'$regex': name, "$options": "i"}},
			{'google.email': {'$regex': name, "$options": "i"}}
		] }, function(err, users) {
			if (err) return handleError(err,req,res);
			if (users){

				var usersId = []
				for (var i = 0; i < users.length; i++){
					usersId.push(String(users[i]._id))
				}

				var ownUser = {_id: req.user._id, correlation: req.user.correlation,
					friendlist: req.user.friendlist, bookmark: req.user.bookmark}

				infoUser(true, true, usersId, req, res, function(){
					
					res.render('userlist', {ownUser: ownUser, usersId: usersId, 
						message: req.flash("message"), userPermission: req.user.permission})
						
				});

			}
			else{
				req.flash('message', "!No users found.");
				res.redirect('/account');
			}
		});
	});

	router.get('/friendlist', isAuthenticated, function(req, res){

		var usersId = [];

		for (var i = 0; i < req.user.friendlist.length; i++) {
			usersId.push(req.user.friendlist[i])
		}

		var ownUser = {_id: req.user._id, correlation: req.user.correlation,
			friendlist: req.user.friendlist, bookmark: req.user.bookmark}
		
		infoUser(true, true, usersId, req, res, function(){
			
			res.render('userlist', {ownUser: ownUser, usersId: usersId, 
				message: req.flash("message"), userPermission: req.user.permission})
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

	router.post('/own_category', isAuthenticated, function(req, res){

		req.user.category = req.body["category"]
		req.user.markModified("category");
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
		});

		res.send({success: "success"})

	});

	router.post('/own_description', isAuthenticated, function(req, res){

		req.user.description = req.body["description"]
		req.user.markModified("description");
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
		});

		res.send({message: "Description successfully updated!"})

	});

	router.post('/own_url', isAuthenticated, function(req, res){

		req.user.url = req.body["url"]
		req.user.markModified("url");
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
		});

		res.send({message: "Url successfully updated!"})

	});

	router.post('/user_permission', isAdmin, function(req, res){
		User.findOne({_id : req.body["userId"]}, function(err, user){
			if (err) return handleError(err,req,res);
			if (user){
				user.permission = req.body["permission"]
				user.save(function (err) {
					if (err) return handleError(err,req,res);
				});
				res.send({success: "Success"})
			}
			else{
				res.send({})
			}
		})
	});

	//#endregion



    return router;
}