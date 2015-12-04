var express = require('express');
var app = express();

app.use('/browser', express.static('browser'));
app.use('/dist/js', express.static('dist/js'));
app.use('/static', express.static('static'));

app.get("/robots.txt",function(req, res) {
  res.sendFile(__dirname+'/static/robots.txt');  
});

app.get("/sitemap.xml",function(req, res) {
  res.sendFile(__dirname+'/static/sitemap.xml');  
});

app.get("/",function(req, res) {
  res.sendFile(__dirname+'/static/index.html');  
});

app.listen((process.env.PORT || 3000));
