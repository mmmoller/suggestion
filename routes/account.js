var express = require('express');
var router = express.Router();
var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');

var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto')

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Suggestion = require('../models/suggestion');

module.exports = function(passport){

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

    return router;
}