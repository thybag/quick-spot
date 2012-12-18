# Quick Spot

Quickspot is a fast, flexible JSON powered in-memory search. 

This Quick-spot is free to use and licensed under the MIT license.

## Quick start

1. Download a copy of quickspot.js
2. include quickspot.js in to your webpage
3. call `quickspot.attach({"url":"<path_to_JSON>", "target":"<id_of_searchbox>"});`

See the demo for more information. Tested in Chrome, Firefox and IE7+

## Basic configuration

Quickspot is designed to do an in-memory search on a provided array of JSON objects. By default it assumes the title of each item will be in an attribute called "name". (See: option.key_value if this is not the case.)

At minimum both `target` and either `data` or `url` must be provided to the quickspot attach method.

If a json object has a "url" attribute quick-spot will attempt to redirect to that URL when the result is clicked. If no url attribute is found quickspot will instead simply populate the attached search box with the value it has found (similar to a type-ahead). If you would like to do somthing more clever here, please refer to option.clickhandler.

**option.target** - The target option specifies the ID of the searchbox you would like quickspot to attach a search to.

**option.url** - The url option can be used to provide the path to the JSON file containing the information you wish to search on.

**option.data** -The data option can be used to pass a JSON directly in to the attach method.


## Advanced configuration

Quickspot impliments a number of advanced methods which can be used to futher customise how quick-spot functions.

**option.key_value** - Use this to specify the name of the primary attribute in the objects. For example name/title. Results matching this value will be ranked higher. By default quickspot assumes this attribute is called "name".

**option.displayname** - If you would like search results to show a value other than what is contained in key_value (normally "name") set this attribute here.

**option.displayhandler** - Provide a callback here to fully control how each item displays in the search results. The callback with be passed the json object for the given item. Full html can be used here.

**option.clickhandler** - A callback to define what should happen when an item is selected. This callback is passed the json object for the selected item.

**option.searchon** - An array defining which attributes in your JSON quickspot should pay attention to. If this is not set quickspot will look at all of them.