/**
 * Quickspot a fast flexible JSON powered in memory search.
 *
 * @author Carl Saggs
 * @repo https://github.com/thybag/quick-spot
 */
 (function(){
 	// Privatly scoped quick spot object (we talk to the real world (global scope) via the attach method)
 	var quickspot = function()
 	{
		// Internal data
		this.datastore = null;

		this.options = [];
		this.results = [];

		this.selectedIndex = 0;
	 	this.target = null;
	 	this.dom = null;
	 	this.lastValue = '';

	 	//Becuse javascript has interesting scoping
	 	var here = this;


	 	this.attach = function(options){
			util.addListener(window, 'load', function(){
	 			methods.attach(options);
	 		});
	 	}

	 	var methods = {};
	 	/**
	 	 * Attach a new quick-spot search to the page
	 	 *
	 	 * Required
	 	 * @param option.target ID of element to use
	 	 * @param option.url url of JSON feed to search with
		 *
	 	 * Optional
	 	 * @param option.data - data to search on provided as raw javascript object
	 	 * @param option.key_value - attribute contining key bit of information (name used by default)
	 	 * @param option.display_name - name of attribute to display in box (uses key_value by default)
	 	 * @param option.display_handler - overwrites defualt display method.
	 	 * @param options.click_handler - Callback method, is passed the selected item.
	 	 * @param options.search_on - array of attributes to search on (will use all if not specified)
	 	 * @param options.gen_score - callback to set custom score method. (higher number = higher in results order)
	 	 */
	 	methods.attach = function(options){

 			// Save options for later
 			here.options = options;

 			// Check we have a target!
	 		if(!options.target){
	 			console.log("Error: Target not specified");
	 			return;
	 		}
	 		// Get target
	 		here.target = document.getElementById(options.target);
	 		if(!here.target){
	 			console.log("Error: Target ID could not be found");
	 			return;
	 		}
	 		// Get key value
	 		if(!options.key_value){
	 			options.key_value = 'name';
	 		}
	 		// Grab display name
	 		if(!options.display_name){
	 			options.display_name = options.key_value;
	 		}

	 		//find data
	 		if(typeof options.url !== 'undefined'){
	 			//Load data via ajax
	 			util.ajaxGetJSON(options.url, methods.initialise_data);
	 		}else if(typeof options.data !== 'undefined'){
	 			//Import directly provided data
	 			methods.initialise_data(options.data);
	 		}else{
	 			//Warn user if none is provided
	 			console.log("Error: No datasource provided.");
	 			return;
	 		}
	 		
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

 			//Lower case search input
 			search = search.toLowerCase();

 			// Avoid searching if input hasn't changed.
 			// Just reshown what we have
	 		if(here.lastValue==search){
	 			here.dom.style.display = 'block';
	 			return;
	 		}

	 		//event for quickspot start (doesnt start if no search is triggered)
	 		util.triggerEvent(here.target,"quickspot:start");

	 		//Update last searched value
	 		here.lastValue=search;

	 		//make selected index 0 again
	 		this.selectedIndex = 0;

	 		//Perform search, order results & render them
	 		here.results = methods.sortResults(methods.findMatches(search), search);
			methods.render_results(here.results);

			//event for quickspot end
			util.triggerEvent(here.target,"quickspot:end");
	
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

			//deselect previously active item.
			util.removeClass(here.dom.children[here.selectedIndex], 'selected');

			//Ensure ranges are valid for new item (fix them if not)
			if(idx >= here.results.length){
				here.selectedIndex = here.results.length-1;
			}else if(idx < 0){
				here.selectedIndex = 0;
			}else{
				here.selectedIndex = idx;
			}

			//Select new item
			util.addClass(here.dom.children[here.selectedIndex], 'selected');
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
				//event for no results found
				util.triggerEvent(here.target,"quickspot:noresults");
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
				if(typeof here.options.display_handler != 'undefined'){
					tmp.innerHTML = here.options.display_handler(result);
				}else{
					tmp.innerHTML = result[here.options.display_name];
				}
				
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

			//event when results found
			util.triggerEvent(here.target,"quickspot:resultsfound");

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
		 * perform action specified in click_handler if it is set.
		 *
		 * @param result object defining selected result
		 *
		 */
		methods.handleSelection = function(result){
			//If custom handler was provided
			if(typeof here.options.click_handler != 'undefined'){
				here.options.click_handler(result);
			}else{
				if(typeof result.url !== 'undefined'){
					//If url was provided, go there
					window.location = url;
				}else{
					//else assume we are just a typeahead?
					here.target.value = result[here.options.display_name];
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
			search = search;
			//for each possible item
			for(var i=0; i < here.data_store.length; i++){
				//get item
				itm = here.data_store[i];
				//do really quick string search
				if(itm.__searchvalues.indexOf(search) !== -1){
					//add to matches if there was one
					matches.push(itm);
				}
			}
			//return matching items
			return matches;
		}

		/**
		 * sort Results
		 * Order results by the number of matches found in the search string.
		 * Repeating certain phrases in json can be used to make certain results
		 * appear higher than others if needed.
		 *
		 * @param results - array of items that match the search result
		 * @param search - search string in use
		 * @return orderd array of results
		 */
		methods.sortResults = function(results, search){
	 		// Select either user defined score_handler, or default (built in) one
	 		var score_handler = (typeof here.options.gen_score === 'undefined') ? methods.calculateScore : here.options.gen_score;

	 		// Score each value (heigher==better match) for results sort
	 		for(var i=0;i<results.length;i++){
	 			results[i].__score = score_handler(results[i], search);
	 		}
	 			
	 		// Sort results based on score (higher=better)
	 		results.sort(function(a, b){
	 			return (a.__score==b.__score) ? 0 : (a.__score < b.__score) ? 1 : -1;
	 		})
	 		// return them for rendering
	 		return results;
	 	}

	 	/**
	 	 * Calculate score
	 	 *
	 	 * @param result - A result to calculate a score for
	 	 * @param search - Search value in use
	 	 *
	 	 * @return int - score (higher = better)
	 	 */
	 	methods.calculateScore = function(result, search){
	 		var score = 0, idx;
	 		// key value index
 			idx = result.__keyvalue.indexOf(search);

 			// Count occurences 
 			// This metric is less useful for 1 letter words so don't include it as with lots of
 			// results its kinda pricy (timewise)
 			if(search.length < 2) score += util.occurrences(result.__searchvalues, search);
 			// Boost score by 5 if match is start of word
 			score += (result.__searchvalues.indexOf(' '+search) !== -1) ? 5 : 0;
			// In title, boost score by 5
			score += (idx !== -1) ? 5 : 0;
			// If perfect title match +10
			score += (idx === 0) ? 10 : 0; 

			return score;
	 	}

		/**
		 * Initialise data
		 * create a new datastore to allow quick access, filtering and searching of provided data.
		 *
		 * @param data raw json
		 */
		methods.initialise_data = function(data){
			here.datastore = datastore.create(data, here.options);
		}
 	}
 	
 	/**
 	 * Datastore component.
 	 * datastore components are created with each quickspot instance & provide all the mechanisms for quickly
 	 * searching, filtering and ordering the data.
 	 *
 	 * @param data to store (array of objects)
 	 * @param options/settings
 	 *			- search_on: columns to search on
 	 *			- key_value: primary value (weighted for results ordering)
 	 *			- gen_score: function to score objects by closeness to string, used for sorting
 	 */
	var datastore = function(data, options){

		// internal datastores
		this.data = [];
		this.data_filtered = [];
		this.results = [];

		// accessor to primary "this" for internal objs
		var here = this;
		// private methods
		var ds = {};

 		/**
		 * Create
		 *
		 * Create a new datastore instance. The datastore will use the data and options to generate
		 * an internal preproccessed reprention of the data in order to allow quicker searching
		 * and filtering
		 *
		 * @param data raw json
		 * @param options
		 */
		ds.create = function(data, options){

			// If there are options, store them set options
			here.options = (typeof options !== 'undefined') ? options : {};
			
			// If no key value, use name.
			if(!here.options.key_value){
	 			here.options.key_value = 'name';
	 		}

			// Convert object to array if found
			// keys will be thrown away
			if(typeof data === 'object'){
				var tmp = [];
				for(var i in data) if (data.hasOwnProperty(i)) tmp.push(data[i]);
				data = tmp;
			}

			var attrs = (typeof here.options.search_on !== 'undefined') ? here.options.search_on : false; 

			// Loop through searchable items, adding all values that will need to be searched upon in to a
			// string stored as __searchvalues. Either add everything or just what the user specifies.
			for(var i = 0; i < data.length; i++){
				// If search_on exists use th as attributes list, else just use all of them
				data[i] = ds.pre_process(data[i], attrs);
			}
			// Store in memory
			here.data_filtered = here.data = data;
		}

		/**
		 * find
		 * Find any results where search string is within the objects searchable columns
		 *
		 * @param search string
		 * @param col - only look for string in given column
		 * @return this
		 */
 		this.find = function(search, col){
 			this.results = ds.find(search.toLowerCase(), this.data_filtered, col);
 			return this;
 		}

 		/**
		 * sort results by $str
		 * sort results by closeness to provided string
		 *
		 * @param search string
		 * @return this
		 */
 		this.sort_results_by = function(search){
 			this.results = ds.sort_by_match(this.results, search.toLowerCase());
 			return this;
 		}

 		/**
		 * search 
		 * search for string in results. Similar to find, but results are ordered by match
		 *
		 * @param search string
		 * @return this
		 */
 		this.search = function(search){
 			this.find(search).sort_results_by(search);
 			return this;
 		}

 		/**
		 * filter data
		 * Apply a filter to the data. Filter will persist unit clear_filters is called.
		 *
		 * @param filter string
		 * @param colum to apply filter to (by default will use all searchable cols)
		 * @return this
		 */
 		this.filter = function(filter, on_col){

 			if(typeof filter === 'function'){
 				this.results = this.data_filtered = ds.findByFunction(filter, this.data_filtered);
 			} else{

 				this.results = this.data_filtered = ds.find(filter.toLowerCase(), this.data_filtered, on_col);	
 			}
 			
 			return this;
 		}

 		/**
 		 * Clear all filters applied to data.
 		 * @return this
 		 */
 		this.clear_filters = function(){
 			this.data_filtered = this.data;
 			return this;
 		}

 		/**
 		 * Add additional data to datastore
 		 * @param data array of data / data item
 		 */
 		this.add = function(data){

 			// If array, run this method on each individual item
 			if(typeof data === 'array'){
 				for(var i = 0 ;i < data.length; i++) this.add(data[i]);

 				return this;
 			}

 			// Else proccess data and add it to the data array
 			var attrs = (typeof here.options.search_on !== 'undefined') ? here.options.search_on : false; 
			
			// Add data
 			this.data.push(ds.pre_process(data, attrs));

 			//clear filters
 			this.data_filtered = this.data;

 			return this;
 		}

 		/**
 		 * get
 		 *
 		 * @return results as array
 		 */
 		this.get = function(){
 			return this.results;
 		}

 		/**
 		 * pre_process an item to make it quickly searchable
 		 *
 		 * @param item item object]
 		 * @param attrs attributes to search on
 		 */
		ds.pre_process = function(item, attrs){
			var tmp = '';

			if(attrs){
				//grab only the attributes we want to search on
				for(var c = 0; c < attrs.length; c++){
					tmp += ' ' + item[attrs[c]];
				}
			}else{
				// just grab all the attribuites 
				for(var c in item){
					tmp += ' ' + item[c];
				}
			}
			//lower case everything
			item.__searchvalues = tmp.toLowerCase();
			item.__keyvalue = item[here.options.key_value].toLowerCase();

			return item;
		}

		/**
		 * find
		 *
		 * Looks through the json provided and returns any
		 * matching results as an array
		 *
		 * @param search string specifying what to search for
		 * @param dataset to search on
		 * @param column to use in search
		 * @return array of ojects that match string
		 */
		ds.find = function(search, dataset, use_column){
			var i = 0, itm, matches = [];

			if(typeof use_column === 'undefined') use_column = '__searchvalues';

			//for each possible item
			for(i=0; i < dataset.length; i++){
				//get item
				itm = dataset[i];
				//do really quick string search
				if(itm[use_column].indexOf(search) !== -1){
					//add to matches if there was one
					matches.push(itm);
				}
			}
			//return matching items
			return matches;
		}
		/**
		 * findBy func
		 *
		 * Looks through the json provided and returns any
		 * matching results as an array. Provided function is
		 * used to determine what matches.
		 *
		 * @param function to use.
		 * @param dataset to search on
		 */
		ds.findByFunction = function(func, dataset){
			var i = 0, itm, matches = [];
			for(i=0; i < dataset.length; i++){
				itm = dataset[i];
				if(func(itm)){
					matches.push(itm)
				} 
			}
			return matches;
		}

		/**
		 * sort Results
		 * Order results by the number of matches found in the search string.
		 * Repeating certain phrases in json can be used to make certain results
		 * appear higher than others if needed.
		 *
		 * @param results - array of items that match the search result
		 * @param search - search string in use
		 * @return orderd array of results
		 */
		ds.sort_by_match = function(results, search){
	 		// Select either user defined score_handler, or default (built in) one
	 		var score_handler = (typeof here.options.gen_score === 'undefined') ? ds.calculate_match_score : here.options.gen_score;
	 		
	 		// Score each value (heigher==better match) for results sort
	 		for(var i=0;i<results.length;i++){
	 			results[i].__score = score_handler(results[i], search);
	 		}
	 			
	 		// Sort results based on score (higher=better)
	 		results.sort(function(a, b){
	 			return (a.__score==b.__score) ? 0 : (a.__score < b.__score) ? 1 : -1;
	 		})
	 		// return them for rendering
	 		return results;
	 	}

	 	/**
	 	 * Calculate score
	 	 *
	 	 * @param result - A result to calculate a score for
	 	 * @param search - Search value in use
	 	 *
	 	 * @return int - score (higher = better)
	 	 */
	 	ds.calculate_match_score = function(result, search){
	 		
	 		var score = 0, idx;
	 		// key value index
 			idx = result.__keyvalue.indexOf(search);

 			// Count occurences 
 			// This metric is less useful for 1 letter words so don't include it as with lots of
 			// results its kinda pricy (timewise)
 			if(search.length > 2) score += util.occurrences(result.__searchvalues, search);
 			// Boost score by 5 if match is start of word
 			score += (result.__searchvalues.indexOf(' '+search) !== -1) ? 5 : 0;
			// In title, boost score by 5
			score += (idx !== -1) ? 5 : 0;
			// If perfect title match +10
			score += (idx === 0) ? 10 : 0; 

			return score;
	 	}

		// Setup datastore
		ds.create(data, options);
	}
	// Static method, create a new datastore.
	datastore.create = function(data, options){
		return new datastore(data, options);
	}

 	/**
 	 * Util methods.
 	 * These are based on code from https://github.com/thybag/base.js/
 	 * I am using these to avoid the need to have dependencies on any external frameworks (example:jQuery).
 	 */
 	var util = {};
 	// Perform an AJAX get of a provided url, and return the result to the specified callback.
	util.ajaxGetJSON = function(location, callback){
		try {var xmlhttp = window.XMLHttpRequest?new XMLHttpRequest(): new ActiveXObject("Microsoft.XMLHTTP");}  catch (e) { }
		xmlhttp.onreadystatechange = function(){
			if ((xmlhttp.readyState == 4) && (xmlhttp.status == 200)) {
				//turn JSON in to real JS object & send it to the callback
				callback(JSON.parse(xmlhttp.responseText));
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
	//Fire an Event
	util.triggerEvent = function(obj, event_name){
		if (document.createEvent) {
			var evt = document.createEvent("HTMLEvents");
    		evt.initEvent(event_name, true, true);
    		obj.dispatchEvent(evt);
		}else{
			//IE 8/7 cannot fire custom events so this code is no help :(
			//var evt = document.createEventObject();
    		//evt.eventType = 'on'+event_name;
    		//obj.fireEvent(evt.eventType, evt);
		}
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
	// High speed occurrences function (amount of matches within a string)
	// borrowed from stack overflow (benchmarked to be significantly faster than regexp)
	// http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
	util.occurrences = function(haystack, needle){

	    haystack+=""; needle+="";
	    if(needle.length<=0) return haystack.length+1;

	    var n=0, pos=0;
	    var step=needle.length;

	    while(true){
	        pos=haystack.indexOf(needle,pos);
	        if(pos>=0){ n++; pos+=step; } else break;
	    }
	    return(n);
	}

	//Add ourselves to the outside world / global namespace
 	window.quickspot = {};
 	//Provide method that will allow us to create an new object instance for each attached searchbox.
 	window.quickspot.attach = function(options){
 		var qs = new quickspot;
 		qs.attach(options);
	 	return qs;
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
//Even if jQuery is avaiable it seems json2 is signifcantly faster, so importing it is worth the time.
if(typeof JSON === 'undefined'){
	var json2 = document.createElement('script');
	json2.src = 'http://ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js';
	document.getElementsByTagName('head')[0].appendChild(json2);
}

//suppress console for IE.
if(typeof console === 'undefined'){
	window.console = {"log":function(x){}};
}