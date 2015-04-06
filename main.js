var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
//var app_proxy = express()
// REDIS..

var args = process.argv.slice(2);
var APP_PORT = args[0];
var REDIS_PORT = args[1];
console.log("App port: "+APP_PORT);
console.log("Redis port: "+REDIS_PORT);
//var client = redis.createClient(6379, '127.0.0.1', {})
var client = redis.createClient(REDIS_PORT, '127.0.0.1', {})
//client.flushdb();
///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	// ... INSERT HERE.
	client.lpush("recent", req.url);

	next(); // Passing the request to the next handler in the stack.
});

app.get('/get', function(req, res) {
client.get("msg", function(err,value){res.send(value)});})

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files
	
   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		console.log(img)
	  		client.lpush("upload",img);
		});
	}

    res.status(204).end()
 }]);

app.get('/meow', function(req, res) {
	
		client.lpop('upload',function(err,imagedata){
		if (err) throw err;
		res.writeHead(200, {'content-type':'text/html'});
		
		//items.forEach(function (imagedata) 
		//{			
			var printl = 'Redis Running on: '+REDIS_PORT+" App on: "+APP_PORT;
		res.write(printl);
   		res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
		//})
	
   	res.end();
	})
});

// HTTP SERVER
var server1 = app.listen(APP_PORT, function () {

  var host = server1.address().address
  var port = server1.address().port

  console.log('Example app listening at http://%s:%s', host, port)
  //client.lpush("url", "http://"+host+":"+port);
  client.lpush("url", "http://localhost:"+APP_PORT);
})
app.get('/', function(req, res) {
  res.send('Redis Running on--> '+REDIS_PORT+" App on--> "+APP_PORT)
})

app.get('/set', function(req, res) {
  client.set("msg", "this message will self-destruct in 10 seconds");
 client.expire("msg",10);
  res.send('test set world')
})

app.get('/get', function(req, res) {
client.get("msg", function(err,value){res.send(value)});

})
app.get('/recent', function(req, res) {
client.lrange("recent",0,5,function(err,value){
res.send(value)});
})

app.get("/switch", function(req,res){

res.redirect("/");	
})
