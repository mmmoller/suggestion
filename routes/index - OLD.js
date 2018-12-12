var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto')

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');
var Teste = require('../models/teste');

module.exports = function(passport){

	//#region /TESTE
	router.get('/a', function(req, res) {
		res.render("teste")
	});

	router.get('/teste', function(req, res) {
		res.render("teste", {data : "dataassa"})
	});

	router.get('/teste2/:token', function(req, res) {

		var user = {id:"10", name:req.params.token, teste: req.body.bbody}
		res.send(user);
	});

	router.post('/teste_post', function(req, res) {
		console.log(req.body.t1)
		//var user = {id:"10", name:"treco", body: req.body.t1, params: req.params.token}
		res.send({t1: req.body.t1, message: "batata"});
	});
	//#endregion

	//#region INDEX/ACCOUNT
	router.get('/', function(req, res) {
		if (req.user){
			res.redirect('/account');
		}
		else{
			res.render('index', {message: req.flash('message')});
		}
	});

	router.get('/forgot_password', function(req, res){
		res.render('forgotpassword', {message: req.flash('message')});
	});

	router.post('/forgot_password', function(req, res, next) {
		async.waterfall([
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
			  		done(err, token);
				});
		  	},
		  	function(token, done) {
				User.findOne({ "local.email" : req.body.email }, function(err, user) {
					if (!user) {
						req.flash('message', '!There is no local account with this email adress.');
						return res.redirect('/forgot_password');
					}
	  
					user.local.resetPasswordToken = token;
					user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour
					user.markModified("local");
			
					user.save(function(err) {
						done(err, token, user);
					});
				});
		  	},
			function(token, user, done) {
				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: process.env.EMAIL,
						pass: process.env.EMAIL_PASS
					}
				});
				var mailOptions = {
					to: user.local.email,
					from: '"GetSuggestion Reset Password Bot" <getsuggestion_forgotpass@gmail.com>',
					subject: 'GetSuggestion Password Reset',
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' + req.headers.host + '/reset/' + token + '\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				transporter.sendMail(mailOptions, function(err) {
					req.flash('message', 'An e-mail has been sent to ' + user.local.email + ' with further instructions.');
					done(err, 'done');
				});
			}
		], function(err) {
			if (err) return next(err);
			res.redirect('/forgot_password');
		});
	});

	router.get('/reset/:token', function(req, res) {
		User.findOne({ "local.resetPasswordToken": req.params.token, "local.resetPasswordExpires": { $gt: Date.now() } }, function(err, user) {
			if (err) return next(err);
			if (!user) {
				
				req.flash('message', '!Password reset token is invalid or has expired.');
				return res.redirect('/forgot_password');

			}
			res.render('resetpassword', { user: req.user });
		});
	});

	router.post('/reset/:token', function(req, res) {
		async.waterfall([ 
			function(done){
				User.findOne({ "local.resetPasswordToken": req.params.token, "local.resetPasswordExpires": { $gt: Date.now() } }, function(err, user) {
					if (!user) {
						console.log(req.params.token)
						req.flash('message', '!Password reset token is invalid or has expired.');
						return res.redirect('back');
					}

					user.local.password = user.generateHash(req.body.new_password);
					user.local.resetPasswordToken = undefined;
					user.local.resetPasswordExpires = undefined;
			
					user.save(function(err) {
						req.logIn(user, function(err) {
							done(err, user);
						});
					});
				});
			}, 
			function(user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: process.env.EMAIL,
						pass: process.env.EMAIL_PASS
					}
				});
				var mailOptions = {
					to: user.local.email,
					from: '"GetSuggestion Reset Password Bot" <getsuggestion_forgotpass@gmail.com>',
					subject: 'Your password has been changed',
					text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.local.email + ' has just been changed.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					req.flash('message', 'Success! Your password has been changed.');
					done(err);
				});
		}], function(err) {
			if (err) return next(err);
			res.redirect('/');
		});
	});

    router.get('/account', isAuthenticated, function(req, res) {
        res.render('account', {
			user : req.user,
			message: req.flash('message')
        });
	});

	router.post('/change_username', isAuthenticated, function(req, res) {

		req.user.username = req.body["username"];
		req.user.save(function (err) {
			if (err) return handleError(err,req,res);
		});

		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){
				infosys.usernames[req.user._id] = req.user.username;
				infosys.markModified("usernames");
				infosys.save(function (err) {
					if (err) return handleError(err,req,res);
				});
			}
			req.flash('message', "Username has been changed");
			res.redirect('/account');
		});

		
	});

	router.post('/change_password', isAuthenticated, function(req, res) {

		if (req.user.validPassword(req.body["old_password"])){
			req.user.local.password = req.user.generateHash(req.body["new_password"])
			req.user.save(function (err) {
				if (err) return handleError(err,req,res);
			});
			req.flash('message', "User password has been changed");
		}
		else{
			req.flash('message', "!Wrong old password!");
		}
		res.redirect('/account');
	});

	router.post('/delete_account', isAuthenticated, function(req, res) {
		if (req.body["username"] == req.user.username){

			User.find({["correlation." + req.user._id]: {$exists: true}}, function(err, users) {
				if (err) return handleError(err,req,res);
				for (var i = 0; i < users.length; i++){
					delete users[i].correlation[req.user._id];
					var indexOf = users[i].friendlist.indexOf(String(req.user._id));
					if (indexOf > -1) users[i].friendlist.splice(indexOf, 1)
					// TODO Test deleting friend from friendlist
					users[i].markModified("correlation");
					users[i].markModified("friendlist");
					users[i].save(function (err) {
						if (err) return handleError(err,req,res);
					});
				}

				Infosys.findOne({}, function(err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){
						delete infosys.usernames[req.user._id];
						infosys.markModified("usernames");
						infosys.save(function (err) {
							if (err) return handleError(err,req,res);
						});
					}

					var query = {$or : [
						{["userRating."+ req.user._id] : {$exists: true}},
						{["userComment."+ req.user._id] : {$exists: true}},
					]}

					Suggestion.find(query, function(err, suggestions){
						if (err) return handleError(err,req,res);
						for (var i = 0; i < suggestions.length; i++){
							delete suggestions[i].userRating[req.user._id];
							delete suggestions[i].userComment[req.user._id];
							suggestions[i].markModified("userRating");
							suggestions[i].markModified("userComment");
							suggestions[i].save(function (err) {
								if (err) return handleError(err,req,res);
							});
						}

						User.findOne({_id: req.user._id}, function(err, user){
							if (err) return handleError(err,req,res);
							if (user){
								user.remove();
								user.save(function (err) {
									if (err) return handleError(err,req,res);
								});
								req.flash('message', "Account has been deleted");
								res.redirect('/logout');
							}
							else{
								req.flash('message', "!User not found");
								res.redirect('/account');
							}
						});
					});

				});

			});
		}
		else{
			req.flash('message', "!Wrong username");
			res.redirect('/account');
		}
		
	});

	//#endregion

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

						//console.log(req.user.correlation);
						//console.log(suggestion)

						//console.log(infosys)
						/*
						var user = {"_id": req.user._id, "correlation": req.user.correlation, "friendlist": req.user.friendlist}
						res.render('suggestionlist', {suggestion: suggestion, infosys: infosys,
							 message: req.flash("message"), bookmark: req.user.bookmark, user: user});*/
						
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
				var category = infosys.types[req.body["type"]].category;

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
						newSuggestion.userRating[req.user._id] = req.body["rating"];
						//newSuggestion.userComment[req.user._id] = req.body["comment"]
						newSuggestion.link[req.body["type"]] = req.body["url"];

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

	router.post('/review_suggestion', isAuthenticated, function(req, res) {

		console.log("Suggestion ID: " + req.body.target_id)
		console.log("Rating: " + req.body.rating)

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
				console.log("my id: " + req.user._id);
				console.log(usersRatedIds)

				if (suggestion.userRating[req.user._id]){
					oldRating = suggestion.userRating[req.user._id]
					usersRatedIds.splice(usersRatedIds.indexOf(String(req.user._id)), 1);
				}

				console.log(usersRatedIds)

				User.find({_id : {$in : usersRatedIds}}, function(err, user){
					if (err) return handleError(err,req,res);
					console.log(user)
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

							/*
							if (!user[i].correlation[req.user._id])
								user[i].correlation[req.user._id] = {};

							if (!user[i].correlation[req.user._id][suggestion.category])
								user[i].correlation[req.user._id][suggestion.category] = {"ratingSum": 0, "ratingCount": 0};

							if (!req.user.correlation[user[i]._id])
								req.user.correlation[user[i]._id] = {};

							if (!req.user.correlation[user[i]._id][suggestion.category])
								req.user.correlation[user[i]._id][suggestion.category] = {"ratingSum": 0, "ratingCount": 0};

							user[i].correlation[req.user._id][suggestion.category].ratingSum
								+= Number(10 - Math.abs(req.body["rating"] - suggestion.userRating[user[i]._id]));
							
							req.user.correlation[user[i]._id][suggestion.category].ratingSum
								+= Number(10 - Math.abs(req.body["rating"] - suggestion.userRating[user[i]._id]));


							if (oldRating != ""){

								user[i].correlation[req.user._id][suggestion.category].ratingSum 
									-= Number(10 - Math.abs(suggestion.userRating[req.user._id] - suggestion.userRating[user[i]._id]))
								
								req.user.correlation[user[i]._id][suggestion.category].ratingSum
									-= Number(10 - Math.abs(suggestion.userRating[req.user._id] - suggestion.userRating[user[i]._id]))
							}

							else {
								user[i].correlation[req.user._id][suggestion.category].ratingCount += 1;

								req.user.correlation[user[i]._id][suggestion.category].ratingCount += 1;
							}*/
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

					
				});

				req.flash('message', "Suggestion sucessfully reviewed");
				res.send({success: true, message:req.flash("message")})
				
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

	// not implemented yet. to edit url
	router.post('/edit_suggestion', isAuthenticated, function(req, res) {
		Suggestion.findOne({_id: req.body["target_id"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){


				req.flash('message', "Suggestion sucessfully reviewed");
				res.redirect(adress);

			}
			else{
				req.flash('message', "!Suggestion doesn't exist");
				res.redirect('/account');
			}
		});
	});

	//#endregion

	//#region USER
	
	router.get('/user/:_id', isAuthenticated, function(req, res) {

		
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

	//#region LOGIN/LOGOUT/SIGNIN 
    // LOGOUT ==============================
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

	//#region LOCAL
	// LOGIN ===============================
	// show the login form
	router.get('/login', function(req, res) {
		res.render('login', { message: req.flash('message') });
	});

	// LOGIN
	router.post('/login', passport.authenticate('local-login', {
		successRedirect : '/account', // redirect to the secure account section
		failureRedirect : '/', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// SIGNIN
	// show the signup form
	router.get('/signup', function(req, res) {
		res.render('signup', { message: req.flash('message') });
	});
	// process the signup form
	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/account', // redirect to the secure account section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// LINKING
	router.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect : '/account', // redirect to the secure profile section
		failureRedirect : '/account', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// UNLINKING
	router.get('/unlink/local', function(req, res) {
		if (req.user.facebook.id || req.user.google.id){
			req.user.local = undefined;
			req.user.save(function(err) {
				if (err) return handleError(err,req,res);
				res.redirect('/account');
			});
		}
		else{
			req.flash("message", "!You should delete your account instead, since you won't have any way to log in again.")
			res.redirect('/account');
		}
	});
	//#endregion

	//#region GOOGLE

	// SIGNIN
	// send to google to do the authentication
	router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
	// the callback after google has authenticated the user
	router.get('/auth/google/callback', passport.authenticate('google', {
		successRedirect : '/account',
		failureRedirect : '/'
	}));

	// LINKING
	// send to google to do the authentication
	router.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));
	// the callback after google has authorized the user
	router.get('/connect/google/callback', passport.authorize('google', {
		successRedirect : '/account',
		failureRedirect : '/account'
	}));

	// UNLINKING
	router.get('/unlink/google', function(req, res) {
		if (req.user.facebook.id || req.user.local.email){
			req.user.google = undefined;
			req.user.save(function(err) {
				if (err) return handleError(err,req,res);
				res.redirect('/account');
			});
		}
		else{
			req.flash("message", "!You should delete your account instead, since you won't have any way to log in again.")
			res.redirect('/account');
		}
	});
	//#endregion

	//#region FACEBOOK

	// SIGNIN
	// send to facebook to do the authentication
	router.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email']}));
	// handle the callback after facebook has authenticated the user
	router.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/account',
			failureRedirect : '/'
		}));

	// LINKING
	// send to facebook to do the authentication
	router.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email']}));
	// handle the callback after facebook has authorized the user
	router.get('/connect/facebook/callback',
		passport.authorize('facebook', {
			successRedirect : '/account',
			failureRedirect : '/account'
		}));
	
	// UNLINKING
	router.get('/unlink/facebook', function(req, res) {
		if (req.user.google.id || req.user.local.email){
			req.user.facebook = undefined;
			req.user.save(function(err) {
				if (err) return handleError(err,req,res);
				res.redirect('/account');
			});
		}
		else{
			req.flash("message", "!You should delete your account instead, since you won't have any way to log in again.")
			res.redirect('/account');
		}
	});
	//#endregion

	//#endregion
	
	router.get('/infosys', function(req, res) {
		var newInfosys = new Infosys();
		newInfosys.usernames = {};
		newInfosys.categories = ["Film", "Music"];
		newInfosys.types = {
			"IMDb" : {
				fontAwesome: "fab fa-imdb",
				color: {color: "goldenrod"},
				size: {"font-size": "35px"},
				category: "Film"
			},
			"YouTube" : {
				fontAwesome: "fab fa-youtube",
				color: {color: "red"},
				size: {"font-size": "35px"},
				category: "Music"
			},
			"Spotify" : {
				fontAwesome: "fab fa-spotify",
				color: {color: "green"},
				size: {"font-size": "35px"},
				category: "Music"
			},
		}

		newInfosys.save(function (err) {
			if (err) return handleError(err,req,res);
			res.send("teste");
		});
	})

	// DELETE
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
		User.remove({}, function(err) { 
			console.log('Users removed')
		});
		Suggestion.remove({}, function(err) { 
			console.log('Suggestions removed')
		});
		Infosys.remove({}, function(err) { 
			console.log('Infosys removed')
			var newInfosys = new Infosys();
			newInfosys.usernames = {};
			newInfosys.categories = ["Film", "Music"];
			newInfosys.types = {
				"IMDb" : {
					fontAwesome: "fab fa-imdb",
					color: {color: "goldenrod"},
					size: {"font-size": "35px"},
					category: "Film"
				},
				"YouTube" : {
					fontAwesome: "fab fa-youtube",
					color: {color: "red"},
					size: {"font-size": "35px"},
					category: "Music"
				},
				"Spotify" : {
					fontAwesome: "fab fa-spotify",
					color: {color: "green"},
					size: {"font-size": "35px"},
					category: "Music"
				},
			}

			newInfosys.save(function (err) {
				if (err) return handleError(err,req,res);
				res.redirect("/");
			});
		});
	});

	return router;
}

{ // Functions


function handleError(err,req,res){
	console.log(err);
	res.send(err);
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

function Title(title){
	return title + " - GetSuggestion";
}


}
