# Quick Spot

Quickspot is a fast, flexible JSON powered in-memory search. 

This Quickspot is free to use and licensed under the MIT license.

## Quick start

1. Download a copy of quickspot.js
2. Include `quickspot.js` in to your web page.
3. call `quickspot.attach({"url":"<path_to_JSON>", "target":"<id_of_searchbox>"});`

Alternately;

* to install using [NPM](https://www.npmjs.com/) run `npm install quick-spot`
* to install using [Bower](http://bower.io/) run `bower install quick-spot`

Quickspot is tested to have full support for Chrome, Firefox, Safari and IE9+.    
IE7 and IE8 also work although the custom events are unsupported.

## Basic configuration

Quickspot is designed to quickly perform an in-memory search on an array of JSON objects. By default it assumes the title of each item will be in an attribute called `name`. (See: `option.key_value` if this is not the case.)

At minimum both `target` and either `data` or `url` must be provided to the quickspot attach method.

If a JSON object has a "url" attribute quick-spot will attempt to redirect to that URL when the result is clicked. If no URL attribute is found quick spot will instead simply populate the attached search box with the value it has found (similar to a type-ahead). If you would like to do something more clever here, please refer to `option.click_handler`.

* `option.target` - The target option should either be the DOM node, or the ID of the DOM node, for the search box you would like quickspot to attach a search to. (Can also be a callback)
* `option.url` - The url option can be used to provide the path to the JSON file containing the information you wish to search on.
* `option.data` -The data option can be used to pass a JSON directly in to the attach method.

## Advanced configuration

QuickSpot implements a number of advanced methods which can be used to further customise how quick-spot functions.

* `option.key_value` - Use this to specify the name of the primary attribute in the objects. For example name/title. Results matching this value will be ranked higher. By default quickspot assumes this attribute is called "name".
* `option.display_name` - If you would like search results to show a value other than what is contained in key_value (normally "name") set this attribute here.
* `options.search_on` - Array of attributes in the JSON data set to search on (Quickspot will search on all attributes in an object if this is not provided)
* `disable_occurrence_weighting` - If set to true, multiple occurrences of the search string in a result, will no longer increase its ranking in the results.
* `options.safeload` - If set to false, Quickspot will attempt to attach instantly, rather than waiting for document load event to fire.
* `options.hide_on_blur` - Hide results listing on blur (true by default)
* `options.results_container` - ID or Node of element quickspot should use as container for results (by default will use quick-spot elements parent)
* `options.prevent_headers` - Don't add custom headers such as X-Requested-With (Can be used to avoid an options requests being made to the data API)
* `options.auto_highlight` - Automatically attempt to highlight search text in result items. (true|false - default false)
* `options.max_results` - Maximum results to display at any one time (applied after searching/ordering, results after the cut off will not be rendered. 0 = show unlimited results)
* `options.css_class_prefix` - Set custom class name prefix for quickspot. By default "quickspot" will be used.
* `options.allow_partial_matches` - Filter results by individual words rather than by the full phrase. This is enabled by default. (true|false)
* `options.show_all_on_blank_search` - True|false - Rather than hiding when no search terms are entered, this will instead cause quickspot to list all valid results (results that are not filtered out). False by default.
* `options.events` - Quick method of binding up events. Takes an object of event name, callback pairs.

In addition you can also extend quickspots base functionality significantly through the use of the following callbacks.

* `options.display_handler(current_item_data, quickspot_instance)` - Callback to override how search items are displayed. 
* `options.click_handler(clicked_item_data, quickspot_instance)` - Callback is called whenever an item is clicked/activated.
* `options.gen_score(item_data, search_text)` - Callback to override scoring mechanism. (The higher the number number returned, the higher in results order this item will be)
* `options.no_results(quickspot_instance, search_text)` - Markup to render if no results are found. (Defaults to false. If set to false, this does nothing)
* `options.no_results_click(search_text, quickspot_instance)` - Callback to handle what happens when a user attempts to click/hit enter when no results have been found.
* `options.data_pre_parse(raw_data_set, quickspot_options)` - Callback allows preprocessing of data before its set in to quickspot's data store. Can be used to rearrange data to work with quick-spot if needed.
* `options.parse_results(search_results, quickspot_options)` - Manipulate the result array before render.
* `options.string_filter(string)` - parse string for quickspot searching (Default will make string lower case, and remove punctuation characters)
* `options.no_search_handler(searchbox_dom_element, quickspot_instance)` - Callback is run whenever the search box becomes empty
* `options.screenreader_result_text(item_data result_idx, quickspot_instance)` - callback to override how text describing a result for screen-readers is generated
* `options.hide_results(results_container, quickspot_instance)` - Callback to override method that hides results container
* `options.show_results(results_container, quickspot_instance)` - Callback to override method that shows results container
* `options.loaded(datastore)` - Callback is fired each time a data store has been loaded
* `options.ready(quickspot_instance)` - Callback fired when quick-spot is fully up & running
* `options.error(http_status, http_text)` - Callback fired on AJAX failure
* `options.results_header` - Header for results container (can be Node/ID/raw html or callback returning one of the previous)
* `options.results_footer` - Footer for results container (can be Node/ID/raw html or callback returning one of the previous)

Along with the standard events, quickspot will also fire the following additional events on the input it is attached to.

* `quickspot:start` - Fired each time a quickspot search is triggered.
* `quickspot:end` - Fired each time a quickspot search completes.
* `quickspot:showresults` - whenever result container is displayed
* `quickspot:hideresults` - whenever results container is hidden
* `quickspot:activate` - Fired whenever a quickspot item is invoked
* `quickspot:select` - Fired whenever a result in quickspot is selected
* `quickspot:result` - Fired whenever a quickspot displays some results
* `quickspot:noresults` - Fired whenever a quickspot search finds no results.
* `quickspot:resultsfound` - Fired whenever a quickspot search returns results.
* `quickspot:ready` - Fired when quickspot is fully loaded
* `quickspot:loaded` - Fired whenever a new datastore is attached & ready
* `quickspot:init` - Fired the first time quickspot loads its datastore

A few additional options can be accessed via setting certain attributes on the search data object. These can either be set within callbacks, or as part of the initial data set.

* `qs_result_class` - When set, the class name stored in the attribute will be used as a class on the rendered result's anchor element.
* `qs_screenreader_text` - Sets text to be read by screenreader for this result
* `__searchvalues` and `__keyvalue` - By setting both these values, quickspot will assume all data has already been "processed" in to valid quickspot search objects. If only one is set, quickspot will overwrite these values via its normal pre-processing mechanism. Please ensure the `string_filter` returns the same formatting.

Finally, quickspot also exposes a number of methods on the created instance.

 * `qs.on(event, callback)` - Helper for quickly attaching events to quickspot
 * `qs.filter(filter_value)` - Filter data set, applies to all searches on datastore
 * `qs.filter(filter_value, attribute)` - Apply dataset filter to a single attribute.
 * `qs.clearFilters()` - Removes all currently attached filters from datastore
 * `qs.showResults()` - Show results container
 * `qs.hideResults()` - Hide results container
 * `qs.setDatastore(newDatastore)` - Set a new datastore. Datastores can be created via `quickspot.datastore({url: "bla"});`
 * `qs.refresh()` - Refresh current search results (use when updating a datastore)
 * `qs.datastore` - provides access to the datastore object itself.

Additional data stores can be created using:

 	quickspot.datastore({url: "url"});

This will return a quickspot datastore container, within it a datastore will be created as `store` once it has been initialized. Use `options.loaded(ds)` to add a callback to listen for this. 
The quickspot datastore container can also be added directly to the `setDatastore` method on quickspot. Options are the same as for quickspot.
