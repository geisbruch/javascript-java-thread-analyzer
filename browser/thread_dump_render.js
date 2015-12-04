var states = [ {state: "NEW", classType:"label-default"},
			   {state: "RUNNABLE", classType:"label-success"},
			   {state: "BLOCKED", classType:"label-danger"},
			   {state: "WAITING", classType:"label-warning"},
			   {state: "TIMED_WAITING", classType: "label-success"},
			   {state: "TERMINATED", classType:"label-success"}];

function TDARender(dumpRaw, div, options) {
	this.options = options || {};
	this.dumpRaw = dumpRaw;
	this.div = div;
	this.dump = new DumpAnalyzer(dumpRaw,options);
	this.active_tab = "";	
}
TDARender.prototype.filter = function(filters) {
	this.dump.filter(filters);
	this.redraw();
}
TDARender.prototype.redraw = function() {
	var self = this;
	var str = ''
	var content="<div class='tab-content'>" ;
	var headers='<ul class="nav nav-tabs" id="tda_status_tabs" role="tablist">';
	//If is not set then true
	var active =  !this.active_tab || this.active_tab == "";
	if(this.options["status"]) {
		active = active || this.active_tab == "status";
		headers+=makeTab("tda_status","Status",active);
		content+=makeTabContent(makeStatus(this.dump,this.options["status"]),"tda_status",active)
		active = false;	
	}
	if(this.options["stack"]) {
		active = active || this.active_tab == "stack";
		headers+=makeTab("tda_stack","Stack",active);
		content+=makeTabContent(makeStack(this.dump,this.options["stack"]),"tda_stack",active)
		active = false;
	}
	if(this.options["raw"]) {
		active = active || this.active_tab == "raw";
		headers+=makeTab("tda_dump_raw","Raw", active);
		content+=makeTabContent('<pre style="height:450px;">'+this.dumpRaw+'</pre>',"tda_dump_raw",active);
		active = false;
	}
	headers+='</ul>';
	str+=makeDiv(headers, "tda_headers");	
	content+="</div>"
	str+=content;
	str+='</div>'
	this.div.html(str);	

	//Status tabs actions
	$('#tda_status_tabs a').click(function (e) {
	  e.preventDefault()
	  self.active_tab = e.target.id.replace(/-tab$/,"").replace(/^tda_/,"");
	  $(this).tab('show')
	})
}


function makeStack(dump, options) {
	var total = dump.stack_analyzer.total;
	var mainDiv=$("<div>")[0]
	var toAdd = [];
	var stid=0;
	sortStackChildren(dump.stack_analyzer.children).forEach(function(e) {
		toAdd.push({node: e, div: mainDiv, level:0});
	})

	while(toAdd.length > 0) {
		stid++;
		var e = toAdd.shift();
		var hasChildren = e.node.children.length > 0;
		var content = $("<div>")[0];
		var bar = $('<div style="padding-left:'+e.level+'em"></div>')[0];
		$(bar).appendTo(content);
		var contentStr='<div id="'+stid+'" style="background:'+selectBackGroundFromDumpNode(e.node)+';">'
						+(hasChildren? '<a style="padding-right:5px;"'
						+'onclick="javascript:hideOrUnUnhide(this,\'#'+stid+'-children\')"><i class="glyphicon glyphicon-plus-sign"></i></a>':"")
						+e.node.name+'<progress  class="pull-right progress-striped active" '
						+'max="'+total+'" value="'+e.node.total+'">'+'</progress>('+e.node.total+'/'+total+')</div>';
		/*var contentStr = '<div class="progress">'
							+'<div class="progress-bar"'
							+'role="progressbar" aria-valuenow="'+e.node.total+'" aria-valuemin="0"' 
							+'aria-valuemax="'+total+'" style="margin:0px,padding:0px;width: '
							+((e.node.total/total)*100)+'%;">'+e.node.name+" ("+e.node.total+")"
  							+'</div></div>';*/
  		$(bar).html(contentStr);
		if(e.node.children.length > 0) {
			var children = $('<div id="'+stid+'-children">')[0];
			$(children).appendTo(content)
			$(children).hide();
			sortStackChildren(e.node.children).forEach(function(child) {
				toAdd.push({node: child, div: children,level:(e.level+1.3)});
			})
		}
		$(content).appendTo(e.div);

	}
	return mainDiv.outerHTML
}

function selectBackGroundFromDumpNode(node) {
	if(node.states.BLOCKED && node.states.BLOCKED>0) {
		return "rgba(198, 44, 44, 0.5)";
	}else if(node.states.WAITING && node.states.WAITING>0) {
		return "rgba(255, 211, 0, 0.5)";
	}
	return "rgba(255, 255, 255, 0.5)";
}

function hideOrUnUnhide(origin, div) {
	if($(div).css('display') == 'none') {
		$(origin).html("<i class='glyphicon glyphicon-minus-sign'></i>");
		$(div).show();
	} else {
		$(origin).html("<i class='glyphicon glyphicon-plus-sign'></i>");
		$(div).hide();
	}
	return false;
}

function sortStackChildren(children) {
	children.sort(function(a,b) {
		return b.total - a.total;
	})
	return children;
} 

function makeTabContent(content, id, active) {
	return '<div role="tabpanel" style="padding:20px" class="tab-pane '+(active?"active":"")+'" id="'+id+'"" aria-labelledby="'+id+'-tab">'
			+content+'</div>';
}

function makeTab(tab_id, tab_str, active) {
	return '<li role="presentation" class="'+(active?"active":"")+'"><a href="#'
				+tab_id
				+'" id="'+tab_id+'-tab" role="tab" data-toggle="tab" aria-controls="'+tab_id+'">'
				+tab_str+'</a></li>';
}

function makeDiv(contentstr, idStr) {
	return '<div class="" id="'+idStr+'">'+contentstr+'</div>'
}

function makeStatus(dump, options) {
	var str = ''
	str+='<div class="row jstackrow">'
			+'<div class="row jstackrow">'
			+'<div class="col-md-11 jstack"><b>Threads TOTAL</b> </div>'
			+'<div class="col-md-1"><div class="label label-default label-as-badge">'+dump.total_threads+'</div></div>'
		+'</div></div><hr/>'
	str+='<div class="row" id="thread_status">'
	for(var i = 0; i<states.length; i++) {
		var stateConf = states[i];
		var st = dump.thread_states[stateConf.state];
		var stCount = st? st.count : 0;
		var subData = '<div class="row sub-state">';
		if(st){
			console.log(st)
			var subDataKeys = Object.keys(st.status)
			for(var j = 0; j<subDataKeys.length; j++) {
				var k = subDataKeys[j];
				subData+='<div class="row jstackrow">'
					   +'<div class="col-md-1"></div><div class="col-md-9 jstack"><a>'+k+'</div>'
					   +'<div class="col-md-1" style="margin-left:2.5em;"><a><div class="label '
							+stateConf.classType
						+' label-as-badge">'
						+ st.status[k]
						+'</div></a></div></div>';
			}
		}
		subData+="</div>"
		str+='<div class="row jstackrow"><div class="col-md-11 jstack"><a>Threads in <b>'
			+stateConf.state
			+'</b></div><div class="col-md-1"><a><div class="label '
			+stateConf.classType
			+' label-as-badge">'
			+ stCount	
			+'</div></a></div>'
			+'</div>'
			+'<div class="row">'+subData+'</div><hr style="margin-top:5px;margin-bottom:5px;"/>';
	}
	str+="</div>"
	
	return str;
}

function showOnRadio(toShow, toHide) {
	$(toShow).show();
	$(toHide).hide();
}


var JavaTDA = {
	TDARender: TDARender
}