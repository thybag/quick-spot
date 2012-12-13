/**
 * Quickspot a fast JSON search
 * @author Carl Saggs
 */
 (function(){

 	//Internal vars
	this.data_store = [];
 	this.target = null;
 	this.dom = null;
 	this.options = [];
 	var here = this;

 	this.attach = function(options){
 		//Don't run until page is ready
 		methods.addListener(window,'load',function(){

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
	 		methods.ajaxGet(options.url, methods.initialise_data);

	 		//Setup basic Dom stuff
	 		here.dom = document.createElement('div');
	 		here.dom.className='quickspot-results';
	 		here.dom.setAttribute("tabindex","100");
	 		here.target.parentNode.appendChild(here.dom);

	 		//Attach listeners
	 		methods.addListener(here.target, 	'keydown', methods.handleKeyUp);
	 		methods.addListener(here.target, 	'keyup', methods.handleKeyDown);
	 		methods.addListener(here.target, 	'focus', methods.handleFocus);
	 		methods.addListener(here.target, 	'blur', methods.handleBlur);
	 		methods.addListener(here.dom, 		'blur', methods.handleBlur);
 		});
 	}

 	//private util methods based on base.js
 	var methods = {};
 	//Search using the provided term & display results
 	methods.findResultsFor = function(search){
 		if(search != ''){
 			var results = methods.findMatches(here.target.value);
			methods.render_results(results);
 		}else{
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

		results.forEach(function(result){
			tmp = document.createElement('a');
			tmp.innerHTML = result.name;
			tmp.className = 'quickspot-result'
			//attach click handler
			methods.addListener(tmp, 'click', function(event){ 
				methods.handleClick(result);
			});
			fragment.appendChild(tmp);
		});

		//clear old
		here.dom.innerHTML ='';
		//Add new
		here.dom.style.display = 'block';
		here.dom.appendChild(fragment);
	}

	methods.handleClick = function(result){
		console.log(result);
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


	// UTIL Methods
	methods.ajaxGet = function(location,callback){
	try {xmlhttp = window.XMLHttpRequest?new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");}  catch (e) { }
		xmlhttp.onreadystatechange = function(){
			if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200)) {
				callback(xmlhttp.responseText);
			}
		}
		xmlhttp.open("GET", location, true);
		//Add standard AJAX header.
		xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xmlhttp.send(null);
	}

	methods.addListener = function(obj, event, callback){
		//Proper way vs IE way
		if(window.addEventListener){obj.addEventListener(event, callback, false);}else{obj.attachEvent('on'+event, callback);}
	}


	//add to global namespace
	window.quickspot = this;
}).call({});