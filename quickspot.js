/**
 * Quickspot a fast flexible JSON powered in memory search.
 *
 * @author Carl Saggs
 * @repo https://github.com/thybag/quick-spot
 */
 (function(){
 	//Privatly scoped quick spot object (we talk to the real world (global scope) via the attach method)
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

	 	/**
	 	 * Attach a new quick-spot search to the page
	 	 *
	 	 * Required
	 	 * @param option.target ID of element to use
	 	 * @param option.url url of JSON feed to search with
		 *
	 	 * Optional
	 	 * @param option.displayname name of attribute to display in box (name used by default)
	 	 * @param options.clickhandler Callback method, is passed the selected item.
	 	 * @param options.searchwith, array of attributes to search on (will use all if not specified)
	 	 *
	 	 */
	 	this.attach = function(options){

 			//Save options for later
 			here.options = options;

 			//check we have a target!
	 		if(!options.target){
	 			console.log("Target not specified");
	 			return;
	 		}
	 		//Get target
	 		here.target = document.getElementById(options.target);
	 		if(!here.target){
	 			console.log("Target ID could not be found");
	 			return;
	 		}

	 		if(!options.displaname){
	 			options.displaname = 'name';
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
	 		util.addListener(here.target, 	'keydown', 	methods.handleKeyUp);
	 		util.addListener(here.target, 	'keyup', 	methods.handleKeyDown);
	 		util.addListener(here.target, 	'focus', 	methods.handleFocus);
	 		util.addListener(here.target, 	'blur', 	methods.handleBlur);
	 		util.addListener(here.dom, 		'blur', 	methods.handleBlur);
	 		//Allows use of commands when only results are selected (if we are not linking off somewhere)
	 		util.addListener(here.dom, 		'blur', 	methods.handleKeyUp);
 		}
	 	
	 	var methods = {};

	 	/**
	 	 * Find and display results for a given search term
	 	 *
	 	 * @param search Term to search on.
	 	 */
	 	methods.findResultsFor = function(search){

	 		//dont search on blank
	 		if(search == ''){
 				//show nothing if no value
 				here.results = [];
 				here.dom.style.display = 'none';
 				return;
 			}

 			// Avoid searching if input hasn't changed.
 			// Just reshown what we have
	 		if(here.lastValue==search){
	 			here.dom.style.display = 'block';
	 			return;
	 		}

	 		//Update last searched value
	 		here.lastValue=search;

	 		//make selected index 0 again
	 		this.selectedIndex = 0;

	 		//Perform search & render the result
	 		here.results = methods.findMatches(here.target.value);
			methods.render_results(here.results);
	
	 	}

	 	/**
	 	 * On: Quick-spot focus
	 	 * Display search results (assuming there are any)
	 	 */
		methods.handleFocus = function(event){
			methods.findResultsFor(here.target.value);
		}

		/**
	 	 * On: Quick-spot search typed (keydown)
	 	 * Perform search
	 	 */
		methods.handleKeyDown = function(event){
			methods.findResultsFor(here.target.value);
		}

		/**
	 	 * On: Quick-spot search typed (keyup)
	 	 * Handle specal actions (enter/up/down keys)
	 	 */
		methods.handleKeyUp = function(event){
			var key = event.keyCode;
			//prevent default action
			
			if(key==13){ //enter
				methods.handleSelection(here.results[here.selectedIndex]);
			}
			if(key == 38){ //up
				methods.selectIndex(here.selectedIndex-1);
			}
			if(key == 40){ // down
				methods.selectIndex(here.selectedIndex+1);
			} 	

			if(key==13||key==38||key==40){
				if (event.preventDefault) { 
				    event.preventDefault(); 
				} else {
				    event.returnValue = false;
				}
			} 
		}

		/**
	 	 * On: Quick-spot click off (blur)
	 	 * if it wasnt one of results that was selected, close results pane
	 	 */
		methods.handleBlur = function(event){

			// While changing active elements document.activeElement will return the body.
			// Wait a few ms for the new target to be correctly set so we can decided if we really 
			// want to close the search.
			setTimeout(function(){
				if(here.dom != document.activeElement && here.target != document.activeElement){
					//close if target is neither results or searchbox
					here.dom.style.display = 'none';
				}
			},150);
		}

		/**
	 	 * Select index
	 	 * Set selected index for results (used to set the currently selected item)
	 	 *
	 	 * @param idx index of item to select
	 	 */
		methods.selectIndex = function(idx){
			//ensure valid range
			if(idx >= here.results.length){
				here.selectedIndex = here.results.length-1;
			}else if(idx < 0){
				here.selectedIndex = 0;
			}else{
				here.selectedIndex = idx;
			}
			//Un select old value, select new value in UI.
			util.removeClass(util.cssSelect(here.dom, '.quickspot-result.selected') ,'selected');
			util.addClass(util.cssSelect(here.dom, '.quickspot-result-'+here.selectedIndex),'selected');
		}

		/**
		 * Render search results to user
		 *
		 * @param results array
		 */
		methods.render_results = function(results){

			//If no results, don't show result box.
			if(results.length === 0){
				here.dom.style.display = 'none';
				return;
			}

			// If we have results, append required items in to a documentFragment (to avoid unnessesary dom reflows that will slow this down)
			var fragment =  document.createDocumentFragment();
			var tmp; //reuse object, js likes this

			//For each item (given there own scope by this method)
			results.forEach(function(result, idx){
				//Create new a element
				tmp = document.createElement('a');
				//Set name/title
				tmp.innerHTML = result[here.options.displaname];
				//Apply classes
				tmp.className = 'quickspot-result quickspot-result-'+idx;

				// Attach listener (click)
				util.addListener(tmp, 'click', function(event){ 
					methods.handleSelection(result);
				});
				// Attach listener (hover)
				util.addListener(tmp, 'mouseover', function(event){ 
					methods.selectIndex(idx);
				});
				//Add to fragment
				fragment.appendChild(tmp);
			});

			//clear old data from dom.
			here.dom.innerHTML ='';
			//Attach fragment
			here.dom.style.display = 'block';
			here.dom.appendChild(fragment);

			//select the inital value.
			methods.selectIndex(this.selectedIndex);
		}

		/**
		 * handleSelection handles action from click (or enter key press)
		 * 
		 * Depending on settings will either send user to url, update box this is attached to or
		 * perform action specified in clickhandler if it is set.
		 *
		 * @param result object defining selected result
		 *
		 */
		methods.handleSelection= function(result){
			//If custom handler was provided
			if(typeof here.options.clickhandler != 'undefined'){
				here.options.clickhandler(result);
			}else{
				if(typeof result.url != 'undefined'){
					//If url was provided, go there
					window.location = url;
				}else{
					//else assume we are just a typeahead?
					here.target.value = result[here.options.displaname];
					here.dom.style.display = 'none';
				}
			}
			
		}

		/**
		 * findMatches
		 * The beating heart of this whole thing. Essentally looks through the json provided and returns any
		 * matching results as an array, for rendering.
		 *
		 * @param search string specifying what to search for
		 * @return array of ojects that match string
		 */
		methods.findMatches = function(search){
			var matches = [];
			var itm;
			//search is lowercased so match using a lowercased values
			search = search.toLowerCase();
			//for each possible item
			for(var i=0; i < here.data_store.length; i++){
				//get item
				itm = here.data_store[i];
				//do really quick string search
				if(itm._searchvalues.indexOf(search) !== -1){
					//add to matches if there was one
					matches.push(itm);
				}
			}
			//return matching items
			return matches;
		}

		/**
		 * initialise data
		 * Rather than repetedly proccessing data every search, do a little work now to ensure
		 * everything is fully setup to allow simple string matching to be all that is needed.
		 *
		 * @param data raw json
		 */

		methods.initialise_data = function(data){
			//turn JSON in to real JS object
			var data = JSON.parse(data);

			// Loop through searchable items, adding all values that will need to be searched upon in to a
			// string stored as _searchvalues. Either add everything or just what the user specifies.
			var tmp, attrs;
			for(var i=0; i < data.length; i++){
				tmp = '';
				//if searchwith exists use th as attributes list, else just use all of them

				if(typeof here.options.searchwith != 'undefined'){
					//grab only the attributes we want to search on
					attrs = here.options.searchwith;
					for(var c=0; c<attrs.length;c++){
						tmp += ' '+data[i][attrs[c]];
					}

				}else{
					//just grab all the attribuites 
					for(var a in data[i]){
						tmp += ' '+data[i][a]
					}
				}
				//lower case everything
				data[i]._searchvalues = tmp.toLowerCase();
			}
			//Store in memory
			here.data_store = data
		}
 	}
 	
 	/**
 	 * Util methods.
 	 * These are based on code from https://github.com/thybag/base.js/
 	 * I am using these to avoid the need to have dependencies on any external frameworks (example:jQuery).
 	 */
 	var util = {};
 	// Perform an AJAX get of a provided url, and return the result to the specified callback.
	util.ajaxGet = function(location, callback){
		try {var xmlhttp = window.XMLHttpRequest?new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");}  catch (e) { }
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
	//AddListener (cross browser method to add an eventListener)
	util.addListener = function(obj, event, callback){
		//Proper way vs IE way
		if(window.addEventListener){obj.addEventListener(event, callback, false);}else{obj.attachEvent('on'+event, callback);}
	}
	//Add a CSS class to a DOM element
	util.addClass = function(node,nclass){
		if(node==null) return;
		if(!util.hasClass(node,nclass)){
			node.className = node.className+' '+nclass;
		}
	}
	//Remove a CSS class from a dom element
	util.removeClass = function(node, nclass){
		if(node==null) return;
		node.className = node.className.replace(new RegExp('(^|\\s)'+nclass+'(\\s|$)'),'');
		return;
	}
	// Find out if a DOM element has a CSS class
	util.hasClass = function(node, nclass){
		if(node==null) return;
		return (node.className.match(new RegExp('(^|\\s)'+nclass+'(\\s|$)')) != null);
	}
	// cssSelect
	util.cssSelect = function(node, selector){
		if(document.querySelector){
			//Fast and easy.
			return node.querySelector(selector);
		}else{
			//Rather than boot an entire shim, why not ask jQuery if it can lend a hand here
			if (typeof jQuery !== 'undefined'){
				return $(node).find(selector)[0];
			}else{
				//TODO, possibly import sizzle?
			}
		}

	}

	//Add ourselves to the outside world / global namespace
 	window.quickspot = {};
 	//Provide method that will allow us to create an new object instance for each attached searchbox.
 	window.quickspot.attach = function(options){
 		util.addListener(window,'load',function(){
	 		var me = new quickspot;
	 		me.attach(options);
	 	});
 	}
	
}).call({});

//Compatability layer

//forEach shim for
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(action, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}

//JSON shim (import cdn copy of json2 if JSON is missing)
//Don't bother lerverging jquery as its version is sloooooowww (although apparenlty moving to json2)
if(typeof JSON == 'undefined'){
	var json2 = document.createElement('script');
	json2.src = 'http://ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js';
	document.getElementsByTagName('head')[0].appendChild(json2);
}

//suppress console for IE.
if(typeof console == 'undefined'){
	window.console = {"log":function(x){}};
}