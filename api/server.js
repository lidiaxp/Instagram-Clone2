var express = require('express'),
	bodyParser = require('body-parser'),
	mongodb = require('mongodb'),
	multiparty = require('connect-multiparty'),
	fs = require('fs'),
	objectId = require('mongodb').ObjectId;

	var app = express();

	app.use(bodyParser.urlencoded({extended:true}));
	app.use(bodyParser.json());
	app.use(multiparty());

	app.use(function(req, res, next){
		res.setHeader("Access-Control-allow-Origin", "*");
		res.setHeader("Access-Control-allow-Methods", "GET, POST, PUT, DELETE");
		res.setHeader("Access-Control-allow-Headers", "Content-type");
		res.setHeader("Access-Control-allow-Credentials", true);

		next();
	});

	var port = 8080;

	app.listen(port);

	var db = new mongodb.Db(
		'instagram',
		new mongodb.Server('localhost', 27017, {}),
		{}
	);

	console.log('Servidor HTTP esta escutando na porta ' + port);

	app.get('/', function(req, res){
		res.send({msg: 'oi'});
	});

	//POST
	app.post('/api', function(req, res){
		//res.setHeader("Access-Control-allow-Origin", "*"); //ou coloca a url no lugar do * se quiser limitar as chamadas

		var date = new Date();
		time_stamp = date.getTime();

		var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

		var path_origem = req.files.arquivo.path;
		var path_destino = './uploads/' + url_imagem;

		fs.rename(path_origem, path_destino, function(err){
			if(err){
				res.status(500).json({error: err});
				return;
			}

			var dados = {
				url_imagem: url_imagem,
				titulo: req.body.titulo
			}

			db.open(function(err, mongoClient){
				mongoClient.collection('postagens', function(err, collection){
					collection.insert(dados, function(err, records){
						if(err){
							res.json({'status' : 'Erro'});
						}else{
							res.json({'status' : 'Inclusão realizada com sucesso'});
						}
						mongoClient.close();
					});
				});
			});
		});
	});

	//GET all
	app.get('/api', function(req, res){

		//res.setHeader("Access-Control-allow-Origin", "*"); //ou coloca a url no lugar do * se quiser limitar as chamadas

		db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.find().toArray(function(err, results){
					if(err){
						res.json(err);
					}else{
						res.json(results);
					}
					mongoClient.close();
				});
			});
		});
	});

	//GET por id
	app.get('/api/:id', function(req, res){
		db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.find(objectId(req.params.id)).toArray(function(err, results){
					if(err){
						res.json(err);
					}else{
						/*if(results === null){
							res.status(res.status(500).json(results));
						}else{*/
							res.json(results);
						//}
					}
					mongoClient.close();
				});
			});
		});
	});

	//GET por whatever
	/*app.get('/api/:titulo', function(req, res){
		db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.find({titulo : req.params.titulo}).toArray(function(err, results){
					if(err){
						res.json(err);
					}else{
						res.json(results);
					}
					mongoClient.close();
				});
			});
		});
	});*/

	app.get('/imagens/:imagem', function(req, res){
		var img = req.params.imagem;

		fs.readFile('./uploads/' + img, function(err, conteudo){
			if(err){
				res.status(400).json(err);
				return;
			}

			res.writeHead(200, {'Content-type':'image/png', 'Content-type':'image/jpg'});
			res.end(conteudo);
		})
	});

	//PUT por id
	app.put('/api/:id', function(req, res){
		//res.send(req.body.comentario);

		db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.update(
					{ _id : objectId(req.params.id) },
					{ $push : {
								comentarios : {
									id_comentario : new objectId(),
									comentario : req.body.comentario
								}
							  }
					},
					{ },
					function(err, records){
						if(err){
							res.json(err);
						}else{
							res.json(records);
						}
						mongoClient.close();
					}
				);
			});
		});

		/*db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.update(
					{ _id : objectId(req.params.id) },
					{ $set : {titulo : req.body.titulo}},
					{ },
					function(err, records){
						if(err){
							res.json(err);
						}else{
							res.json(records);
						}
						mongoClient.close();
					}
				);
			});
		});*/
	});

	//DELETE por id
	app.delete('/api/:id', function(req, res){
		db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.update(
					{ },
					{ $pull : {
								comentarios: {id_comentario: objectId(req.params.id)}
							  } 
					},
					{multi: true},
					function(err, records){
						if(err){
							res.json(err);
						}else{
							res.json(records);
						}
						mongoClient.close();
					}
				);
			});
		});

		/*db.open(function(err, mongoClient){
			mongoClient.collection('postagens', function(err, collection){
				collection.remove(
					{ _id: objectId(req.params.id) },
					function(err, records){
						if(err){
							res.json(err);
						}else{
							res.json(records);
						}
						mongoClient.close();
					}
				);
			});
		});*/
	});