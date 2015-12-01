'use strict';
var ThreadAnalyzer = require("./thread_analyzer"),
	StackAnalyzer = require("./stack_analyzer");

function DumpAnalyzer(dump, options) {
	var self = this;
	this.dump = dump;
	this.threadAnalyzers = this.parseThreads(dump);
	this.total_threads = this.threadAnalyzers.length;
	this.thread_states = {};
	this.threadAnalyzers.forEach(function(t) {
		if(self.thread_states[t.state]) {
			self.thread_states[t.state]++;
		} else {
			self.thread_states[t.state] = 1;
		}
	})
	this.deadLocks = this.parseDeadLocks(dump,this.threadAnalyzers);
	this.stackAnalyzer = new StackAnalyzer(this.threadAnalyzers,options).toJson();
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



