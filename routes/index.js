var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var moment = require('moment');
var nodemailer = require('nodemailer');

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');
var Teste = require('../models/teste');

module.exports = function(passport){


	// /TESTE
	router.get('/teste', function(req, res) {
		if(req.user.google.token){
			res.send("banana")
		}
		else{
		console.log(req.user)
		res.send("done");
		}
	});

	//#region INDEX/ACCOUNT
	router.get('/', function(req, res) {
		if (req.user){
			res.redirect('/account');
		}
		else{
			res.render('index', {message: req.flash('message')});
		}
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

	router.post('/delete_account', isAuthenticated, function(req, res) {
		if (req.body["username"] == req.user.username){

			User.find({["correlation." + req.user._id]: {$exists: true}}, function(err, users) {
				if (err) return handleError(err,req,res);
				for (var i = 0; i < users.length; i++){
					delete users[i].correlation[req.user._id];
					users[i].markModified("correlation");
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

					Suggestion.find({["grades." + req.user._id] : {$exists: true} }, function(err, suggestions){
						if (err) return handleError(err,req,res);
						for (var i = 0; i < suggestions.length; i++){
							delete suggestions[i].userinfo[req.user._id];
							suggestions[i].markModified("userinfo");
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

		var query = {["userinfo." + req.user._id] : {$exists: false}}
		var adress = "/suggestionlist"

		if (req.query["search_name"]){
			query = {$or: [
				{'name': {'$regex': req.query["search_name"], "$options": "i"}},
				{'tag': {'$regex': req.query["search_name"], "$options": "i"}}
			]}
			adress = '/suggestionlist?search_name=' + req.query["search_name"];
		}

		Suggestion.find(query, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){
				
				Infosys.findOne({}, function (err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){
						// Usar grades e coeficientes
						res.render('suggestionlist', {suggestion: suggestion, infosys: infosys,
							 message: req.flash("message"), adress: adress});
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
	
	router.get('/suggestion', isAuthenticated, function(req, res) {

		var id = req.query["_id"];

		Suggestion.findOne({_id : id}, function(err, suggestion) {
			if (err) return handleError(err,req,res);

			if (suggestion){
				Infosys.findOne({}, function (err, infosys){
					if (err) return handleError(err,req,res);
					if (infosys){
						// Usar grades e coeficientes

						res.render('suggestion', {suggestion: suggestion, infosys: infosys,
							message: req.flash("message"), adress: adress})
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
				var adress = '/suggestionlist';
				if (req.body["adress"])
					adress = req.body["adress"]

				Suggestion.findOne({$and: [{name: name}, {category: category}]}, function (err, suggestion){
					if (err) return handleError(err,req,res);
					if (suggestion){
						req.flash('message', "!Suggestion already exists");
						res.redirect('/account');
					}
					else{
						var newSuggestion = new Suggestion();
						newSuggestion.name = name;
						newSuggestion.category = category
						newSuggestion.userinfo[req.user._id] = {"grade": req.body["grade"], "comment": req.body["comment"]}
						newSuggestion.link[req.body["type"]] = req.body["url"];

						console.log(newSuggestion);

						newSuggestion.save(function (err) {
							if (err) return handleError(err,req,res);
						});

						req.flash('message', "Suggestion sucessfully created");
						res.redirect(adress);
					}
				});
		
			}	
			else{
				req.flash('message', "!Infosys don't exist");
				res.redirect('/account');
			}
		});
	});

	router.post('/review_suggestion', isAuthenticated, function(req, res) {
		Suggestion.findOne({_id: req.body["target_id"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				var id_array = [];

				for (var id in suggestion.userinfo) {
					if (suggestion.userinfo.hasOwnProperty(id)) {
						id_array.push(id);
					}
				}

				var old_grade = undefined;
				console.log("my id: " + req.user_id);
				console.log(id_array)
				if (suggestion.userinfo[req.user._id]){
					old_grade = suggestion.userinfo[req.user._id].grade
					id_array.splice(id_array.indexOf(req.user_id, 1));
				}
				console.log(id_array)

				// Tomar cuidado para não puxar eu mesmo (caso eu já tenho dado review antes,
				// preciso me tirar desse id_array)

				User.find({_id : {$in : id_array}}, function(err, user){
					if (err) return handleError(err,req,res);
					for (var i = 0; i < user.length; i++){

						if (!user[i].correlation[req.user._id])
							user[i].correlation[req.user._id] = {};
						if (!user[i].correlation[req.user._id][suggestion.category])
							user[i].correlation[req.user._id][suggestion.category] = {"gradeSum": 0, "gradeCount": 0};
						if (!req.user.correlation[user[i]._id])
							req.user.correlation[user[i]._id] = {};
						if (!req.user.correlation[user[i]._id][suggestion.category])
							req.user.correlation[user[i]._id][suggestion.category] = {"gradeSum": 0, "gradeCount": 0};

						user[i].correlation[req.user._id][suggestion.category].gradeSum
							+= Number(10 - Math.abs(req.body["grade"] - suggestion.userinfo[user[i]._id].grade));
						
						req.user.correlation[user[i]._id][suggestion.category].gradeSum
							+= Number(10 - Math.abs(req.body["grade"] - suggestion.userinfo[user[i]._id].grade));


						if (old_grade != undefined){
							user[i].correlation[req.user._id][suggestion.category].gradeSum 
								-= Number(10 - Math.abs(suggestion.userinfo[req.user._id].grade - suggestion.userinfo[user[i]._id].grade))
							
							req.user.correlation[user[i]._id][suggestion.category].gradeSum
								-= Number(10 - Math.abs(suggestion.userinfo[req.user._id].grade - suggestion.userinfo[user[i]._id].grade))
						}
						else {
							user[i].correlation[req.user._id][suggestion.category].gradeCount += 1;

							req.user.correlation[user[i]._id][suggestion.category].gradeCount += 1;
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

					suggestion.userinfo[req.user._id] = {"grade": req.body["grade"], "comment": req.body["comment"]}
					suggestion.markModified("userinfo");
					suggestion.save(function (err) {
						if (err) return handleError(err,req,res);
					});

					var adress = '/suggestionlist';
					if (req.body["adress"])
						adress = req.body["adress"]

					req.flash('message', "Suggestion sucessfully reviewed");
					res.redirect(adress);


				});

				
				
			}
			else{
				req.flash('message', "!Suggestion doesn't exist");
				res.redirect('/account');
			}
		});
	});

	// not implemented yet. to edit url
	router.post('/edit_suggestion', isAuthenticated, function(req, res) {
		Suggestion.findOne({_id: req.body["target_id"]}, function (err, suggestion){
			if (err) return handleError(err,req,res);
			if (suggestion){

				var adress = '/suggestionlist';
				if (req.body["adress"])
					adress = req.body["adress"]

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
	router.get('/userlist', isAuthenticated, function(req, res) {
		var name = req.query["search_name"];
		User.find({$or: [
			{'username': {'$regex': name, "$options": "i"}},
			{'local.email': {'$regex': name, "$options": "i"}},
			{'google.email': {'$regex': name, "$options": "i"}}
		] }, function(err, users) {
			if (err) return handleError(err,req,res);
			if (users){
				var user = [];
				var user_name;
				var user_button;
				
				for (var i = 0; i < users.length; i++){
					if (String(users[i]._id) != String(req.user._id)){
						user_name = users[i].username;
						if (req.user.correlation[users[i]._id]){
							if (req.user.correlation[users[i]._id].isFriend){
								user_button = "Remove";
							}
							else{
								user_button = "Add";
							}
						}
						else {
							user_button = "Add";
						}
						user.push({"username": user_name, "button": user_button, "_id": users[i].id})
					}
					
				}
				res.render('userlist', {user: user, message: req.flash("message"), adress: name})
			}
			else{
				req.flash('message', "!No users found.");
				res.redirect('/account');
			}
		});
	});

	router.get('/user', isAuthenticated, function(req, res) {

		
		var id = req.query["_id"];

		var option = "Remove";
		if (!req.user.correlation[id] || !req.user.correlation[id].isFriend){
			option = "Add";
		}


		if (String(id) == String(req.user._id)){
			option = ""
		}

		console.log(id)

		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){

				Suggestion.find({["userinfo." + id] : {$exists: true} }, function(err, suggestion){
					if (err) return handleError(err,req,res);
					if (suggestion){

						var correlation = {}
						if (req.user.correlation[id])
							correlation = req.user.correlation[id];
						var user = {_id : id, name: infosys.usernames[id], correlation: correlation}
						console.log(user);
						res.render('user', {user: user, option: option,
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
		res.redirect('/user?_id=' + req.user._id);
	});

	router.post('/add_friend', isAuthenticated, function(req, res){

		var target_id = req.body["target_id"];
		if (!req.user.correlation[target_id]){
			req.user.correlation[target_id] = {};
		}
		
		if (!req.user.correlation[target_id].isFriend){
			req.user.correlation[target_id].isFriend = true;
			req.user.markModified("correlation");
			req.user.save(function (err) {
				if (err) return handleError(err,req,res);
			});
			req.flash('message', "User added sucessfully.");
			
		}
		else{
			req.flash('message', "!User is aleady added.");
		}

		var adress = '/friendlist';
		if (req.body["adress"])
			adress = req.body["adress"]

		res.redirect(adress)

	});

	router.post('/remove_friend', isAuthenticated, function(req, res){

		var target_id = req.body["target_id"];
		if (req.user.correlation[target_id] && req.user.correlation[target_id].isFriend){
			req.user.correlation[target_id].isFriend = false;
			req.user.markModified("correlation");
			req.user.save(function (err) {
				if (err) return handleError(err,req,res);
			});
			req.flash('message', "User removed sucessfully.");
			
		}
		else{
			req.flash('message', "!User is not related.");
		}

		var adress = '/friendlist';
		if (req.body["adress"])
			adress = req.body["adress"]

		res.redirect(adress)

	});

	router.get('/friendlist', isAuthenticated, function(req, res){

		var user = [];
		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){
				for (var id in req.user.correlation) {
					if (req.user.correlation.hasOwnProperty(id)) {
						if (req.user.correlation[id] && req.user.correlation[id].isFriend)
							user.push({"username" : infosys.usernames[id], "_id": id})
					}
				}
				res.render('friendlist', {user: user, message: req.flash("message")})
			}
			else {
				req.flash('message', "!Infosys does not exist! Contact Admin");
				res.redirect("/account")
			}
		});

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


}
