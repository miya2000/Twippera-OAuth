/*
 * Twitter API definition.
 * 
 * This script defines API objects to "Twitter.API".
 * A piece of API object means "API method" and It has properties listed below.
 * 
 *   name : API method name. (like 'statuses/public_timeline')
 *   description: Description of this method.
 *   url: Method URL. (The format(or id) has not been applied yet.)
 *   formats: Array of acceptable formats. ('xml', 'json', etc)
 *   method: HTTP method for this API method.
 *   auth: Requires Authentication or not.
 *   params: Available parameters.
 *   oparams: Additional OAuth parameters. (OAuth API only.)
 *   detectError: Function to validate parameters. If it detects error, returns error infomation object.
 * 
 * For API details, please refer to Twitter API Documentation. ( http://apiwiki.twitter.com/Twitter-API-Documentation )
 */
var Twitter;
if (typeof Twitter     == 'undefined') Twitter = {};
if (typeof Twitter.API == 'undefined') Twitter.API = {};

(function() {

var API = [
    //Favorite Methods.
    {
        name: 'favorites',
        description: 'Returns the 20 most recent favorite statuses for the authenticating user or user specified by the ID parameter in the requested format. ',
        url: 'http://api.twitter.com/1/favorites.format',
        formats: [ 'xml', 'json', 'rss', 'atom' ],
        method: 'GET',
        auth: true,
        params: {
            'page': null
        }
    },
    {
        name: 'favorites/show',
        description: 'Returns the 20 most recent favorite statuses for the authenticating user or user specified by the ID parameter in the requested format. ',
        url: 'http://api.twitter.com/1/favorites/id.json',
        formats: [ 'xml', 'json', 'rss', 'atom' ],
        method: 'GET',
        auth: true,
        params: {
            'id': null,
            'page': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'favorites/create',
        description: 'Favorites the status specified in the ID parameter as the authenticating user. Returns the favorite status when successful. ',
        url: 'http://api.twitter.com/1/favorites/create/id.format',
        formats: [ 'xml', 'json' ],
        method: 'POST',
        auth: true,
        params: {
            'id': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'favorites/destroy',
        description: 'Un-favorites the status specified in the ID parameter as the authenticating user. Returns the un-favorited status in the requested format when successful. ',
        url: 'http://api.twitter.com/1/favorites/destroy/id.format',
        formats: [ 'xml', 'json' ],
        method: 'DELETE', // 'POST' allowed.
        auth: true,
        params: {
            'id': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    }
];

for (var i = 0; i < API.length; i++) {
    var api = API[i];
    Twitter.API[api.name] = api;
}

//utils
function bover(str, len) {
    var b = 0;
    for(var i = 0, len = str.length; i < len; ++i) {
        ++b; if (str.charCodeAt(i) >= 128) ++b;
        if (b > len) return true;
    }
    return false;
}

})();
