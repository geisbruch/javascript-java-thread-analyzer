var express = require('express');
var app = express();

app.use('/browser', express.static('browser'));
app.use('/dist/js', express.static('dist/js'));
app.use('/static', express.static('static'));

app.get("/",function(req, res) {
  res.redirect('/static/index.html');  
});

app.listen((process.env.PORT || 3000));
