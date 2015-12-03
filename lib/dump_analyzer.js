'use strict';
var ThreadAnalyzer = require("./thread_analyzer"),
	StackAnalyzer = require("./stack_analyzer");

function DumpAnalyzer(dump, options) {
	var self = this;
	this.options = options;
	this.dump = dump.replace(/(\xed|\xab|\xee|\xdb|\x03|\x00)/g, '');
	this._thread_analyzers = this.parseThreads(dump);
	this.thread_analyzers = this._thread_analyzers;
	this.stack_analyzer = new StackAnalyzer(this.thread_analyzers,options).toJson();
	this.total_threads = this.thread_analyzers.length;
	this.thread_states = countByKey(this.thread_analyzers,'state');
	this.threadStatus = countByKey(this.thread_analyzers,'status');
	this.deadLocks = this.parseDeadLocks(dump,this.thread_analyzers);
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
			this.thread_analyzers = this._thread_analyzers
	} else {
		var filters = [];
		filtersStr.forEach(function(f) {
			filters.push(new RegExp(f,'ig'));
		});
		var self = this;
		var filteredThreads = [];
		this._thread_analyzers.forEach(function(t) {
			for(var rid = 0; rid < filters.length; rid++) {
				var regex = filters[rid]
				if(t.stackRaw.match(regex)) {
					filteredThreads.push(t);
					break;
				}
			}
		});
		this.thread_analyzers = filteredThreads;
	}
	this.stack_analyzer = new StackAnalyzer(this.thread_analyzers,this.options).toJson();
}

DumpAnalyzer.prototype.parseDeadLocks = function(dump, threads) {
}


DumpAnalyzer.prototype.parseThreads = function(dump) {
	var stack = [];
	var actualStack = "";
	var thread_analyzers = [];
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
			thread_analyzers.push(new ThreadAnalyzer(stack[i]))
		}
	}
	return thread_analyzers.filter(function(e) {
		return e.parsed_ok
	});
}

module.exports = DumpAnalyzer;



