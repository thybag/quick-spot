/**
 * Quickspot a fast flexible JSON powered in memory search.
 *
 * @author Carl Saggs
 */
 (function(){

 	var quickspot = function(){
		//internal data
		this.data_store = [];
		this.options = [];
		this.results = [];

		this.selectedIndex = 0;
	 	this.target = null;
	 	this.dom = null;
	 	this.lastValue = '';
	 	//Becuse javascript has interesting scoping
	 	var here = this;

	 	this.attach = function(options){

 			//Save options for later
 			here.options = options;

 			//check we have a target!
	 		if(!options.target){
	 			console.log("Target required");
	 		}
	 		//get target
	 		here.target = document.getElementById(options.target);
	 		if(!here.target){
	 			console.log("Target ID could not be found");	
	 		}
	 		//Load data
	 		util.ajaxGet(options.url, methods.initialise_data);

	 		//Setup basic Dom stuff
	 		here.dom = document.createElement('div');
	 		here.dom.className='quickspot-results';
	 		here.dom.setAttribute("tabindex","100");
	 		here.dom.style.display = 'none';
	 		here.target.parentNode.appendChild(here.dom);

	 		//Attach listeners
	 		util.addListener(here.target, 	'keydown', methods.handleKeyUp);
	 		util.addListener(here.target, 	'keyup', methods.handleKeyDown);
	 		util.addListener(here.target, 	'focus', methods.handleFocus);
	 		util.addListener(here.target, 	'blur', methods.handleBlur);
	 		util.addListener(here.dom, 		'blur', methods.handleBlur);
	 		util.addListener(here.dom, 		'blur', methods.handleKeyUp);
 		}
	 	

	 	//private util methods based on base.js
	 	var methods = {};
	 	//Search using the provided term & display results
	 	methods.findResultsFor = function(search){
	 		//dont redosearch if it hasnt changed
	 		if(here.lastValue==search){
	 			if(search!='')here.dom.style.display = 'block';
	 			return;
	 		}
	 		here.lastValue=search;
	 		//make selected index 0 again
	 		this.selectedIndex = 0;
	 		if(search != ''){
	 			here.results = methods.findMatches(here.target.value);
				methods.render_results(here.results);
	 		}else{
	 			here.results = [];
	 			//show nothing if no value
	 			here.dom.style.display = 'none';
	 		}
	 	}

		methods.handleFocus = function(event){
			methods.findResultsFor(here.target.value);
		}
		methods.handleKeyDown = function(event){
			methods.findResultsFor(here.target.value);
		}
		methods.handleKeyUp = function(event){
			var key = event.keyCode;
			if(key==13){
				event.preventDefault();
				methods.handleClick(here.results[here.selectedIndex]);
			}
			if(key == 38){
				event.preventDefault();
				methods.selectIndex(here.selectedIndex-1);
			}
			if(key == 40){
				event.preventDefault();
				methods.selectIndex(here.selectedIndex+1);
			} 	
		}
		methods.handleBlur = function(event){

			// while changing active elements document.activeElement will return the body
			//wait a few ms for the new target to be correctly set so we can decided if we really 
			//want to close the search.
			//
			setTimeout(function(){
				if(here.dom != document.activeElement && here.target != document.activeElement){
					//close if target is neither results or searchbox
					here.dom.style.display = 'none';
				}
			},150);
		}

		methods.selectIndex = function(idx){
			//ensure valid range
			if(idx > here.results.length){
				here.selectedIndex = here.results.length-1;
			}else if(idx < 0){
				here.selectedIndex = 0;
			}else{
				here.selectedIndex = idx;
			}
			//Unselect old value, select new value
			util.removeClass(here.dom.querySelector('.quickspot-result.selected'),'selected');
			util.addClass(here.dom.querySelector('.quickspot-result-'+here.selectedIndex),'selected');
		}
		//draw results to screen
		methods.render_results = function(results){

			if(results.length === 0){
				here.dom.style.display = 'none';
				return;
			}

			//clear old results
			//create doc fragment for fast dom action (1 reflow when we add)
			var fragment =  document.createDocumentFragment();
			var tmp; //reuse object for more speed

			results.forEach(function(result, idx){
				tmp = document.createElement('a');
				tmp.innerHTML = result.name;
				tmp.className = 'quickspot-result quickspot-result-'+idx;
				//attach click handler
				util.addListener(tmp, 'click', function(event){ 
					methods.handleClick(result);
				});
				util.addListener(tmp, 'mouseover', function(event){ 
					methods.selectIndex(idx);
				});
				fragment.appendChild(tmp);
			});

			//clear old
			here.dom.innerHTML ='';
			//Add new
			here.dom.style.display = 'block';
			here.dom.appendChild(fragment);

			//select inital value
			methods.selectIndex(this.selectedIndex);
		}
		//Handle item selection
		methods.handleClick = function(result){
			//If custom handler was provided
			if(typeof here.options.clickhandler != 'undefined'){
				here.options.clickhandler(result);
			}else{
				if(typeof result.url != 'undefined'){
					 window.location = url;
				}else{
					console.log("Url not specified in JSON. Please provude a clickhandler in the setup if you wish to use custom routing");
					console.log(result);
				}
			}
			
		}

		//find objects in json that match search results
		methods.findMatches = function(search){
			var matches = [];
			var itm;
			//search is lowercased so match using a lowercased value
			search = search.toLowerCase();
			for(var i=0; i < here.data_store.length; i++){
				itm = here.data_store[i];

				if(itm._searchvalues.indexOf(search) !== -1){
					matches.push(itm);
				}
			}
			//return matching items
			return matches;
		}

		//Add any searchable rows to single attribute in json data to make searching faster/easier
		methods.initialise_data = function(data){
			//Create fast searchable strings
			var data = JSON.parse(data);
			var tmp = '';
			for(var i=0; i < data.length; i++){
				tmp = '';
				//Add everything for now, can confgure via options later
				for(var a in data[i]){
					tmp += ' '+data[i][a]
				}
				//lower case everything
				data[i]._searchvalues = tmp.toLowerCase();
			}
			//Store in memoery
			here.data_store = data
		}
 	}
 	
 	var util = {};
 	// UTIL Methods
	util.ajaxGet = function(location, callback){
		try {var xmlhttp = window.XMLHttpRequest?new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");}  catch (e) { }
		xmlhttp.onreadystatechange = function(){
			if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200)) {
				console.log("bk");
				callback(xmlhttp.responseText);
			}
		}
		xmlhttp.open("GET", location, true);
		//Add standard AJAX header.
		xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xmlhttp.send(null);
	}

	util.addListener = function(obj, event, callback){
		//Proper way vs IE way
		if(window.addEventListener){obj.addEventListener(event, callback, false);}else{obj.attachEvent('on'+event, callback);}
	}
	util.addClass = function(node,nclass){
		if(!util.hasClass(node,nclass)){
			node.className = node.className+' '+nclass;
		}
	}
	util.removeClass = function(node,nclass){
		if(node===null)return;
		node.className = node.className.replace(new RegExp('(^|\\s)'+nclass+'(\\s|$)'),'');
		return;
	}
	util.hasClass = function(node, nclass){
		return (node.className.match(new RegExp('(^|\\s)'+nclass+'(\\s|$)')) != null);
	}


	//To the outside world / global namespace
 	window.quickspot = {};
 	window.quickspot.attach = function(options){
 		util.addListener(window,'load',function(){
	 		var me = new quickspot;
	 		me.attach(options);
	 	});
 	}
	
}).call({});