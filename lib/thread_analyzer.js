var XRegExp = require("XRegExp");

/**
 * The next regexes are used to parse thread header
 * thread_name: the name of the thread
 * daemon: if the thread is type daemon it group will exist
 * prio: thread priority
 * tid: thread id
 * nid: native thread id
 * - If the thead is waiting condition this will be present
 * 	- status_condition: the condtion status
 *  - contion: object of condition
 * - else:
 *	- status_no_condtion will be present with the status name
 */
var THREAD_HEADER_PARSER_NAME=XRegExp('^(\\t)? *\"(?<thread_name>.*)\" ','i');
var THREAD_HEADER_PARSER_DAEMON=XRegExp(' daemon ','i');
var THREAD_HEADER_PARSER_PRIO=XRegExp('prio=(?<prio>\\d+)','i');
var THREAD_HEADER_PARSER_OS_PRIO=XRegExp('prio=(?<os_prio>\\d+)','i');
var THREAD_HEADER_PARSER_TID=XRegExp('tid=(?<tid>0x[0-9a-fA-F]+)','i');
var THREAD_HEADER_PARSER_NID=XRegExp('nid=(?<nid>0x[0-9a-fA-F]+)','i')
var THREAD_HEADER_PARSER_STATUS=XRegExp('nid=0x[0-9a-fA-F]+ ((?<status_condition>.*) \\[(?<condition>.*)\\]|(?<status_no_condition>.*)) *$','i')

var THREAD_STATE_PARSER=XRegExp('(?<state>NEW|RUNNABLE|BLOCKED|WAITING|TIMED_WAITING|TERMINATED)')
var THREAD_WAIT_PARSER=XRegExp('.*- waiting (on|to lock) <(?<waiting_obj>0x[0-9a-fA-F]+)>','i');
var THREAD_LOCKED_PARSER=XRegExp('.*- locked <(?<locked_obj>0x[0-9a-fA-F]+)>','i');
/*var THREAD_HEADER_PARSER=XRegExp('^ *\"(?<thread_name>.*)\" ?(?<daemon>daemon)? prio=(?<prio>\\d+) '+
 *								 'tid=(?<tid>0x[0-9a-fA-F]+) nid=(?<nid>0x[0-9a-fA-F]+) '+
 *								 '((?<status_condition>.*) \\[(?<condition>.*)\\]|(?<status_no_condition>.*))',"i");
 */
function ThreadAnalyzer(stack,options) {
	this.opstions = options || {}; 
	this.stackRaw = stack;
	this.has_locked_objects = false;
	this.locked_objects = [];
	this.waiting = false;
	this.waiting_obj = "";
	this.stack = [];
	this.state = "undefined";
	this.stack_plain = "";
	this.parsed_ok = false;
	this.name = "";
	this.id = undefined;
	this.native_id = undefined;
	this.parse();
}

ThreadAnalyzer.prototype.parse = function() {
	var splitted = this.stackRaw.split("\n");
	this.header = splitted[0]
	//First line contains thead header
	this.parseHeader(this.header);
	//Thread can't be parsed
	if(!this.name)
		return;
	//SecondLine line contains thread state
	if(splitted.length > 1) {
		this.state = safeRegexGet(splitted[1],THREAD_STATE_PARSER,'state')
	}
	for(var i = 2; i < splitted.length; i++) {
		this.addToStack(splitted[i].trim())
		var locked = safeRegexGet(splitted[i],THREAD_LOCKED_PARSER,'locked_obj');
		if(locked) {
			this.has_locked_objects = true;
			this.locked_objects.push(locked)
		}
		var waiting = safeRegexGet(splitted[i],THREAD_WAIT_PARSER, 'waiting_obj')
		if(waiting) {
			this.waiting = true;
			this.waiting_obj = waiting;
		}

	}
	this.parsed_ok = true;
}

ThreadAnalyzer.prototype.addToStack = function(elem) {
	elem = elem.trim();
	if(elem != "") {
		this.stack.push(elem);
		this.stack_plain+=" -> "+elem;
		this.stack_plain = this.stack_plain.trim();
	}
}

ThreadAnalyzer.prototype.parseHeader = function(header) {
	this.name = safeRegexGet(header, THREAD_HEADER_PARSER_NAME,'thread_name')
	this.is_deamon = safeRegexGet(header, THREAD_HEADER_PARSER_DAEMON,'deamon') ? true : false;
	this.priority = safeRegexGet(header, THREAD_HEADER_PARSER_PRIO, 'prio');
	this.os_priority = safeRegexGet(header, THREAD_HEADER_PARSER_OS_PRIO, 'os_prio');
	this.id = safeRegexGet(header, THREAD_HEADER_PARSER_TID, 'tid');
	this.native_id = safeRegexGet(header, THREAD_HEADER_PARSER_NID, 'nid');
	var status = XRegExp.exec(header, THREAD_HEADER_PARSER_STATUS);
	if(status) {
		if(status.status_condition) {
			this.status = status.status_condition;
			this.status_condition = status.condition;
		} else {
			this.status = status.status_no_condition;
			this.status_condition = null;
		}
	}
}

 function safeRegexGet(str, regex, element) {
	var res = XRegExp.exec(str, regex);
	if(!res)
		return null;
	else 
		return res[element]
}

module.exports = ThreadAnalyzer;

