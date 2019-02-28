var express = require('express');
var router = express.Router();

module.exports = function(passport){

	var testeRelatedRouter = require('./teste.js')(passport);
	router.use('/', testeRelatedRouter);

	var accountRelatedRouter = require('./account')(passport);
	router.use('/', accountRelatedRouter);

	var suggestionRelatedRouter = require('./suggestion')(passport);
	router.use('/', suggestionRelatedRouter);

	var userRelatedRouter = require('./user')(passport);
	router.use('/', userRelatedRouter);

	var authenticationRelatedRouter = require('./authentication')(passport);
	router.use('/', authenticationRelatedRouter)

	var systemRelatedRouter = require('./system')(passport);
	router.use('/', systemRelatedRouter);

	return router;
}
