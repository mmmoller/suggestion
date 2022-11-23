var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var expressSession = require('express-session');

var MongoDBStore = require('connect-mongodb-session')(expressSession);

var flash = require('connect-flash');

require('dotenv').config()

//#region Mongo configurations
mongoose.plugin(schema => { schema.options.usePushEach = true });
mongoose.Promise = require('bluebird');

var options = {
	socketTimeoutMS: 30000,
	useNewUrlParser: true,
    useUnifiedTopology: true
};

var dbUri = "mongodb://127.0.0.1/test"
if (process.env.MONGOLAB_URI){
    dbUri = process.env.MONGOLAB_URI;
}

mongoose.connect(dbUri, options);

var store = new MongoDBStore({
    uri: dbUri,
    collection: "expressSession"
});


    
//#endregion

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(__dirname + '/public/img/favicon.ico'));

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended:true}));

//app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use(expressSession({
    secret: 'mySecretKey',
    saveUninitialized: true,
    resave: true,
    store: store,
}));

app.use(passport.initialize());
app.use(passport.session());

// Using momentjs on views.
app.locals.moment = require('moment');

 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
app.use(flash());

// Initialize Passport

require('./config/passport.js')(passport);
/*
var initPassport = require('./config/passport.js')(passport);
initPassport(passport);*/


var routes = require('./routes/index')(passport);
app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

module.exports = app;
