var express = require('express');
var app = express();

app.use('/browser', express.static('browser'));
app.use('/dist/js', express.static('dist/js'));
app.use('/static', express.static('static'));

app.listen(3000);
