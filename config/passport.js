var LocalStrategy    = require('passport-local').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var User       = require('../models/user');
var Infosys = require('../models/infosys');

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('message', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('message', 'Oops! Wrong password.'));

                // all is well, return user
                else
                    return done(null, user);
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {

            //  Whether we're signing up or connecting an account, we'll need
            //  to know if the email address is in use.
            User.findOne({'local.email': email}, function(err, existingUser) {

                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if there's already a user with that email
                if (existingUser) 
                    return done(null, false, req.flash('message', 'That email is already taken.'));

                //  If we're logged in, we're connecting a new local account.
                if(req.user) {
                    var user            = req.user;
                    user.local.email    = email;
                    user.local.password = user.generateHash(password);
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                } 
                //  We're not logged in, so we're creating a brand new user.
                else {
                    // create the user
                    var newUser            = new User();

                    newUser.local.email    = email;
                    newUser.local.password = newUser.generateHash(password);

                    Infosys.findOne({}, function(err, infosys){
                        if (err)
                            return done(err);
                        if (infosys){
                            
                            newUser.username = newUser.local.email;
                            infosys.usernames[newUser._id] = newUser.username;
                            infosys.markModified("usernames");
                            infosys.save(function(err){
                                if (err)
                                    return done(err);
                                newUser.save(function(err) {
                                    if (err)
                                        return done(err);
                                    return done(null, newUser);
                                });
                            });

                        }
                        else {
                            console.log("bugou");
                        }
                    });
                }

            });
        });

    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
        clientID        : process.env.CLIENT_ID,
        clientSecret    : process.env.CLIENT_SECRET,
        callbackURL     : process.env.CALLBACK_URL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        return done(null, user);
                        
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = profile.id;
                        newUser.google.token = newUser.generateHash(token);
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                        Infosys.findOne({}, function(err, infosys){
                            if (err)
                                return done(err);
                            if (infosys){
                                
                                newUser.username = profile.displayName;
                                infosys.usernames[newUser._id] = newUser.username;
                                infosys.markModified("usernames");
                                infosys.save(function(err){
                                    if (err)
                                        return done(err);
                                    newUser.save(function(err) {
                                        if (err)
                                            return done(err);
                                        return done(null, newUser);
                                    });
                                });

                            }
                            else {
                                req.flash("message", "!Infosys not created. Contact admin");
                                return done(null, false);
                            }
                        });
                    }
                });

            } else {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        req.flash("message", "!Your google account is already in use.")
                        return done(null, req.user);
                    }
                    else {


                        // user already exists and is logged in, we have to link accounts
                        var user_               = req.user; // pull the user out of the session

                        user_.google.id    = profile.id;
                        user_.google.token = user_.generateHash(token);
                        user_.google.name  = profile.displayName;
                        user_.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                        user_.save(function(err) {
                            if (err)
                                return done(err);
                                
                            return done(null, user_);
                        });
                    }
                });

            }

        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    var fbStrategy = {
        clientID        : process.env.FACEBOOK_CLIENT_ID,
        clientSecret    : process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL     : process.env.FACEBOOK_CALLBACK_URL,
        profileURL      : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        profileFields   : ['id', 'email', 'name'],
        passReqToCallback : true
    }
    passport.use(new FacebookStrategy(fbStrategy,
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                         return done(null, user);

                    } else {
                        // if there is no user, create them
                        var newUser            = new User();

                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = newUser.generateHash(token);
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = profile.emails[0].value;


                        Infosys.findOne({}, function(err, infosys){
                            if (err)
                                return done(err);
                            if (infosys){
                                
                                newUser.username = newUser.facebook.name;
                                infosys.usernames[newUser._id] = newUser.username;
                                infosys.markModified("usernames");
                                infosys.save(function(err){
                                    if (err)
                                        return done(err);
                                    newUser.save(function(err) {
                                        if (err)
                                            return done(err);
                                        return done(null, newUser);
                                    });
                                });

                            }
                            else {
                                req.flash("message", "!Infosys not created. Contact admin");
                                return done(null, false);
                            }
                        });
                    }
                });

            } else {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);


                    if (user) {
                        req.flash("message", "!Your facebook account is already in use.")
                        return done(null, req.user);
                    }
                    else {

                        // user already exists and is logged in, we have to link accounts
                        var user_            = req.user; // pull the user out of the session

                        user_.facebook.id    = profile.id;
                        user_.facebook.token = user_.generateHash(token);
                        user_.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        user_.facebook.email = profile.emails[0].value;

                        user_.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, user_);
                        });
                    }
                });

            }
        });

    }));

};