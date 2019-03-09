var User= require('../models/user');

module.exports = function (usernameBool, permissionBool, usersId, req, res, cb){
	User.find( {_id : {$in : usersId}}, function(err, users){
		if (err) return handleError(err, req, res);
		if (usernameBool){
			var usernames = {}
			for (var i = 0; i < users.length; i++){
				usernames[users[i]._id] = users[i].username
			}
			res.locals.infoUsername = usernames;

		}
		if (permissionBool){
			var permissions = {}
			for (var i = 0; i < users.length; i++){
				permissions[users[i]._id] = users[i].permission
			}
			res.locals.infoPermission = permissions;
		}
		cb();
	})
}