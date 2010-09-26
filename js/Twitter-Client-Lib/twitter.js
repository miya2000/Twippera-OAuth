/*
 * Twitter Client implementation.
 * Copyright (c) 2010 miya2000 (http://d.hatena.ne.jp/miya2000/)
 * 
 * The MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var Twitter;
if (typeof Twitter == 'undefined') Twitter = {};

(function() {

Twitter.Client = TwitterClient;
Twitter.APIAgent = TwitterAPIAgent;

function TwitterClient(info, accessor) {
    this.info = {
        name  : 'Twitter Client implementation',
        realm : null,
        userAgent : null
    }
    transplant(this.info, info);
    this.accessor = {
        consumerKey    : null,
        consumerSecret : null,
        token          : null,
        tokenSecret    : null
    };
    transplant(this.accessor, accessor);
    initializeEventDispatcher(this);
};

var TC = TwitterClient;
TC.prototype.constractor = TwitterClient;

TC.prototype.clearCredential = function() {
    this.accessor.token = null;
    this.accessor.tokenSecret = null;
};
TC.prototype.registerCredential = function(token, tokenSecret) {
    this.accessor.token = token;
    this.accessor.tokenSecret = tokenSecret;
};
TC.prototype.createAgent = function(method) {
    if (!(method in Twitter.API)) {
        throw new Error('unsupported API.');
    }
    return new Twitter.APIAgent(this, Twitter.API[method]);
};
TC.prototype.requestToken = function requestToken(callback) {
    var agent = this.createAgent('oauth/request_token');
    var req = agent.send();
    var self = this;
    req.onload = function() {
        if (self.handleResponseCode(req, agent)) {
            var rr = OAuth.getParameterMap(req.responseText);
            self.registerCredential(rr['oauth_token'], rr['oauth_token_secret']);
            if (callback) callback.apply(this, [req]);
        }
    };
};
TC.prototype.getAuthorizeURL = function getAuthorizeURL() {
    if (!this.accessor.token) throw new Error('accessor.token not set.');
    return Twitter.API['oauth/authorize'].url + '?oauth_token=' + this.accessor.token;
};
TC.prototype.verifyClient = function verifyClient(pin, callback, errorback) {
    var agent = this.createAgent('oauth/access_token');
    agent.oparams = { 'oauth_verifier' : pin };
    var req = agent.send();
    var self = this;
    req.onload = function() {
        if (self.handleResponseCode(req, agent)) {
            var rr = OAuth.getParameterMap(req.responseText);
            self.registerCredential(rr['oauth_token'], rr['oauth_token_secret']);
            if (callback) callback.apply(this, [req]);
        }
        else {
            if (errorback) errorback.apply(this, [req]);
        }
    };
};
TC.prototype.verifyCredentials = function(callback, errorback) {
    var agent = this.createAgent('account/verify_credentials');
    var req = agent.send();
    var self = this;
    req.onload = function() {
        if (self.handleResponseCode(req, agent)) {
            if (callback) callback.apply(this, [req]);
        }
        else {
            if (errorback) errorback.apply(this, [req]);
        }
    };
};
TC.prototype.handleResponseCode = function handleResponseCode(xhr, agent) {
    if (xhr.status == '200') return true;
    if (xhr.status == '401') {
        this.clearCredential();
        this.dispatchEvent({
            type : 'unauthorized',
            response: xhr,
            agent: agent
        });
    }
    else {
        this.dispatchEvent({
            type : 'error',
            response: xhr,
            agent: agent
        });
    }
    return false;
};
TC.prototype.createHttpRequest = function createHttpRequest() {
    return new XMLHttpRequest();
};

/*
 * TwitterAPIAgent
 */
function TwitterAPIAgent(client, api) {
    
    this.detectError = detectError;
    this.buildURL = buildURL;
    this.send = send;
    
    var self = this;
    function detectError() {
        if(api.detectError) api.detectError.apply(self, arguments);
    }
    function buildURL() {
        var url = self.url || api.url;
        if (api.formats) {
            url = url.replace(/\.format$/, '.' + (self.format || api.formats[0]));
        }
        if (api.params && ('id' in api.params) && self.params && self.params.id) {
            url = url.replace(/\/id\.(\w+)$/, '/' + self.params.id + '.$1');
        }
        return url;
    }
    function send() {
        var message = {
            action: self.buildURL(),
            method: self.method || api.method,
            parameters : {}
        };
        
        var params = {};
        if (self.params) {
            for (var k in self.params) {
                if (k in api.params) {
                    params[k] = self.params[k];
                }
            }
        }
        if (params.id) delete params.id; // @see #buildURL
        
        var headers = self.headers || {};
        var data = self.params ? OAuth.formEncode(params) : null;
        if (!/^post$/i.test(message.method) && data) {
            message.action = message.action + '?' + data;
            data = null;
        }
        var x = client.createHttpRequest();
        x.open(message.method, message.action, self.asynch != null ? self.asynch : true);
        if (/^post$/i.test(message.method)) {
            x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        }
        if (client.info.userAgent) {
            x.setRequestHeader('User-Agent', client.info.userAgent);
        }
        if (self.auth != null ? self.auth : api.auth) {
            if (self.params ) OAuth.setParameters(message, params);
            if (self.oparams) OAuth.setParameters(message, self.oparams);
            OAuth.completeRequest(message, client.accessor);
            x.setRequestHeader('Authorization', OAuth.getAuthorizationHeader(client.info.realm || client.info.name, message.parameters));
        }
        for (var k in headers) {
            x.setRequestHeader(k, headers[k]);
        }
        x.send(data);
        return x;
    }
}

// util.
function transplant(a, b) {
    if (!a || !b) return;
    for (var key in a) {
        if (a.hasOwnProperty(key) && b[key] != null) {
            a[key] = b[key];
        }
    }
}
function postError(e) {
    if (window.opera) {
        opera.postError(e);
    }
    else if (window.console) {
        console.error(e);
    }
}
// EventDispatcher
// @see http://www.fladdict.net/blog-jp/archives/2005/06/javascript.php
// @see http://www.adobe.com/support/documentation/jp/flex/1/mixin/mixin3.html
function initializeEventDispatcher(obj) {
    var ec = {};
    obj.addEventListener = function(type, listener) {
        if (ec[type] == null) ec[type] = new Array(); 
        else this.removeEventListener(type, listener);
        ec[type].push(listener);
    };
    obj.removeEventListener = function(type, listener) {
        if (ec[type] == null) return;
        var listeners = ec[type];
        for (var i = listeners.length - 1; i >= 0; i--) {
            if ((listeners[i] === listener) ? listeners.splice(i, 1) : false) break;
        }
    };
    obj.dispatchEvent = function(event) {
        if (ec[event.type] == null) return;
        if (event.target == null) event.target = this;
        for (var i = 0, listeners = ec[event.type], len = listeners.length; i < len; i++) {
            try {
                var l = listeners[i];
                if (typeof(l) == 'function') l.call(this, event);
                else new Function(l).call(this, event);
            }
            catch(e) {
                postError(e);
            }
        }
    };
};

})();