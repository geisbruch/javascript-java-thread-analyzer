/**
 * Options
 * 	Order: inverted/Standar, default standar
 *  include_waits_and_locks, default false;
 */
function StackAnalyzer(threads, options) {
	this.threads = threads;
	this.options = options || {stack_order:"inverted", stack_include_waits_and_locks: false};
	this.tree = new TreeNode("root","");
	this.loadStacks(this.threads);
}

StackAnalyzer.prototype.toJson = function() {
	return this.tree.toJson();
}
StackAnalyzer.prototype.loadStacks = function(threads) {
	var self = this;
	for(var i = 0; i<threads.length;i++) {
		var thread = threads[i];
		var stack = Array.from(thread.stack);
		var position = 0;
		var actualNode = self.tree;
		while(stack.length > 0) {
			var line = stack.shift();
			/*if(self.options.stack_order == "inverted" ) {
				line = stack.shift();
			} else {
				line = stack.pop();
			}*/
			if(line.trim().startsWith("-") && !self.options.stack_include_waits_and_locks) {
				continue;
			}
			/*
			 * To get stack in standar way
			 */
			//var line = stack.shift()
			var node = actualNode.getOrCreateChildren(line);
			node.addThread({name:thread.name,id:thread.id});
			//Increment at the end
			if(stack.length == 0)
				node.incrementStatus(thread.state);
			actualNode = node;
		}
	}
}

function TreeNode(name) {
	this.name = name;
	this.fullpath = "";
	this.total = 0;
	this.states = {};
	this.parent = null;
	this.threads = [];
	this.children = [];
}
TreeNode.prototype.addThread = function(t) {
	this.threads.push(t);
}

/**
 * Treenode is an invalid json structure because contains circular structures, 
 * because of that we have the toJson function to remove that reference
 */
TreeNode.prototype.toJson = function() {
	var json = {};
	var toMove = [{node: this,root:json}];
	while(toMove.length > 0) {
		var moving = toMove.pop();
		moving.root.children = [];
		moving.root.name = moving.node.name;
		moving.root.states = moving.node.states;
		moving.root.total = moving.node.total;
		moving.root.threads = moving.node.threads;
		moving.node.children.forEach(function(e) {
			var r = {};
			moving.root.children.push(r);
			toMove.push({node:e, root:r});
		})
	}
	return json;
}

TreeNode.prototype.incrementStatus = function(state) {
	this._incrementStatus(state);
	var parents = [this.parent];
	while(parents.length>0) {
		var parent = parents.pop();
		if(parent != null) {
			if(parent.parent != null) {
				parents.push(parent.parent);
			}
			parent._incrementStatus(state);
		}
	}
}
TreeNode.prototype._incrementStatus = function(state) {
	if(!this.states[state]) {
		this.states[state] = 1;
	} else {
		this.states[state]++;
	}
	this.total++;
}

TreeNode.prototype.getOrCreateChildren = function(nameStr) {
	var name = nameStr.trim();
	for(var i = 0 ; i < this.children.length; i++) {
		if(this.children[i].name == name) {
			return this.children[i];
		}
	}
	var newNode = new TreeNode(name);
	newNode.fullpath = this.fullpath +" -> "+name;
	newNode.parent = this;
	this.children.push(newNode);
	return newNode;
}

module.exports = StackAnalyzer;