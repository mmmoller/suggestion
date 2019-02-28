var express = require('express');
var router = express.Router();
//var isAuthenticated = require('../functions/isAuthenticated.js');
var handleError = require('../functions/handleError.js');


module.exports = function(passport){

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
    
    return router;
}