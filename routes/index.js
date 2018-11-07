var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var moment = require('moment');
var nodemailer = require('nodemailer');

var User = require('../models/user');
var Infosys = require('../models/infosys');
var Recommendation = require('../models/recommendation');
var Relation = require('../models/relation'); 

module.exports = function(passport){

	// /TESTE
	router.get('/a', function(req, res) {
		if (req.user){
			req.user.username = "ban"
			req.user.save(function (err) {
				if (err) return handleError(err,req,res);
			});
		}
		res.send("done");
	});

	router.get('/teste', function(req, res) {
		var infoData = new Recommendation();
		infoData.grades = {};
		infoData.grades["banana"] = "abacate";
		infoData.grades[3] = 10;
		infoData.save(function (err) {
			if (err) return handleError(err,req,res);
		});

		var infoData2 = new Recommendation();
		infoData2.grades = {};
		infoData2.grades["teste"] = "taste";
		infoData2.grades["tango"] = "tengo";
		infoData2.save(function (err) {
			if (err) return handleError(err,req,res);
		});
		res.send("done");
	});

	router.get('/teste2', function(req, res) {
		var tres = "3"
		var gradess = "grades.teste"
		Recommendation.find({ [gradess] : {$exists: true}}, function(err, data){
			if (data){
				console.log(data)
				delete data[0].grades["teste"];
				data[0].markModified("grades")
				data[0].save(function (err) {
					if (err) return handleError(err,req,res);
					res.send(data)
				});
 				//console.log(data)
				//res.send(data)
			}
			else
				res.send("error")
 		});
	});

	router.get('/teste3', function(req, res) {
		Recommendation.findOne({}, function(err, data){
			console.log(data.users_grade)
			res.send(data.users_grade);
 		});
	});

	// /'SignUp'

	// /'INDEX'
	router.get('/', function(req, res) {
		res.render('index', {message: req.flash('message')});
	});

    router.get('/profile', isAuthenticated, function(req, res) {
        res.render('profile', {
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
		});

		req.flash('message', "Username has been changed");
		res.redirect('/profile');
	});

	router.post('/delete_account', isAuthenticated, function(req, res) {
		if (req.body["username"] == req.user.username){

			var query_user_relation = "relation." + req.user._id

			User.find({[query_user_relation]: {$exists: true}}, function(err, users) {
				if (err) return handleError(err,req,res);
				for (var i = 0; i < users.length; i++){
					delete users[i].relation[req.user._id];
					users[i].markModified("relation");
					users[i].save(function (err) {
						if (err) return handleError(err,req,res);
					});
				}
			});
			
			Infosys.findOne({}, function(err, infosys){
				if (err) return handleError(err,req,res);
				if (infosys){
					delete infosys.usernames[req.user._id];
					infosys.markModified("usernames");
					infosys.save(function (err) {
						if (err) return handleError(err,req,res);
					});
				}
			});

			var query_recommendation_grades = "grades." + req.user._id
			Recommendation.find({[query_recommendation_grades] : {$exists: true} }, function(err, recommendations){
				if (err) return handleError(err,req,res);
				for (var i = 0; i < recommendations.length; i++){
					delete recommendations[i].grades[req.user._id];
					delete recommendations[i].comments[req.user._id];
					recommendations[i].markModified("grades");
					recommendations[i].markModified("comments");
					recommendations[i].save(function (err) {
						if (err) return handleError(err,req,res);
					});
				}
			});

			req.logout();
			req.user.remove();
			req.flash('message', "User has been deleted");
			res.redirect('/logout');
		}
		else{
			req.flash('message', "!Wrong username");
			res.redirect('/profile');
		}
		
	});

	router.get('/userlist', isAuthenticated, function(req, res) {
		var name = req.body["search_name"];
		User.find({$or: [
			{'username': {'$regex': name, "$options": "i"}},
			{'local.email': {'$regex': name, "$options": "i"}},
			{'google.email': {'$regex': name, "$options": "i"}}
		] }, function(err, users) {
			if (err) return handleError(err,req,res);
			if (users){
				var user_name = [];
				var user_relation = [];
				for (var i = 0; i < users.length; i++){
					user_name.push(users[i].username);
					if (req.user.relation[users[i]._id] == undefined){
						user_relation.push("add");
					}
					else{
						user_relation.push("remove");
					}
				}
				res.render('userlist', {user_name: user_name, user_relation: user_relation})
			}
			else{
				req.flash('message', "!No users found.");
				res.redirect('/profile');
			}
		});
	});

	router.get('/user', isAuthenticated, function(req, res) {
		var id = req.body["target_id"];
		var user_relation = "remove";
		var user_name = "";
		var recommendations = [];
		var query = "grades." + "" + id; 
		if (req.user.relation[id] == undefined){
			user_relation = "add";
		}
		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){
				user_name = infosys.usernames[id];
				Recommendation.find({[query] : {$exists: true} }, function(err, recommendations){
					if (err) return handleError(err,req,res);
					if (recommendations){
						res.render('user', {id : id, user_relation: user_relation, user_name: user_name, recommendations: recommendations});
					}
					else{
						req.flash('message', "!Recommendations does not exist! Contact Admin");
						res.redirect("/profile")
					}
				});
			}
			else {
				req.flash('message', "!Infosys does not exist! Contact Admin");
				res.redirect("/profile")
			}
		});
	});

	router.post('/add_relation', isAuthenticated, function(req, res){

		var target_id = req.body["target_id"];
		if (req.user.relation[target_id] == undefined){
			req.user.relation[target_id] = 1;
			req.user.markModified("relation");
			req.user.save(function (err) {
				if (err) return handleError(err,req,res);
			});
			req.flash('message', "User added sucessfully.");
			
		}
		else{
			req.flash('message', "!User is aleady added.");
		}
		res.redirect("/profile")

	});

	router.post('/remove_relation', isAuthenticated, function(req, res){

		var target_id = req.body["target_id"];
		if (req.user.relation[target_id] != undefined){
			req.user.relation[target_id] = undefined;
			req.user.markModified("relation");
			req.user.save(function (err) {
				if (err) return handleError(err,req,res);
			});
			req.flash('message', "User removed sucessfully.");
			
		}
		else{
			req.flash('message', "!User is not related.");
		}
		res.redirect("/profile")

	});

	router.get('/relationship', isAuthenticated, function(req, res){
		var relation_id = [];
		var relation_username = [];
		
		Infosys.findOne({}, function(err, infosys){
			if (err) return handleError(err,req,res);
			if (infosys){
				for (var ids in req.user.relation) {
					if (req.user_relation.hasOwnProperty(ids)) {
						relation_id.push(req.user.relation[ids]);
						relation_username.push(infosys.usernames[req.user.relation[ids]]);
					}
				}
				res.render('relationship', {ids: relation_id, names: relation_usernames})
			}
			else {
				req.flash('message', "!Infosys does not exist! Contact Admin");
				res.redirect("/profile")
			}
		});

	});

    // LOGOUT ==============================
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

	
	// locally --------------------------------
	// LOGIN ===============================
	// show the login form
	router.get('/login', function(req, res) {
		res.render('login', { message: req.flash('message') });
	});

	// process the login form
	router.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// SIGNUP =================================
	// show the signup form
	router.get('/signup', function(req, res) {
		res.render('signup', { message: req.flash('signupMessage') });
	});

	// process the signup form
	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


	// google ---------------------------------

	// send to google to do the authentication
	router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	// the callback after google has authenticated the user
	router.get('/auth/google/callback',
		passport.authenticate('google', {
			successRedirect : '/profile',
			failureRedirect : '/'
		}));

	router.get('/infosys', function(req, res) {
		var newInfosys = Infosys();
		newInfosys.usernames = {};
		newInfosys.categories = [];
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
		Recommendation.remove({}, function(err) { 
			console.log('Infodata removed')
		});
		res.send("Deletado");
	});

	//#region OLD STUFF \/
	router.post('/', function(req, res){

		var newCadastro = new Cadastro();
		newCadastro.nome = req.param('nome');
		newCadastro.identidade = req.param('identidade'); 
		newCadastro.cracha = req.param('cracha'); 
		newCadastro.divisao = req.param('divisao'); 
		newCadastro.trecho = req.param('trecho'); 
		newCadastro.data = req.param('data');
		newCadastro.relacao = req.param('relacao');
		newCadastro.estado = "solicitação de reserva";
		newCadastro.email = req.param('email');
		newCadastro.observacao = req.param('observacao');
		console.log(req.param('data'));
		
		// Se a data for valida
		if (moment(newCadastro.data).isValid()){
			var data = moment(newCadastro.data).format("YYYY-MM-DD");
			//data.hour(0);
			newCadastro.data = data;

			for (var i = 0; i < newCadastro.relacao.length; i++){
				if (i%5 == 3){
					newCadastro.relacao.splice(i+1, 0, "Em análise");
				}
			}

			newCadastro.save(function (err) {
				if (err) return handleError(err,req,res);
			});
			req.flash('message', "Solicitação realizada com sucesso, aguarde aprovação por e-mail");
			
			var text = 'A solicitação de embarque do(a) ' + newCadastro.nome +
				" foi realizada com sucesso para o dia " + moment(newCadastro.data).format("DD/MM/YYYY") + ", no trecho " + newCadastro.trecho +
				", aguarde aprovação por-email. Segue a lista dos passageiros solicitada: \n\n";
				
			for (var i = 0; i < newCadastro.relacao.length/5; i++){
				text+= newCadastro.relacao[i*5] + ". \n"
			}

			
			
			var subject = "Solicitação de embarque realizada - Aguarde aprovação"
			
			acceptMail(newCadastro, text, subject)
		
			res.redirect('/');
		}
		else {
			req.flash('message', "!Data invalida");
			res.redirect('/');
		}
		
	});
			
	// /LOGIN
	router.get('/login/autorizar', function(req,res){
		res.render('login', {endereco: "autorizar", message: req.flash('message') });
	});
	
	router.get('/login/visualizar', function(req,res){
		res.render('login', {endereco: "visualizar", message: req.flash('message') });
	});
	
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	router.post('/login/autorizar', passport.authenticate('login', {
		// Autenticação pelo passport.
		successRedirect: '/autorizar',
		failureRedirect: '/login/autorizar',
		failureFlash : true
	}));
	
	router.post('/login/visualizar', passport.authenticate('login', {
		// Autenticação pelo passport.
		successRedirect: '/visualizar',
		failureRedirect: '/login/visualizar',
		failureFlash : true
	}));

	// /AUTORIZAR
	router.get('/autorizar', isAuthenticatedAuth, function(req, res){
		Cadastro.find({'estado': "solicitação de reserva"}, function(err, cadastros) {
			if (err) return handleError(err,req,res);
			if (cadastros){
				res.render('autorizar', {cadastros: cadastros, user: req.user.username, message: req.flash('message')});
			}
			else {
				req.flash('message', "Não existem solicitações");
				res.redirect('/autorizar');
			}
		});
	});
	
	router.post('/autorizar', isAuthenticatedAuth, function(req, res){
		
		Cadastro.findOne({_id: req.param('_id')},function(err, cadastro){
			if (err) return handleError(err,req,res);
			if (cadastro){
				
				var autorizacao = {};
				
				if (Array.isArray(req.param("autorizacao"))){
					autorizacao = req.param("autorizacao");
				}
				else {
					autorizacao = [req.param("autorizacao")];
				}
				
				motivo = req.param("observacao");
				
				var text = 'A solicitação de embarque do(a) ' + cadastro.nome + 
				" no dia " + moment(cadastro.data).format("DD/MM/YYYY") + ", no trecho " + cadastro.trecho +
				" foi avaliada.\n\n Relação dos passageiros APROVADOS: \n\n";
				
				for (var i = 0, j = 0; i < cadastro.relacao.length/5; i++, j++){
					
					if (autorizacao[j] == "sim"){
						text+= cadastro.relacao[i*5]
						text+= " foi APROVADO(A). \n";
						cadastro.relacao.splice((i*5)+4, 1, "Aprovado")
					}
				}
				
				text+= "\n Relação dos passageiros REPROVADOS: \n\n"
				
				for (var i = 0, j = 0; i < cadastro.relacao.length/5; i++, j++){
					if (autorizacao[j] == "nao"){
						text+= cadastro.relacao[i*5]
						text+= " foi REPROVADO(a). \n"
						cadastro.relacao.splice((i*5)+4, 1, "Reprovado")
					}
				}
				
				if (motivo){
					text+="\n\nObservação: " + motivo;
				}
				
				var subject = "Solicitação de embarque avaliada";
				
				Cadastro.find({"data": req.param("data"), "estado": "analisada", "trecho": req.param("trecho")}, function(err, cadastros) {
		
					if (err) return handleError(err,req,res);
					if (cadastros){
						var total = 0;

						for (var i = 0; i < cadastros.length; i++){
							for (var j = 4; j < cadastros[i].relacao.length; j+=5){
								if (cadastros[i].relacao[j] == "Aprovado"){
									total++;
								}
							}
						}

						for (var j = 4; j < cadastro.relacao.length; j+=5){
							if (cadastro.relacao[j] == "Aprovado"){
								total++;
							}
						}
						
						if (total > 30){
							var msg = "!Solicitação avaliada com sucesso. Existem " + Number(total) + " solitações autorizadas para esse trecho nessa data!"
							req.flash('message', msg)
						}
						else{
							var msg = "Solicitação avaliada com sucesso. Existem " + Number(total) + " solitações autorizadas para esse trecho nessa data."
							req.flash('message', msg);
						}
						
						acceptMail(cadastro, text, subject);
						cadastro.estado = "analisada";
						cadastro.save(function (err) {
							if (err) return handleError(err,req,res);
						});
						if (cadastro.relacao.length == 0)
							cadastro.remove();
						
						res.redirect('/autorizar');
					}
					else {
						req.flash('message', "!Não há cadastros no sistema!");
					}
					
				});
			}
			else {
				req.flash('message', "!Solicitação não existente");
				res.redirect('/autorizar');
			}
		
		});
	});

	// /ALTERAR
	router.get('/alterar', isAuthenticatedAuth, function(req, res){

		var data = moment().format("YYYY-MM-DD");
		if (req.param('data') != undefined && req.param('data')){
			data = moment(req.param('data')).format("YYYY-MM-DD");
		}
		
		Cadastro.find({"data": data, 'estado': "analisada"}, function(err, cadastros) {
			if (err) return handleError(err,req,res);
			if (cadastros){
				res.render('alterar', {cadastros: cadastros, user: req.user.username, message: req.flash('message')});
			}
			else {
				req.flash('message', "Não existem solicitações");
				res.redirect('/alterar');
			}
		});
	});

	router.post('/alterar', isAuthenticatedAuth, function(req, res){
		
		Cadastro.findOne({_id: req.param('_id')},function(err, cadastro){
			if (err) return handleError(err,req,res);
			if (cadastro){
				
				var autorizacao = {};
				
				if (Array.isArray(req.param("autorizacao"))){
					autorizacao = req.param("autorizacao");
				}
				else {
					autorizacao = [req.param("autorizacao")];
				}
				
				motivo = req.param("observacao");
				
				var text = 'A solicitação de embarque do(a) ' + cadastro.nome + 
				" no dia " + moment(cadastro.data).format("DD/MM/YYYY") + ", no trecho " + cadastro.trecho +
				" foi REavaliada.\n\n Relação dos passageiros APROVADOS: \n\n";
				
				for (var i = 0, j = 0; i < cadastro.relacao.length/5; i++, j++){
					
					if (autorizacao[j] == "sim"){
						text+= cadastro.relacao[i*5]
						text+= " foi APROVADO(A). \n";
						cadastro.relacao.splice((i*5)+4, 1, "Aprovado")
					}
				}
				
				text+= "\n Relação dos passageiros REPROVADOS: \n\n"
				
				for (var i = 0, j = 0; i < cadastro.relacao.length/5; i++, j++){
					if (autorizacao[j] == "nao"){
						text+= cadastro.relacao[i*5]
						text+= " foi REPROVADO(a). \n"
						cadastro.relacao.splice((i*5)+4, 1, "Reprovado")
					}
				}
				
				if (motivo){
					text+="\n\nObservação: " + motivo;
				}
				
				var subject = "Solicitação de embarque REavaliada";
				
				Cadastro.find({"data": req.param("data"), "estado": "analisada", "trecho": req.param("trecho")}, function(err, cadastros) {
		
					if (err) return handleError(err,req,res);
					if (cadastros){
						var total = 0;

						for (var i = 0; i < cadastros.length; i++){
							for (var j = 4; j < cadastros[i].relacao.length; j+=5){
								if (cadastros[i].relacao[j] == "Aprovado"){
									total++;
								}
							}
						}

						for (var j = 4; j < cadastro.relacao.length; j+=5){
							if (cadastro.relacao[j] == "Aprovado"){
								total++;
							}
						}
						
						if (total > 30){
							var msg = "!Solicitação REavaliada com sucesso. Existem " + Number(total) + " solitações autorizadas para esse trecho nessa data!"
							req.flash('message', msg)
						}
						else{
							var msg = "Solicitação REavaliada com sucesso. Existem " + Number(total) + " solitações autorizadas para esse trecho nessa data."
							req.flash('message', msg);
						}
						
						acceptMail(cadastro, text, subject);
						cadastro.estado = "analisada";
						cadastro.save(function (err) {
							if (err) return handleError(err,req,res);
						});
						if (cadastro.relacao.length == 0)
							cadastro.remove();
						
						res.redirect('/alterar');
					}
					else {
						req.flash('message', "!Não há cadastros no sistema!");
					}
					
				});
			}
			else {
				req.flash('message', "!Solicitação não existente");
				res.redirect('/autorizar');
			}
		
		});
	});

	router.get('/relatorio', isAuthenticatedAuth, function(req, res){
		

		var data = moment().format("YYYY-MM");
		if (req.param('data') != undefined && req.param('data')){
			data = req.param('data');
		}
		
		Cadastro.find({"data": {$regex : data}}, function(err, cadastros) {
			
			if (err) return handleError(err,req,res);
			if (cadastros){
				
				res.render("relatorio", {cadastros: cadastros, data: data, user: req.user.username});
			}
			else {
				req.flash('message', "!Não há");
				res.send('Não há');
			}
			
		});
	});
	
	// apenas os autorizados
	// /VISUALIZAR
	router.get('/visualizar', isAuthenticatedView, function(req, res){
		
		var data = moment().format("YYYY-MM-DD");
		if (req.param('data') != undefined && req.param('data')){
			data = moment(req.param('data')).format("YYYY-MM-DD");
		}
		
		var trecho = "SLZ-AK"
		if (req.param('trecho') != undefined && req.param('trecho')){
			trecho = req.param("trecho");
		}
		
		Cadastro.find({"data": data, "estado": "analisada", "trecho": trecho}, function(err, cadastros) {
			
			if (err) return handleError(err,req,res);
			if (cadastros){
				
				res.render("visualizar", {trecho: trecho, cadastros: cadastros, user: req.user.username});
			}
			else {
				req.flash('message', "!Não há");
				res.send('Não há');
			}
			
		});
	});

	
	// /CONSULTAR
	router.get('/consultar', function(req, res){
		
		var saram = req.param("saram");
		//console.log(saram)
		
		
		Cadastro.find({"identidade": saram}, function(err, cadastros) {
			//console.log(cadastros)
			if (err) return handleError(err,req,res);
			if (cadastros){
				res.render("consultar", {cadastros: cadastros});
			}
			else {
				req.flash('message', "!Error");
				res.send('Não existe nenhum cadastro no sistema');
			}
			
		});
	});
	
	
	// DELETE
	router.get('/delete', function(req, res){
		/*
		User.remove({}, function(err) { 
			console.log('Users removed')
		});
		Cadastro.remove({}, function(err) { 
			console.log('Cadastros removed')
		});
		*/
		res.send("Deletado");
	});
	
	// CRIAR
	router.get('/criar', function(req,res){
		//BDAdmin();
		//BDPopulate();
		res.send("Criado");
	});
	
	// REPOPULATE
	
	router.get('/repopulate', function(req,res){
		/*
		Cadastro.remove({}, function(err) { 
			console.log('Cadastros removed')
		});
		BDPopulate();
		res.redirect('/autorizar');*/
		res.send("Repopulate");
	});
	
	// Ajustar de 4 para 5
	router.get('/ajustar', function(req,res){
		/*
		Cadastro.find({}, function(err, cadastros) {
			
			if (err) return handleError(err,req,res);
			if (cadastros){
				
				//console.log(cadastros)
				for (var x = 0; x < cadastros.length; x++){
					for (var i = 0; i < cadastros[x].relacao.length; i++){
						if (i%5 == 3){
							if (cadastros[x].estado == "solicitação de reserva"){
								cadastros[x].relacao.splice(i+1, 0, "Em análise");
							}
							else if (cadastros[x].estado == "autorizada" || cadastros[x].estado == "analisada"){
								cadastros[x].relacao.splice(i+1, 0, "Aprovado");
								cadastros[x].estado = "analisada";
							}
						}
					}
					console.log(cadastros[x].relacao);
					cadastros[x].save(function (err) {
						if (err) return handleError(err,req,res);
					});
				}
				res.send("Ajustar");


			}
			else {
				req.flash('message', "!Não há");
				res.send('Não há');
			}
			
		});
		*/
		res.send("Ajustar")
	});
	//#endregion
	
	return router;
}

{ // Functions

function BDAdmin(req, res){
	User.findOne({ 'username' :  'admin' }, function(err, user) {
		if (err){
			return handleError(err,req,res);
		}
		if (user){
			if (process.env.ADMIN_PASS)
				user.password = createHash(process.env.ADMIN_PASS);
			else
				user.password = createHash("admin");
			user.save(function(err){
				if (err) return handleError(err,req,res);
			});
			return;
		}
		var newUser = new User();
		
		newUser.username = 'admin';
		if (process.env.ADMIN_PASS)
			newUser.password = createHash(process.env.ADMIN_PASS);
		else
			newUser.password = createHash("admin");
		newUser.save(function (err) {
			if (err) return handleError(err,req,res);
		});
	});
	
	User.findOne({ 'username' :  'fiscal' }, function(err, user) {
		if (err){
			return handleError(err,req,res);
		}
		if (user){
			if (process.env.FISCAL_PASS)
				user.password = createHash(process.env.FISCAL_PASS);
			else
				user.password = createHash('fenix2018');
			user.save(function(err){
				if (err) return handleError(err,req,res);
			});
			return;
		}
		var newUser = new User();
		
		newUser.username = 'fiscal';
		if (process.env.FISCAL_PASS)
			newUser.password = createHash(process.env.FISCAL_PASS);
		else
			newUser.password = createHash('fenix2018');
		newUser.save(function (err) {
			if (err) return handleError(err,req,res);
		});
	});
	
	return
}

function BDPopulate(req, res){
	
	for (var i = 1; i < 5; i++){
		var rel = [];
		var trecho = "SLZ-AK";
		if (i%2 == 0){
			trecho = "AK-SLZ";
		}
		for (var j = 0; j < i*4; j++){
			if (j%4 == 0){
				rel[j] = "dependente" + i + "" + j
			}
			if (j%4 == 1){
				rel[j] = "identidade" + i + "" + j
			}
			if (j%4 == 2){
				rel[j] = "grau" + i + "" + j
			}
			if (j%4 == 3){
				rel[j] = "motivo" + i + "" + j
			}
			/*
			if (j%5 == 4){
				rel[j] = "solicitação"
			}*/
		}
		createCadastro( "responsavel teste"+i, "identidade"+i, "cracha"+i, "divisao"+i,
		trecho, moment().format("YYYY-MM-DD"), rel, i+"email@email.com", "observacao"+i, req, res);
	}
	return
}


function createCadastro(nome, identidade, cracha, divisao, 
trecho, data, relacao, email, observacao, req, res){
	var newCadastro = new Cadastro();
	newCadastro.nome = nome;
	newCadastro.identidade = identidade;
	newCadastro.cracha = cracha;
	newCadastro.divisao = divisao;
	newCadastro.trecho = trecho;
	var _data = moment(data).format("YYYY-MM-DD")
	newCadastro.data = _data;
	newCadastro.relacao = relacao;
	newCadastro.estado = "solicitação de reserva";
	newCadastro.email = email;
	newCadastro.observacao = observacao;
	newCadastro.save(function (err) {
		if (err) return handleError(err,req,res);
	});
}

function acceptMail(cadastro, text, subject){
	
	var texto = text +
	"\n\nA ficha de embarque é avaliada pelo Chefe da Seção de Transporte Marítimo, para eventuais dúvidas, entrar em contato através do funcional (98)99126-0456." +
	"\n\nEssa mensagem é gerada automaticamente pelo sistema, favor não responder.";
	
	
	var mailOptions = {
		from: 'fichaembarque@gmail.com',
		to: cadastro.email,
		subject: subject,
		text: texto
	};

	//console.log(process.env.EMAIL_PASS)

	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'fichaembarque@gmail.com',
			pass: process.env.EMAIL_PASS
		}
	});

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

function handleError(err,req,res){
	console.log(err);
	res.send(err);
}

var isAuthenticatedView = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	
	if (req.isAuthenticated() && (req.user.username == "fiscal" || req.user.username == "admin"))
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login/visualizar');
}

var isAuthenticatedAuth = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	
	if (req.isAuthenticated() && req.user.username == "admin")
		return next();
	if (req.isAuthenticated() && req.user.username == "fiscal"){
		req.logout();
		req.flash('message', "!Fiscal não pode autorizar fichas de embarque");
	}
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login/autorizar');
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

var createHash = function(password){
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

}
