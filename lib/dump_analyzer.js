'use strict';
var ThreadAnalyzer = require("./thread_analyzer"),
	StackAnalyzer = require("./stack_analyzer");

function DumpAnalyzer(dump, options) {
	var self = this;
	this.options = options;
	this.dump = dump.replace(/(\xed|\xab|\xee|\xdb|\x03|\x00)/g, '');
	this._threadAnalyzers = this.parseThreads(dump);
	this.threadAnalyzers = this._threadAnalyzers;
	this.stackAnalyzer = new StackAnalyzer(this.threadAnalyzers,options).toJson();
	this.total_threads = this.threadAnalyzers.length;
	this.thread_states = countByKey(this.threadAnalyzers,'state');
	this.thread_status = countByKey(this.threadAnalyzers,'status');
	this.deadLocks = this.parseDeadLocks(dump,this.threadAnalyzers);
}

function countByKey(arr, key) {
	var obj = {}
	arr.forEach(function(t) {
		if(obj[t[key]]) {
			obj[t[key]]++;
		} else {
			obj[t[key]] = 1;
		}
	});
	return obj;
}

DumpAnalyzer.prototype.filter = function(filtersStr) {
	if(!filtersStr || filtersStr.length == 0) {
			this.threadAnalyzers = this._threadAnalyzers
	} else {
		var filters = [];
		filtersStr.forEach(function(f) {
			filters.push(new RegExp(f,'ig'));
		});
		var self = this;
		var filteredThreads = [];
		this._threadAnalyzers.forEach(function(t) {
			for(var rid = 0; rid < filters.length; rid++) {
				var regex = filters[rid]
				if(t.stackRaw.match(regex)) {
					filteredThreads.push(t);
					break;
				}
			}
		});
		this.threadAnalyzers = filteredThreads;
	}
	this.stackAnalyzer = new StackAnalyzer(this.threadAnalyzers,this.options).toJson();
}

DumpAnalyzer.prototype.parseDeadLocks = function(dump, threads) {
}


DumpAnalyzer.prototype.parseThreads = function(dump) {
	var stack = [];
	var actualStack = "";
	var threadAnalyzers = [];
	var splitted = dump.split("\n")
	for(var i = 0; i < splitted.length; i++) {
		if(splitted[i].trim() == "") {
			stack.push(actualStack);
			actualStack = "";
		} else {
			actualStack+=splitted[i]+"\n"
		}
	}
	stack.push(actualStack);
	//First split is "Full thread dump Java HotSpot"
	for(var i = 1; i< stack.length; i++) {
		if(stack[i].trim() != "") {
			threadAnalyzers.push(new ThreadAnalyzer(stack[i]))
		}
	}
	return threadAnalyzers.filter(function(e) {
		return e.parsed_ok
	});
}

module.exports = DumpAnalyzer;



