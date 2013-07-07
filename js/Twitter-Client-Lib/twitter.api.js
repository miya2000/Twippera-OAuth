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
    //OAuth API
    {
        name: 'oauth/request_token',
        description: 'Allows a Consumer application to obtain an OAuth Request Token to request user authorization. ',
        url: 'https://api.twitter.com/oauth/request_token',
        method: 'GET',
        auth: true
    },
    {
        name: 'oauth/authorize',
        description: 'Allows a Consumer application to use an OAuth Request Token to request user authorization. ',
        url: 'https://api.twitter.com/oauth/authorize',
        method: 'GET',
        auth: true
    },
    {
        name: 'oauth/access_token',
        description: 'Allows a Consumer application to exchange the OAuth Request Token for an OAuth Access Token. ',
        url: 'https://api.twitter.com/oauth/access_token',
        method: 'POST',
        auth: true,
        oparams: {
            'oauth_verifier': null
        },
        detectError: function() {
            this.error = null;
            if (!this.oparams.oauth_verifier) {
                return this.error = { 'oauth_verifier': { 'type': 'required' } };
            }
        }
    },
    //Core API.
    {
        name: 'statuses/mentions_timeline',
        description: 'Returns the 20 most recent mentions (tweets containing a users\'s @screen_name) for the authenticating user. ',
        url: 'https://api.twitter.com/1.1/statuses/mentions_timeline.json',
        method: 'GET',
        auth: true,
        params: {
            'count': null,
            'since_id': null,
            'max_id': null,
            'trim_user': null,
            'contributor_details': null,
            'include_entities': null
        }
    },
    {
        name: 'statuses/user_timeline',
        description: 'Returns a collection of the most recent Tweets posted by the user indicated by the screen_name or user_id parameters. ',
        url: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
        method: 'GET',
        auth: true, // if requesting a protected user's timeline.
        params: {
            'user_id': null,
            'screen_name': null,
            'since_id': null,
            'count': null,
            'max_id': null,
            'trim_user': null,
            'exclude_replies' : null,
            'contributor_details' : null,
            'include_rts' : null
        }
    },
    {
        name: 'statuses/home_timeline',
        description: 'Returns a collection of the most recent Tweets and retweets posted by the authenticating user and the users they follow. The home timeline is central to how most users interact with the Twitter service. ',
        url: 'https://api.twitter.com/1.1/statuses/home_timeline.json',
        method: 'GET',
        auth: true,
        params: {
            'count': null,
            'since_id': null,
            'max_id': null,
            'page': null,
            'trim_user': null,
            'exclude_replies' : null,
            'contributor_details' : null,
            'include_entities': null
        },
        detectError: function() {
            this.error = null;
            if (this.params.count && Number(this.params.count) > 200) {
                return this.error = { 'count': { 'type': 'limit over', 'value': 200 } };
            }
        }
    },
    {
        name: 'statuses/retweets_of_me',
        description: 'Returns the most recent tweets authored by the authenticating user that have been retweeted by others. This timeline is a subset of the user\'s GET statuses/user_timeline. ',
        url: 'https://api.twitter.com/1.1/statuses/retweets_of_me.json',
        method: 'GET',
        auth: true,
        params: {
            'count': null,
            'since_id': null,
            'max_id': null,
            'trim_user': null,
            'include_entities': null,
            'include_user_entities': null
        }
    },
    {
        name: 'statuses/retweets',
        description: 'Returns up to 100 of the first retweets of a given tweet. ',
        url: 'https://api.twitter.com/1.1/statuses/retweets/:id.json',
        method: 'GET',
        auth: true,
        params: {
            'id': null,
            'count': null,
            'trim_user': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'statuses/show',
        description: 'Returns a single Tweet, specified by the id parameter. The Tweet\'s author will also be embedded within the tweet. ',
        url: 'https://api.twitter.com/1.1/statuses/show.json',
        method: 'GET',
        auth: true,
        params: {
            'id': null,
            'trim_user': null,
            'include_my_retweet': null,
            'include_entities': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'statuses/destroy',
        description: 'Destroys the status specified by the required ID parameter. The authenticating user must be the author of the specified status. Returns the destroyed status if successful. ',
        url: 'https://api.twitter.com/1.1/statuses/destroy/:id.json',
        method: 'POST',
        auth: true,
        params: {
            'id': null,
            'trim_user': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'statuses/update',
        description: 'Updates the authenticating user\'s current status, also known as tweeting. To upload an image to accompany the tweet, use POST statuses/update_with_media.',
        url: 'https://api.twitter.com/1.1/statuses/update.json',
        method: 'POST',
        auth: true,
        params: {
            'status': null,
            'in_reply_to_status_id': null,
            'lat': null,
            'long': null,
            'place_id' : null,
            'display_coordinates' : null,
            'trim_user' : null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.status) {
                return this.error = { 'status': { 'type': 'required' } };
            }
            if (bover(this.params.status, 140)) {
                return this.error = { 'status': { 'type': 'limit over', 'value': 140 } };
            }
        }
    },
    {
        name: 'statuses/retweet',
        description: 'Retweets a tweet. Returns the original tweet with retweet details embedded. ',
        url: 'https://api.twitter.com/1.1/statuses/retweet/:id.json',
        method: 'POST',
        auth: true,
        params: {
            'id': null,
            'trim_user': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'statuses/retweeters/ids',
        description: 'Returns a collection of up to 100 user IDs belonging to users who have retweeted the tweet specified by the id parameter. ',
        url: 'https://api.twitter.com/1.1/statuses/retweeters/ids.json',
        method: 'GET',
        auth: true,
        params: {
            'id': null,
            'cursor': null,
            'count': null,
            'stringify_ids': null
        },
        detectError: function() {
            this.error = null;
            if (!this.params.id) {
                return this.error = { 'id': { 'type': 'required' } };
            }
        }
    },
    {
        name: 'account/verify_credentials',
        description: 'Returns an HTTP 200 OK response code and a representation of the requesting user if authentication was successful; returns a 401 status code and an error message if not. Use this method to test if supplied user credentials are valid. ',
        url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
        method: 'GET', // I want to change HEAD but API returns 401...
        auth: true,
        params: {
            'include_entities': null,
            'skip_status': null
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
