var DumpAnalyzer = require('./lib/dump_analyzer.js');


var fs = require('fs');

require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var a = new DumpAnalyzer(require("./deadlock.txt"))

console.log(JSON.stringify(a))