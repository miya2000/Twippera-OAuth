// twippera.js

var Twippera = {
    version  : '20100901-1-oauth',
    release  : 36,
    TID      : null,
    parse    : true,
    postMsgs : [],
    PMindx   : 0,
    timeout  : 30000,
    fcount   : 0,
    msgState : "recent",
    itemfocus: null,
    clientInfo: {
        name: 'Twippera'
    }
}

    Twippera.initClient = function() {
        var ckey = Widget.getValue('oauth_consumer_key');
        var csec = Widget.getValue('oauth_consumer_secret');
        var token = Widget.getValue('oauth_token');
        var tokenSecret = Widget.getValue('oauth_token_secret');
        if (!ckey || !csec || !token || !tokenSecret) {
            Twippera.auth_unauthorized();
            return false;
        }
        var client = Twippera.client = new Twitter.Client(Twippera.clientInfo, {
            consumerKey: ckey,
            consumerSecret: csec,
            token: token,
            tokenSecret: tokenSecret
        });
        client.addEventListener('unauthorized', function() {
            Twippera.auth_unauthorized();
            Twippera.auth();
        });
        Twippera.auth_authorized();
        return true;
    };
    Twippera.auth_authorized = function() {
        removeClass($('login'), 'unauthorized');
        appendClass($('login'), 'authorized');
    };
    Twippera.auth_unauthorized = function() {
        removeClass($('login'), 'authorized');
        appendClass($('login'), 'unauthorized');
    };
    Twippera.auth_clearCredential = function() {
        Widget.setValue('', 'oauth_token');
        Widget.setValue('', 'oauth_token_secret');
    };

    var authClient = null;
    var authCallback = null;
    Twippera.auth = function(callback) {
        authCallback = callback; // overwrite.
        // return if already shown.
        if ($('auth_popup').style.display == 'block') {
            return;
        }
        $('consumer_key').value = Widget.getValue('oauth_consumer_key');
        $('consumer_secret').value = Widget.getValue('oauth_consumer_secret');
        $('oauth_pin').value = '';
        $('auth_error_msg').textContent = '';
        if ($('consumer_key').value && $('consumer_secret').value) {
            Twippera.auth_updateStep(3);
        }
        else {
            Twippera.auth_updateStep(1);
        }
        Twippera.blockUI($('auth_popup'));
    };
    Twippera.auth_init = function() {
        var goto_step2 = function(e) {
            var step = Twippera.auth_currentStep();
            if (step < 2) {
                Twippera.auth_updateStep(2);
            }
        };
        $('consumer_app').addEventListener('click', goto_step2, false);
        $('auth_step2').addEventListener('click', goto_step2, false);
        $('consumer_key').addEventListener('focus', goto_step2, false);
        $('consumer_secret').addEventListener('focus', goto_step2, false);
        var observe_consumer_input = function(e) {
            var ckey = $('consumer_key').value;
            var csec = $('consumer_secret').value;
            if (/\w/.test(ckey) && /\w/.test(csec)) {
                Twippera.auth_updateStep(3);
            }
            else {
                Twippera.auth_updateStep(2);
            }
        };
        $('consumer_key').addEventListener('input', observe_consumer_input, false);
        $('consumer_secret').addEventListener('input', observe_consumer_input, false);
        var goto_step4 = function(e) {
            var step = Twippera.auth_currentStep();
            if (step == 3) {
                Twippera.auth_updateStep(4);
            }
        };
        $('oauth_auth').addEventListener('click', goto_step4, false);
        $('auth_step4').addEventListener('click', goto_step4, false);
        $('oauth_pin').addEventListener('focus', goto_step4, false);
        var observe_pin_input = function(e) {
            var step = Twippera.auth_currentStep();
            $('auth_done').disabled = (step < 4 || /^\s*$/.test($('oauth_pin').value));
        };
        $('oauth_pin').addEventListener('input', observe_pin_input, false);
        
        $('oauth_auth').addEventListener('click', function(e) {
            e.preventDefault();
            Twippera.auth_requestToken();
        }, false);
        $('auth_done').addEventListener('click', function(e) {
            e.preventDefault();
            Twippera.auth_verify();
        }, false);
        
        var auth_cancel = Twippera.auth_cancel;
        $('auth_pclose').addEventListener('click', auth_cancel, false);
        $('auth_cancel').addEventListener('click', auth_cancel, false);
    };
    Twippera.auth_cancel = function() {
        Twippera.unblockUI();
        authClient = null;
        authCallback = null;
    };
    Twippera.auth_updateStep = function(auth_step) {
        var step = Number(auth_step) || 1;
        var steps = [$('auth_step1'), $('auth_step2'), $('auth_step3'), $('auth_step4')];
        for (var i = 0, n; n = steps[i]; i++) {
            removeClass(n, 'current_step');
        }
        appendClass(steps[step - 1], 'current_step');
        $('oauth_pin').disabled = (step < 3);
        $('auth_done').disabled = (step < 4 || /^\s*$/.test($('oauth_pin').value));
    };
    Twippera.auth_currentStep = function(auth_step) {
        var steps = [$('auth_step1'), $('auth_step2'), $('auth_step3'), $('auth_step4')];
        for (var i = 0, n; n = steps[i]; i++) {
            if (hasClass(n, 'current_step')) return (i + 1);
        }
        return 1;
    };
    Twippera.auth_requestToken = function() {
        var ckey = trim($('consumer_key').value);
        var csec = trim($('consumer_secret').value);
        if (!/\w/.test(ckey) || !/\w/.test(csec)) {
            $('auth_error_msg').textContent = 'This operation requires Consumer key/secret.(Step 2).';
            Twippera.auth_updateStep(2);
            return;
        }
        authClient = new Twitter.Client(Twippera.clientInfo, {
            consumerKey: ckey,
            consumerSecret: csec
        });
        authClient.requestToken(function() {
            $('oauth_pin').value = '';
            var authURL = authClient.getAuthorizeURL();
            $('oauth_auth').href = authURL;
            widget.openURL(authURL);
            Twippera.auth_updateStep(4);
        },
        function() {
            $('auth_error_msg').textContent = 'request token failed. Please check input values and retry.'
        });
    };
    Twippera.auth_verify = function() {
        if (!authClient) {
            $('auth_error_msg').textContent = 'This operation requires authorize application(Step 3).'
            Twippera.auth_updateStep(3);
            return;
        }
        $('auth_error_msg').textContent = '';
        var pin = trim($('oauth_pin').value);
        authClient.verifyClient(pin, function() {
            authClient.verifyCredentials(function(xhr) {
                var json = JSON.parse(xhr.responseText);
                var user = json.screen_name;
                Twippera.config.user = user;
                Widget.setValue(user, 'user');
                Widget.setValue(authClient.accessor.consumerKey, 'oauth_consumer_key');
                Widget.setValue(authClient.accessor.consumerSecret, 'oauth_consumer_secret');
                Widget.setValue(authClient.accessor.token, 'oauth_token');
                Widget.setValue(authClient.accessor.tokenSecret, 'oauth_token_secret');
                Twippera.initClient();
                Twippera.unblockUI();
                authClient = null;
                if (authCallback) {
                    var f = authCallback;
                    authCallback = null;
                    f();
                }
            });
        },
        function() {
            $('auth_error_msg').textContent = 'verification failed. Please check input values and retry.'
        });
    };

    Twippera.initEvent = function() {
        Twippera.auth_init();
        var self = this;
        var config = self.config;
        var locale = config.locale;

//        $('header').addEventListener('dblclick', function() {
//            self.foldMsgList();
//        }, false);

        $('reload').addEventListener('click', function(e){
            if(config.ear) {
                self.autoReflesh();
            } else {
                self.post("friends_timeline");
            }
            if(Widget.getValue('state') == 'back') {
                self.flipWidget('front');
            } 
        }, false);

        $('pref').addEventListener('click', function(e) {
            if(Widget.getValue('state') == 'front') {
                self.flipWidget('back');
            } else {
                self.flipWidget('front');
            }
        }, false);
        
        $('wclose').addEventListener('click', function(e) {
            window.close();
        }, false);

        $('post').addEventListener('click', function() {
            self.post('update');
        }, false);

        $('save').addEventListener('click', function() {
            self.config.init();
        }, false);

        $('about').addEventListener('click', function() {
            self.showPopup(
                config.langs.abt,
                [
                    "&nbsp;",
                    config.langs.version,
                    ": ",
                    self.version,
                    ' (<a href="http://widgets.opera.com/widget/6522">',
                        config.langs.download,
                    '</a>)'
                ].join(""),
                [
                    "&nbsp;",
                    config.langs.author,
                    ': <a href="http://higeorange.com/">Higeorange</a> ',
                    '(<a href="http://twitter.com/higeorange">Twitter</a>)'
                ].join(''),
                [
                    "&nbsp;",
                    config.langs.design,
                    ': tobetchi (<a href="http://twitter.com/tobetchi">Twitter</a>)'
                ].join(''),
                "",
                config.langs.trans,
                '&nbsp;Español: Eduardo Escáre',
                '&nbsp;Magyor: Tamás Zahol',
                '&nbsp;Lietuviškai: Gediminas Ryženinas',
                '&nbsp;Русский: Andrew Ustimov, anton, neonmailbox',
                '&nbsp;Italiano: Alberto Raffaele Casale', 
                '&nbsp;Português: Eduardo Medeiros Schut',
                '&nbsp;简体中文: Jimmy Lvo',
                '&nbsp;Français: Yoann007',
                '&nbsp;Deutsch: Andrew Kupfer',
                '&nbsp;Ймення на рідній мові: Victoria Herukh',
                '&nbsp;Latviešu: Ivars Šaudinis',
                '&nbsp;Norsk bokmål: Brede Kaasa',
                '&nbsp;Português BR Carlos Gomes'
            );
        }, false);

        $('recent').addEventListener('click', function() {
            self.display('recent');
        }, false);

        $('replies').addEventListener('click', function() {
            self.display('replies');
        }, false);

        $('favorites').addEventListener('click', function() {
            self.display('favorites');
        }, false);

        $('pclose').addEventListener('click', function() {
            self.hidePopup();
        }, false);

        $('status').addEventListener('keyup', function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var status = $('status').value
            var rest   = 140 - status.length;
            $('count').innerHTML = (rest >= 0) ? rest : 0;
        }, false);

        $('query').addEventListener('keyup', function(evt) {
            var query = $('query').value;
            self.cache.updateCond(function(c) {
                return c["usr"].indexOf(query) > -1;
            });
        }, false);

        new KeyBinds($('status'), {
            "Up": function(evt) {
                if(self.postMsgs[self.PMindx + 1] && !evt.shiftKey) {
                    self.showPostHistory('back');
                }
            },
            "Down": function(evt) {
                if(self.postMsgs[self.PMindx - 1] && !evt.shiftKey) {
                    self.showPostHistory('forward');
                }
            }
        }).load();
    };
    Twippera.showPostHistory = function(to) {
        var status = $('status')
        if(to == 'back') {
            if(this.PMindx == 0) {
                this.postMsgs[0] = {
                    msg: $('status').value,
                    post: 0
                };
            }
            this.PMindx++;
        } else if (to == 'forward') {
            this.PMindx--;
        }
        status.value = this.postMsgs[this.PMindx].msg;
        setCaretPosition(status, status.value.length);
    };

    Twippera.foldMsgList = function() {
        switch (Widget.getValue('list')) {
            case "show":
                $('updateList').style.height = '0'
                Widget.setValue('hide', 'list');
                break;
            case "hide":
                $('updateList').style.height = '280px'
                Widget.setValue('show', 'list');
                break;
            default:
                break;
        }
    };

    Twippera.flipWidget = function(to) {
        switch (to) {
            case "back":
                $('front').style.display  = "none";
                $('config').style.display = "block";
                Widget.setValue('back', 'state');
                break;
            case "front":
                $('front').style.display  = "block";
                $('config').style.display = "none";
                Widget.setValue('front', 'state');
                break;
            default:
                break;
        }
    };

    Twippera.autoReflesh = function() {
        clearInterval(this.TID);
        var self = this;
        this.post("friends_timeline");
        this.TID = setInterval(
            function(){ self.post("friends_timeline") },
            Twippera.config.time);
    };

    Twippera.clearAutoReflesh = function() {
        if (this.TID) {
            clearInterval(this.TID);
            this.TID = null;
        }
    };

    Twippera.post = function(postType) {

        var client = Twippera.client;
        if (!client) {
            Twippera.auth(retry(arguments, this));
            return;
        }

        var self = this;
            self.hidePopup();
        var config = Twippera.config;
        var locale = config.locale;
        var cache = self.cache;


        var status = "";
        var in_reply_to_status_id = null;
        var type;
        $('reload').style.backgroundImage = 'url("images/loading.gif")';

        if(postType == 'update') {
            type = "POST"
            status = $('status').value;
            if(status == "") return;
            $('status').value = "";
            if(self.postMsgs[0]) {
                if(!self.postMsgs[0].post) {
                    self.postMsgs.shift();
                }
            }
            self.postMsgs.unshift({msg: "", post : 0}, {msg: status, post: 1});
            self.PMindx = 0;
            in_reply_to_status_id = Twippera.replies.in_reply_to_status_id;
            Twippera.replies.clearInReplyTo();
        } else {
            type = "GET"
//            type = "POST" //POST はほんとはだめ. 新しい機能試すときだけ
            if(this.fcount > 10) {
                self.favorite.get(false);
                this.fcount = 0;
            } else {
                this.fcount++;
            }
        }

        var apiMethod = 'statuses/' + postType;
        // friends_timeline is deprecated.
        if (postType == 'friends_timeline') {
            apiMethod= 'statuses/home_timeline';
        }
        var agent = client.createAgent(apiMethod);
        agent.format = 'json';
        agent.params = {};
        if (postType == 'friends_timeline') {
            agent.params.include_rts = '0';
            agent.params.include_entities = '1';
        }
        if (status) agent.params.status = status;
        if (in_reply_to_status_id) agent.params.in_reply_to_status_id = in_reply_to_status_id;
        var xhr = agent.send();
        var timeout = new Timer(
            config.timeout, 
            function() {
                xhr.abort();
                self.showPopup(config.langs.timeout);
                $('reload').style.backgroundImage = 'url("images/reload.gif")';
                log(agent.buildURL(), "Timeout");
            }
        );
        xhr.onload = function() {
            timeout.dispose();
            if (client.handleResponseCode(xhr, agent)) {
                if(postType == 'friends_timeline') {
                    cache.update(xhr.responseText);
                } else if(postType == 'update') {
                    cache.update('[' + xhr.responseText + ']');
                }
                if(self.msgState == "recent") {
                    cache.parse();
                }
                $('reload').style.backgroundImage = 'url("images/reload.gif")';
                status = $('status').value;
                var rest   = 140 - status.length;
                $('count').innerHTML = (rest >= 0) ? rest : 0;
            }
            else {
                log(agent.buildURL() + ": " + xhr.status + ": " + xhr.statusText);
                $('reload').style.backgroundImage = 'url("images/reload.gif")';
            }
        };
    };

    Twippera.destroy = function(id) {
        var client = Twippera.client;
        if (!client) {
            Twippera.auth(retry(arguments, this));
            return;
        }
        var agent = client.createAgent('statuses/destroy');
        agent.params = {
            id: id
        };
        var req = agent.send();
        req.onload = function() {
            removeNode($('_' + id));
            Twippera.cache.remove(id);
        };
        if (id == Twippera.replies.in_reply_to_status_id) {
            Twippera.replies.clearInReplyTo();
        }
    }
    Twippera.display = function(to) {
        if(this.msgState == to) return;
        $(this.msgState).style.backgroundColor = "#dae6f5";
        $(this.msgState).style.color = "#666";
        switch(to) {
            case "replies":
                $('updateList').scrollTop = 0;
                $('replies').style.backgroundColor = "#328BE0";
                $('replies').style.color = "#fff";

                Twippera.parse = false;
                Twippera.msgState = "replies";
                Twippera.replies.get();
                break;
            case "favorites":
                $('updateList').scrollTop = 0;
                $('favorites').style.backgroundColor = "#328BE0";
                $('favorites').style.color = "#fff";

                Twippera.parse = false;
                Twippera.msgState = "favorites";
                Twippera.favorite.get(true);
                break;
            case "recent":
                $('updateList').scrollTop = 0;
                $('recent').style.backgroundColor = "#328BE0";
                $('recent').style.color = "#fff";

                Twippera.parse = true;
                Twippera.msgState = "favorites";
                Twippera.msgState = "recent";
                Twippera.cache.parse();
                break;
            default:
                break;
        }
    }

    Twippera.config = {
        locale  : "en",
        langs   : {},
        lng     : null,
        time    : 60000,
        limit   : 200
    };
    Twippera.config.init = function() {

        var time = parseInt($('reflesh').value, 10) * 1000 * 60;
        Widget.setValue(time, "time");
        if($('sar').checked) {
            Widget.setValue("true", "enableReflesh");
        } else {
            Widget.setValue("false", "enableReflesh");
            clearInterval(this.TID);
        }

        var timeout = parseInt($('timeout').value, 10) * 1000;
        Widget.setValue(timeout, 'timeout');

        var limit = parseInt($('cache').value, 10);
        Widget.setValue(limit, 'limit');

        var localeSel = $("locale");
        var locale = localeSel.value;
        Widget.setValue(locale, "locale");

        this.load();
        Twippera.flipWidget('front');
    };
    Twippera.config.load = function() {
        Widget.setValue('front', 'state');
        Widget.setValue('show', 'list');
        this.locale = Widget.getValue("locale") || "en";
        $('locale').selectedIndex = localeIndex[this.locale];
        this.setLocale(this.locale);
        this.user = Widget.getValue('user');
        this.time = Widget.getValue('time');
        this.ear  = Widget.getValue('enableReflesh', 'Boolean');
        this.timeout = Widget.getValue('timeout', 'Number');
        this.limit = Widget.getValue('limit', 'Number');

        $('count').innerHTML = '140';

        Twippera.initClient();
        if (Twippera.client) {

            $(Twippera.msgState).style.backgroundColor = "#328BE0"
            $(Twippera.msgState).style.color = "#fff"

            if(Twippera.fcount > 4) {
                Twippera.favorite.get(false);
                Twippera.fcount = 0;
            } else {
                Twippera.fcount++;
            }

            if(this.ear) {
                $("sar").checked = true;
                $("reflesh").value = this.time / 60000; 
                Twippera.autoReflesh();
            } else {
                $("sar").checked = false;
                Twippera.clearAutoReflesh();
                Twippera.post('friends_timeline');
            }
            $('timeout').value = this.timeout / 1000;
            $('cache').value = this.limit;
        } else {
            Twippera.flipWidget("back");
        }
    };
    Twippera.config.setLocale = function(lng) {
        this.script= document.createElement('script');
        this.script.type = 'text/javascript';
        this.script.src = './js/lng/' + lng + '.js';
        document.body.appendChild(this.script);
    };
    Twippera.config.loadLocaleFile = function(langs) {
        for(var i in langs) {
            if($(i)) {
                $(i).innerHTML = langs[i];
            }
            this.langs[i] = langs[i];
        }
        this.script.parentNode.removeChild(this.script);
    };

    Twippera.msg = function() {
        this.list = [];
        this.issort = true;
        this.limit = Twippera.config.limit;
        this.template = [
            '<li id="_#{id}" class="#{cl}">',
                '<img src="#{img}" ',
                     'alt="#{usr}" ',
                     'style="width:16px;height:16px" ',
                     'onclick="Twippera.replies.reply(\'#{usr}\',\'#{id}\')">',
                '<span class="user" ',
                      'onclick="widget.openURL(\'https://twitter.com/#{usr}\')">#{usr}',
                '</span>',
                ': ',
                '<span class="msg">',
                    '#{msg}',
                '</span>',
                '<span class="meta">',
                    '<span class="post_time">',
                        '<a href="https://twitter.com/#{usr}/status/#{id}">',
                            '#{time}',
                        '</a>',
                    '</span>',
                    '#{prot}',
                    '#{trash}',
                    '<span class="fav" ',
                        'style="background-image:url(\'#{star}\')" ',
                        'onclick="Twippera.favorite.toggle(this, \'#{id}\')">',
                    '</span>',
                '</span>',
            '</li>'].join('');
    };

    Twippera.msg.prototype.update = function(txt) {
        var config = Twippera.config;

        var json = JSON.parse(txt);
        // [{"id":,"created_at":,"text":,"user":{"name":,"profile_image_url":,"description":,"location":,"url":,"id":,"protected":,"screen_name":}},.....]
        var cl = null;
        var len = json.length;
        var tmp = [];

        for(var i = 0; i < len; i++) {
            if(this.check(json[i].id_str)) {
                if (json[i].user.screen_name == config.user) {
                    cl = 'myself';
                } else if(json[i].text.indexOf('@' + config.user) >= 0) {
                    cl = 'tome';
                } else {
                    cl = null;
                }
                tmp.push({
                    id     : json[i].id_str,
                    img    : json[i].user.profile_image_url,
                    usr    : json[i].user.screen_name,
                    msg    : json[i].text,
                    time   : json[i].created_at,
                    class  : cl,
                    prot   : json[i].user.protected,
                    cached : 0,
                    entities : json[i].entities
                });
            }
        }

        var m = 0;
        if((m = this.list.length + tmp.length - config.limit) > 0) {
            this.list.splice(this.list.length - m, m);
        }

        if(this.list.length == 0) {
            this.list = tmp;
        } else {
            this.list = tmp.concat(this.list);
        }
        if(this.issort) {
            this.sort();
        }
    };
    Twippera.msg.prototype.sort = function() {
        var list = this.list;
        var end = list.length - 1;
        for(var i = 0; i < end; i++) {
            for(var j = i + 1; j <= end; j++){
                if(list[i]['id'] < list[j]['id']) {
                    var tmp = list[i];
                    list[i] = list[j];
                    list[j] = tmp
                }
            }
        }
        this.list = list;
    };
    Twippera.msg.prototype.check = function(id) {
        for(var c = true, i = 0, len = this.list.length; i < len; i++) {
            if(this.list[i].id == id) {
                c = false;
                break;
            }
        }
        return c;
    };
    Twippera.msg.prototype.parse = function(m) {
        var config = Twippera.config;
        var list = [];
        var msgs = m || this.list;

        for(var i = 0, len = msgs.length, usr, rep, li = ""; i < len; i++) {
            usr = msgs[i];
            var tmpMsg;
            if(!usr.cached) {
                tmpMsg = Tools.createHTML(usr.msg, usr.entities);
                usr.msg = tmpMsg;
                usr.cached = 1;
            } else {
                tmpMsg = usr.msg;
            }
            var trash = "";
            if(usr.class) {
                if(usr.class.indexOf('myself') > -1) {
                    trash = '<span class="trash" onclick="Twippera.destroy(\'' + usr.id + '\')"></span>';
                }
            }
            var prot = "";
            if(usr['prot']) {
                prot = '<span class="protected"></span>'
            }
            rep = {
                id: usr.id,
                usr: usr.usr,
                cl: (i % 2 != 0) ? "zebra " + (usr.class || "") : (usr.class || ""),
                img: usr.img,
                msg: tmpMsg,
                time: Tools.createTime(usr.time, config.locale),
                trash: trash,
                prot: prot,
                star: Twippera.favorite.isFavorite(usr.id)? 
                    "images/icon_star_full.gif":
                    "images/icon_star_empty.gif"
            };

            li = this.template.replace(/#\{(\w+)\}/g, function($0, $1) {
                return rep[$1];
            });
            list.push(li);
        }
        $('updateList').innerHTML = list.join('');
        Twippera.itemfocus = null
    };

    Twippera.cache = new Twippera.msg;
    Twippera.cache.remove = function(id) {
        var list = this.list;
        var len = list.length
        for(var i = 0; i < len; i++) {
            if(id == list[i]["id"]) {
                list.splice(i, 1);
                break;
            }
        }
    }

    Twippera.replies = new Twippera.msg; 
    Twippera.replies.time = 0;
    Twippera.replies.get = function() {
        var client = Twippera.client;
        if (!client) {
            Twippera.auth(retry(arguments, this));
            return;
        }
        var n = new Date();
        if(this.time > 0 && (n - this.time) < 600000) {
            this.parse();
            return;
        }
        this.time = n;

        var self = this;

        var agent = client.createAgent('statuses/mentions_timeline');
        agent.format = 'json';
        agent.params = {
            include_entities : '1'
        };
        var xhr = agent.send();
        xhr.onload = function() {
            if (client.handleResponseCode(xhr, agent)) {
                self.update(xhr.responseText);
                self.parse();
            }
            else {
                self.time = 0;
                log(agent.buildURL(), xhr.status, xhr.statusText);
            }
        };
    }
    Twippera.replies.reply = function(user, in_reply_to_status_id) {
        var user_signature = '@' + user + ' ';
        var status   = $('status');
        var msg = status.value;
        if (msg.lastIndexOf(user_signature, 0) < 0) {
            status.value = user_signature + msg;
        }
        setCaretPosition(status, status.value.length);
        this.setInReplyTo(user_signature, in_reply_to_status_id);
    };
    
    Twippera.replies.in_reply_to_user_signature = null;
    Twippera.replies.in_reply_to_status_id = null;
    Twippera.replies.in_reply_to_mode_style = null;
    Twippera.replies.in_reply_to_observe_tid = null;
    
    Twippera.replies.setInReplyTo = function(user_signature, in_reply_to_status_id) {
        this.in_reply_to_user_signature = user_signature;
        this.in_reply_to_status_id = in_reply_to_status_id;
        if (this.in_reply_to_mode_style == null) {
            this.in_reply_to_mode_style = addStyle('');
        }
        this.in_reply_to_mode_style.innerText = 
            '#_' + escapeSelector(in_reply_to_status_id) + ' { outline: rgb(255,220,100) solid 2px } ' +
            '#status { border: rgb(255,220,100) solid 2px }';
        if (this.in_reply_to_observe_tid == null) {
            var that = this;
            this.in_reply_to_observe_tid = setInterval(function() {
                if ($('status').value.lastIndexOf(that.in_reply_to_user_signature, 0) < 0) {
                    that.clearInReplyTo();
                }
            }, 150);
        }
        $('status').addEventListener('keypress', Twippera.replies.handleEventInReplyTo, false);
        $('status').title = 'ssss';
    };
    Twippera.replies.clearInReplyTo = function() {
        this.in_reply_to_userin_reply_to_user_signature = null;
        this.in_reply_to_status_id = null;
        if (this.in_reply_to_mode_style != null) {
            removeNode(this.in_reply_to_mode_style);
            this.in_reply_to_mode_style = null;
        }
        if (this.in_reply_to_observe_tid != null) {
            clearInterval(this.in_reply_to_observe_tid);
            this.in_reply_to_observe_tid = null;
        }
        $('status').removeEventListener('keypress', Twippera.replies.handleEventInReplyTo, false);
        $('status').title = '';
    };
    // This is a function (not a method).
    Twippera.replies.handleEventInReplyTo = function(e) {
        var that = Twippera.replies;
        // clear in_reply_to if BackSpace pressed and status equals signature and no selection.
        if (e.type == 'keypress' && e.keyCode == 8) {
            var status = $('status');
            var signature = that.in_reply_to_user_signature;
            if (status.value == signature && status.selectionStart == signature.length) {
                that.clearInReplyTo();
                e.preventDefault();
            }
        }
    };

    Twippera.favorite = new Twippera.msg; 
    Twippera.favorite.favorites = [];
    Twippera.favorite.time = 0;
    Twippera.favorite.get = function(parse) {
        var client = Twippera.client;
        if (!client) {
            Twippera.auth(retry(arguments, this));
            return;
        }
        var n = new Date();
        if(this.list.length > 0 && (n - this.time) < 600000) {
            if(parse) this.parse();
            return;
        }
        this.time = n;

        var self = this;

        var agent = client.createAgent('favorites/list');
        agent.format = 'json';
        agent.async = false;
        var xhr = agent.send();
        xhr.onload = function() {
            if (client.handleResponseCode(xhr, agent)) {
                var res = xhr.responseText;
                var json = JSON.parse(res);
                for(var i = 0, len = json.length; i < len; i++) {
                    if(!self.isFavorite(json[i].id_str)) { 
                        self.favorites.push(json[i].id_str);
                    }
                }
                if(parse) {
                    self.update(res);
                    self.parse();
                }
            }
            else {
                self.time = 0;
                log(agent.buildURL(), xhr.status, xhr.statusText);
            }
        };
        xhr.onload(); // agent.async = false;
    };
    Twippera.favorite.isFavorite = function(id) {
        return this.favorites.contains(id);
    };
    Twippera.favorite.toggle = function(elm, id){
        var client = Twippera.client;
        if (!client) {
            Twippera.auth(retry(arguments, this));
            return;
        }
        var curImage = elm.style.backgroundImage;
        var self = this;
        var action;
        var c = false;

        elm.style.backgroundImage = "url('images/icon_throbber.gif')";

        if(this.isFavorite(id)) {
            action = 'favorites/destroy';
            c = true;
        } else {
            action = 'favorites/create';
        }

        var agent = client.createAgent(action);
        agent.params = {
            id: id
        };
        var xhr = agent.send();
        xhr.onload = function() {
            if (client.handleResponseCode(xhr, agent)) {
                if(c) {
                    self.favorites = self.favorites.del(id);
                    elm.style.backgroundImage = "url('images/icon_star_empty.gif')";
                } else {
                    elm.style.backgroundImage = "url('images/icon_star_full.gif')";
                    self.favorites.push(id);
                }
            }
        };
    };

    Twippera.update = {
        url : 'http://opera.higeorange.com/misc/twippera/twipperaRelease.txt'
    }
    Twippera.update.check = function() {
        var self = this;
        var config = self.config;

        Ajax.request(
            self.url,
            function(xhr) {
                var t = xhr.responseText.split(':')
                var release = parseInt(t[0], 10);
                var ver = t[1];
                if(Twippera.release < release) {
                    Twippera.showPopup(
                        config.langs.update + ' : ' + ver,
                        '<a href="http://widgets.opera.com/widget/6522/">' +
                            config.langs.download +
                        '</a>'
                    );
                }
            }, { }
        );
    };

    Twippera.showPopup = function() {
        var self = this;
        var config = self.config;

        var popup = $('popup');
            popup.style.display = 'block';

        var ppmsg = document.evaluate(
            './div/div/div/div/p[@class="msg"]',
            popup,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null).singleNodeValue;
            ppmsg.innerHTML = Array.prototype.join.call(arguments, '<br>');

        var btn = document.evaluate(
            './div/div/div/div/p/button',
            popup,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
            btn.addEventListener(
                'click',
                function(){
                    self.hidePopup();
                },
                false
            );
        var btnInner = document.evaluate(
            './span/span',
            btn,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
            btnInner.innerHTML = config.langs.close;
    };

    Twippera.hidePopup = function() {
        var popup = $('popup');
            popup.style.display = 'none';
    };

    // from nicovideo_ndr.js (http://github.com/miya2000/ndr)
    Twippera.blockUI = function(content) { // (ref:jQuery blockUI plugin)
        // if already blocking, replace content and return;
        if (this.uiBlocker) {
            if (this.uiBlocker.content) this.uiBlocker.content.style.display = 'none';
            this.uiBlocker.content = setContent(content);
            return;
        }
        
        function setContent(content) {
            content.style.position = 'absolute';
            content.style.zIndex = '1001';
            content.style.display = 'block';
            return content;
        }
        
        var uiBlocker = this.uiBlocker = {
            preActive : document.activeElement
        };
        var self = this;
        var background = uiBlocker.background = document.createElement('div');
        background.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1000; background-color: #000; opacity: 0.15;';
        background.addEventListener('mousedown', function(e) { e.preventDefault() }, false);
        background.addEventListener('dblclick', function(e) { self.unblockUI() }, false);
        document.body.appendChild(background);
        var dummy = document.createElement('input');
        dummy.style.cssText = 'visibility: hidden; width: 0; height: 0;';
        background.appendChild(dummy);
        dummy.focus();
        
        uiBlocker.content = setContent(content);
        
        uiBlocker.handler = function(e) {
            if (e.keyCode == 27) { // Esc
                self.unblockUI();
            }
            else if (e.keyCode == 9) { // Tab
                var inputs = evaluate('descendant::*[self::input or self::select or self::button or self::textarea]', uiBlocker.content); // for dynamic change.
                if (inputs.length == 0) {
                    e.preventDefault();
                }
                else if (inputs.indexOf(e.target) < 0) {
                    e.preventDefault();
                    inputs[0].focus();
                    if (inputs[0].select) inputs[0].select();
                }
                else if (e.target == inputs[0] && e.shiftKey) {
                    e.preventDefault();
                    inputs[inputs.length -1].focus();
                    if (inputs[inputs.length -1].select) inputs[inputs.length -1].select();
                }
                else if (e.target == inputs[inputs.length -1] && !e.shiftKey) {
                    e.preventDefault();
                    inputs[0].focus();
                    if (inputs[0].select) inputs[0].select();
                }
            }
        }
        window.addEventListener('keypress', uiBlocker.handler, false);
    };
    Twippera.unblockUI = function() {
        var uiBlocker = this.uiBlocker;
        if (!uiBlocker) return;
        window.removeEventListener('keypress', uiBlocker.handler, false);
        uiBlocker.background.parentNode.removeChild(uiBlocker.background);
        uiBlocker.content.style.display = 'none';
        delete this.uiBlocker;
    };

window.addEventListener('load', function() {
    preLoadImage([
        'images/loading.gif', 
        'images/icon_throbber.gif',
        'images/icon_star_empty.gif',
        'images/icon_star_full.gif',
        'images/icon_red_lock.gif'
    ]);

    Twippera.config.load();
    Twippera.initEvent()
    Twippera.update.check();
}, false);
