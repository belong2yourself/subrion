intelli = {
    /**
     * Name of the current page
     */
    pageName: '',
    securityTokenKey: '__st',
    lang: {},

    /**
     *  Check if value exists in array
     *
     *  @param {Array} val value to be checked
     *  @param {String} arr array
     *
     *  @return {Boolean}
     */
    inArray: function (val, arr) {
        if (typeof arr === 'object' && arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == val) {
                    return true;
                }
            }
        }

        return false;
    },

    cookie: {
        /**
         * Returns the value of cookie
         *
         * @param {String} name cookie name
         *
         * @return {String}
         */
        read: function (name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }

            return null;
        },

        /**
         * Creates new cookie
         *
         * @param {String} name cookie name
         * @param {String} value cookie value
         * @param {Integer} days number of days to keep cookie value for
         * @param {String} value path value
         */
        write: function (name, value, days, path) {
            var expires = '';
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toGMTString();
            }

            path = path || '/';

            document.cookie = name + '=' + value + expires + '; path=' + path;
        },

        /**
         * Clear cookie value
         *
         * @param {String} name cookie name
         */
        clear: function (name) {
            intelli.cookie.write(name, '', -1);
        }
    },

    urlVal: function (name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(window.location.href);

        return (null === results)
            ? null
            : decodeURIComponent(results[1]);
    },

    notifBox: function (opt) {
        var msg = opt.msg;
        var type = opt.type || 'info';
        var autohide = opt.autohide || (type == 'notification' || type == 'success' || type == 'error' ? true : false);
        var pause = opt.pause || 10;
        var html = '';

        if ('notif' == type || type == 'notification') {
            type = 'success';
        }

        var boxid = 'notification';
        if (opt.boxid) {
            boxid = opt.boxid;
        }

        var obj = $('#' + boxid);
        if ($.isArray(msg)) {
            html += '<ul class="unstyled">';
            for (var i = 0; i < msg.length; i++) {
                if ('' != msg[i]) {
                    html += '<li>' + msg[i] + '</li>';
                }
            }
            html += '</ul>';
        }
        else {
            html += ['<div>', msg, '</div>'].join('');
        }

        obj.attr('class', 'alert alert-' + type).html(html).show();

        if (autohide) {
            obj.delay(pause * 1000).fadeOut('slow');
        }

        $('html, body').animate({scrollTop: obj.offset().top}, 'slow');

        return obj;
    },

    notifFloatBox: function (options) {
        var msg = options.msg,
            type = options.type || 'info',
            pause = options.pause || 3000,
            autohide = options.autohide,
            html = '';

        // building message box
        html += '<div id="notifFloatBox" class="notifFloatBox notifFloatBox--' + type + '"><a href="#" class="close">&times;</a>';
        if ($.isArray(msg)) {
            html += '<ul>';
            for (var i = 0; i < msg.length; i++) {
                if ('' != msg[i]) {
                    html += '<li>' + msg[i] + '</li>';
                }
            }
            html += '</ul>';
        }
        else {
            html += '<ul><li>' + msg + '</li></ul>';
        }
        html += '</div>';

        // placing message box
        if (!$('#notifFloatBox').length > 0) {
            $(html).appendTo('body').css('display', 'block').addClass('animated bounceInDown');

            if (autohide) {
                setTimeout(function () {
                    $('#notifFloatBox').fadeOut(function () {
                        $(this).remove();
                    });
                }, pause);
            }

            $('.close', '#notifFloatBox').on('click', function (e) {
                e.preventDefault();
                $('#notifFloatBox').fadeOut(function () {
                    $(this).remove();
                });
            });
        }
    },

    is_email: function (email) {
        return (email.search(/^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z]{2,3})+$/) > -1);
    },

    ckeditor: function (name, params) {
        if (CKEDITOR.instances[name]) {
            return false;
        }

        params = params || {};
        params.baseHref = intelli.config.clear_url;

        CKEDITOR.replace(name, params);
    },

    add_tab: function (name, text) {
        var $tab = $('<li>').append($('<a>').attr({'data-toggle': 'tab', href: '#' + name}).text(text));
        var $content = $('<div>').attr('id', name).addClass('tab-pane');

        if ($('.nav-tabs', '.tabbable').children().length == 0) {
            $tab.addClass('active');
            $content.addClass('active');
        }

        $('.nav-tabs', '.tabbable').append($tab);
        $('.tab-content', '.tabbable').append($content);
    },

    sortable: function (elem, params) {
        /*! Sortable 1.0.1 - MIT | git://github.com/rubaxa/Sortable.git */
        !function (a) {
            "use strict";
            "function" == typeof define && define.amd ? define(a) : "undefined" != typeof module && "undefined" != typeof module.exports ? module.exports = a() : "undefined" != typeof Package ? Sortable = a() : window.Sortable = a()
        }(function () {
            "use strict";
            function a(a, b) {
                this.el = a, this.options = b = b || {};
                var d = {
                    group: Math.random(),
                    sort: !0,
                    disabled: !1,
                    store: null,
                    handle: null,
                    scroll: !0,
                    scrollSensitivity: 30,
                    scrollSpeed: 10,
                    draggable: /[uo]l/i.test(a.nodeName) ? "li" : ">*",
                    ghostClass: "sortable-ghost",
                    ignore: "a, img",
                    filter: null,
                    animation: 0,
                    setData: function (a, b) {
                        a.setData("Text", b.textContent)
                    },
                    dropBubble: !1,
                    dragoverBubble: !1
                };
                for (var e in d)!(e in b) && (b[e] = d[e]);
                var g = b.group;
                g && "object" == typeof g || (g = b.group = {name: g}), ["pull", "put"].forEach(function (a) {
                    a in g || (g[a] = !0)
                }), L.forEach(function (d) {
                    b[d] = c(this, b[d] || M), f(a, d.substr(2).toLowerCase(), b[d])
                }, this), a[E] = g.name + " " + (g.put.join ? g.put.join(" ") : "");
                for (var h in this)"_" === h.charAt(0) && (this[h] = c(this, this[h]));
                f(a, "mousedown", this._onTapStart), f(a, "touchstart", this._onTapStart), I && f(a, "selectstart", this._onTapStart), f(a, "dragover", this._onDragOver), f(a, "dragenter", this._onDragOver), P.push(this._onDragOver), b.store && this.sort(b.store.get(this))
            }

            function b(a) {
                s && s.state !== a && (i(s, "display", a ? "none" : ""), !a && s.state && t.insertBefore(s, q), s.state = a)
            }

            function c(a, b) {
                var c = O.call(arguments, 2);
                return b.bind ? b.bind.apply(b, [a].concat(c)) : function () {
                        return b.apply(a, c.concat(O.call(arguments)))
                    }
            }

            function d(a, b, c) {
                if (a) {
                    c = c || G, b = b.split(".");
                    var d = b.shift().toUpperCase(), e = new RegExp("\\s(" + b.join("|") + ")\\s", "g");
                    do if (">*" === d && a.parentNode === c || ("" === d || a.nodeName.toUpperCase() == d) && (!b.length || ((" " + a.className + " ").match(e) || []).length == b.length))return a; while (a !== c && (a = a.parentNode))
                }
                return null
            }

            function e(a) {
                a.dataTransfer.dropEffect = "move", a.preventDefault()
            }

            function f(a, b, c) {
                a.addEventListener(b, c, !1)
            }

            function g(a, b, c) {
                a.removeEventListener(b, c, !1)
            }

            function h(a, b, c) {
                if (a)if (a.classList) a.classList[c ? "add" : "remove"](b); else {
                    var d = (" " + a.className + " ").replace(/\s+/g, " ").replace(" " + b + " ", "");
                    a.className = d + (c ? " " + b : "")
                }
            }

            function i(a, b, c) {
                var d = a && a.style;
                if (d) {
                    if (void 0 === c)return G.defaultView && G.defaultView.getComputedStyle ? c = G.defaultView.getComputedStyle(a, "") : a.currentStyle && (c = a.currentStyle), void 0 === b ? c : c[b];
                    b in d || (b = "-webkit-" + b), d[b] = c + ("string" == typeof c ? "" : "px")
                }
            }

            function j(a, b, c) {
                if (a) {
                    var d = a.getElementsByTagName(b), e = 0, f = d.length;
                    if (c)for (; f > e; e++)c(d[e], e);
                    return d
                }
                return []
            }

            function k(a) {
                a.draggable = !1
            }

            function l() {
                J = !1
            }

            function m(a, b) {
                var c = a.lastElementChild, d = c.getBoundingClientRect();
                return b.clientY - (d.top + d.height) > 5 && c
            }

            function n(a) {
                for (var b = a.tagName + a.className + a.src + a.href + a.textContent, c = b.length, d = 0; c--;)d += b.charCodeAt(c);
                return d.toString(36)
            }

            function o(a) {
                for (var b = 0; a && (a = a.previousElementSibling) && "TEMPLATE" !== a.nodeName.toUpperCase();)b++;
                return b
            }

            function p(a, b) {
                var c, d;
                return function () {
                    void 0 === c && (c = arguments, d = this, setTimeout(function () {
                        1 === c.length ? a.call(d, c[0]) : a.apply(d, c), c = void 0
                    }, b))
                }
            }

            var q, r, s, t, u, v, w, x, y, z, A, B, C, D = {}, E = "Sortable" + (new Date).getTime(), F = window, G = F.document, H = F.parseInt, I = !!G.createElement("div").dragDrop, J = !1, K = function (a, b, c, d, e, f) {
                var g = G.createEvent("Event");
                g.initEvent(b, !0, !0), g.item = c || a, g.from = d || a, g.clone = s, g.oldIndex = e, g.newIndex = f, a.dispatchEvent(g)
            }, L = "onAdd onUpdate onRemove onStart onEnd onFilter onSort".split(" "), M = function () {
            }, N = Math.abs, O = [].slice, P = [];
            return a.prototype = {
                constructor: a, _dragStarted: function () {
                    h(q, this.options.ghostClass, !0), a.active = this, K(t, "start", q, t, y)
                }, _onTapStart: function (a) {
                    var b = a.type, c = a.touches && a.touches[0], e = (c || a).target, g = e, h = this.options, i = this.el, l = h.filter;
                    if (!("mousedown" === b && 0 !== a.button || h.disabled)) {
                        if (h.handle && (e = d(e, h.handle, i)), e = d(e, h.draggable, i), y = o(e), "function" == typeof l) {
                            if (l.call(this, a, e, this))return K(g, "filter", e, i, y), void a.preventDefault()
                        } else if (l && (l = l.split(",").some(function (a) {
                                return a = d(g, a.trim(), i), a ? (K(a, "filter", e, i, y), !0) : void 0
                            })))return void a.preventDefault();
                        if (e && !q && e.parentNode === i) {
                            "selectstart" === b && e.dragDrop(), B = a, t = this.el, q = e, v = q.nextSibling, A = this.options.group, q.draggable = !0, h.ignore.split(",").forEach(function (a) {
                                j(e, a.trim(), k)
                            }), c && (B = {
                                target: e,
                                clientX: c.clientX,
                                clientY: c.clientY
                            }, this._onDragStart(B, !0), a.preventDefault()), f(G, "mouseup", this._onDrop), f(G, "touchend", this._onDrop), f(G, "touchcancel", this._onDrop), f(q, "dragend", this), f(t, "dragstart", this._onDragStart), f(G, "dragover", this);
                            try {
                                G.selection ? G.selection.empty() : window.getSelection().removeAllRanges()
                            } catch (m) {
                            }
                        }
                    }
                }, _emulateDragOver: function () {
                    if (C) {
                        i(r, "display", "none");
                        var a = G.elementFromPoint(C.clientX, C.clientY), b = a, c = this.options.group.name, d = P.length;
                        if (b)do {
                            if ((" " + b[E] + " ").indexOf(c) > -1) {
                                for (; d--;)P[d]({clientX: C.clientX, clientY: C.clientY, target: a, rootEl: b});
                                break
                            }
                            a = b
                        } while (b = b.parentNode);
                        i(r, "display", "")
                    }
                }, _onTouchMove: function (a) {
                    if (B) {
                        var b = a.touches[0], c = b.clientX - B.clientX, d = b.clientY - B.clientY, e = "translate3d(" + c + "px," + d + "px,0)";
                        C = b, i(r, "webkitTransform", e), i(r, "mozTransform", e), i(r, "msTransform", e), i(r, "transform", e), this._onDrag(b), a.preventDefault()
                    }
                }, _onDragStart: function (a, b) {
                    var c = a.dataTransfer, d = this.options;
                    if (this._offUpEvents(), "clone" == A.pull && (s = q.cloneNode(!0), i(s, "display", "none"), t.insertBefore(s, q)), b) {
                        var e, g = q.getBoundingClientRect(), h = i(q);
                        r = q.cloneNode(!0), i(r, "top", g.top - H(h.marginTop, 10)), i(r, "left", g.left - H(h.marginLeft, 10)), i(r, "width", g.width), i(r, "height", g.height), i(r, "opacity", "0.8"), i(r, "position", "fixed"), i(r, "zIndex", "100000"), t.appendChild(r), e = r.getBoundingClientRect(), i(r, "width", 2 * g.width - e.width), i(r, "height", 2 * g.height - e.height), f(G, "touchmove", this._onTouchMove), f(G, "touchend", this._onDrop), f(G, "touchcancel", this._onDrop), this._loopId = setInterval(this._emulateDragOver, 150)
                    } else c && (c.effectAllowed = "move", d.setData && d.setData.call(this, c, q)), f(G, "drop", this);
                    if (u = d.scroll, u === !0) {
                        u = t;
                        do if (u.offsetWidth < u.scrollWidth || u.offsetHeight < u.scrollHeight)break; while (u = u.parentNode)
                    }
                    setTimeout(this._dragStarted, 0)
                }, _onDrag: p(function (a) {
                    if (t && this.options.scroll) {
                        var b, c, d = this.options, e = d.scrollSensitivity, f = d.scrollSpeed, g = a.clientX, h = a.clientY, i = window.innerWidth, j = window.innerHeight, k = (e >= i - g) - (e >= g), l = (e >= j - h) - (e >= h);
                        k || l ? b = F : u && (b = u, c = u.getBoundingClientRect(), k = (N(c.right - g) <= e) - (N(c.left - g) <= e), l = (N(c.bottom - h) <= e) - (N(c.top - h) <= e)), (D.vx !== k || D.vy !== l || D.el !== b) && (D.el = b, D.vx = k, D.vy = l, clearInterval(D.pid), b && (D.pid = setInterval(function () {
                            b === F ? F.scrollTo(F.scrollX + k * f, F.scrollY + l * f) : (l && (b.scrollTop += l * f), k && (b.scrollLeft += k * f))
                        }, 24)))
                    }
                }, 30), _onDragOver: function (a) {
                    var c, e, f, g = this.el, h = this.options, j = h.group, k = j.put, n = A === j, o = h.sort;
                    if (void 0 !== a.preventDefault && (a.preventDefault(), !h.dragoverBubble && a.stopPropagation()), !J && A && (n ? o || (f = !t.contains(q)) : A.pull && k && (A.name === j.name || k.indexOf && ~k.indexOf(A.name))) && (void 0 === a.rootEl || a.rootEl === this.el)) {
                        if (c = d(a.target, h.draggable, g), e = q.getBoundingClientRect(), f)return b(!0), void(s || v ? t.insertBefore(q, s || v) : o || t.appendChild(q));
                        if (0 === g.children.length || g.children[0] === r || g === a.target && (c = m(g, a))) {
                            if (c) {
                                if (c.animated)return;
                                u = c.getBoundingClientRect()
                            }
                            b(n), g.appendChild(q), this._animate(e, q), c && this._animate(u, c)
                        } else if (c && !c.animated && c !== q && void 0 !== c.parentNode[E]) {
                            w !== c && (w = c, x = i(c));
                            var p, u = c.getBoundingClientRect(), y = u.right - u.left, z = u.bottom - u.top, B = /left|right|inline/.test(x.cssFloat + x.display), C = c.offsetWidth > q.offsetWidth, D = c.offsetHeight > q.offsetHeight, F = (B ? (a.clientX - u.left) / y : (a.clientY - u.top) / z) > .5, G = c.nextElementSibling;
                            J = !0, setTimeout(l, 30), b(n), p = B ? c.previousElementSibling === q && !C || F && C : G !== q && !D || F && D, p && !G ? g.appendChild(q) : c.parentNode.insertBefore(q, p ? G : c), this._animate(e, q), this._animate(u, c)
                        }
                    }
                }, _animate: function (a, b) {
                    var c = this.options.animation;
                    if (c) {
                        var d = b.getBoundingClientRect();
                        i(b, "transition", "none"), i(b, "transform", "translate3d(" + (a.left - d.left) + "px," + (a.top - d.top) + "px,0)"), b.offsetWidth, i(b, "transition", "all " + c + "ms"), i(b, "transform", "translate3d(0,0,0)"), clearTimeout(b.animated), b.animated = setTimeout(function () {
                            i(b, "transition", ""), b.animated = !1
                        }, c)
                    }
                }, _offUpEvents: function () {
                    g(G, "mouseup", this._onDrop), g(G, "touchmove", this._onTouchMove), g(G, "touchend", this._onDrop), g(G, "touchcancel", this._onDrop)
                }, _onDrop: function (b) {
                    var c = this.el, d = this.options;
                    clearInterval(this._loopId), clearInterval(D.pid), g(G, "drop", this), g(G, "dragover", this), g(c, "dragstart", this._onDragStart), this._offUpEvents(), b && (b.preventDefault(), !d.dropBubble && b.stopPropagation(), r && r.parentNode.removeChild(r), q && (g(q, "dragend", this), k(q), h(q, this.options.ghostClass, !1), t !== q.parentNode ? (z = o(q), K(q.parentNode, "sort", q, t, y, z), K(t, "sort", q, t, y, z), K(q, "add", q, t, y, z), K(t, "remove", q, t, y, z)) : (s && s.parentNode.removeChild(s), q.nextSibling !== v && (z = o(q), K(t, "update", q, t, y, z), K(t, "sort", q, t, y, z))), a.active && K(t, "end", q, t, y, z)), t = q = r = v = s = B = C = w = x = A = a.active = null, this.save())
                }, handleEvent: function (a) {
                    var b = a.type;
                    "dragover" === b ? (this._onDrag(a), e(a)) : ("drop" === b || "dragend" === b) && this._onDrop(a)
                }, toArray: function () {
                    for (var a, b = [], c = this.el.children, e = 0, f = c.length; f > e; e++)a = c[e], d(a, this.options.draggable, this.el) && b.push(a.getAttribute("data-id") || n(a));
                    return b
                }, sort: function (a) {
                    var b = {}, c = this.el;
                    this.toArray().forEach(function (a, e) {
                        var f = c.children[e];
                        d(f, this.options.draggable, c) && (b[a] = f)
                    }, this), a.forEach(function (a) {
                        b[a] && (c.removeChild(b[a]), c.appendChild(b[a]))
                    })
                }, save: function () {
                    var a = this.options.store;
                    a && a.set(this)
                }, closest: function (a, b) {
                    return d(a, b || this.options.draggable, this.el)
                }, option: function (a, b) {
                    var c = this.options;
                    return void 0 === b ? c[a] : void(c[a] = b)
                }, destroy: function () {
                    var a = this.el, b = this.options;
                    L.forEach(function (c) {
                        g(a, c.substr(2).toLowerCase(), b[c])
                    }), g(a, "mousedown", this._onTapStart), g(a, "touchstart", this._onTapStart), g(a, "selectstart", this._onTapStart), g(a, "dragover", this._onDragOver), g(a, "dragenter", this._onDragOver), Array.prototype.forEach.call(a.querySelectorAll("[draggable]"), function (a) {
                        a.removeAttribute("draggable")
                    }), P.splice(P.indexOf(this._onDragOver), 1), this._onDrop(), this.el = null
                }
            }, a.utils = {
                on: f, off: g, css: i, find: j, bind: c, is: function (a, b) {
                    return !!d(a, b, a)
                }, throttle: p, closest: d, toggleClass: h, dispatchEvent: K, index: o
            }, a.version = "1.0.1", a.create = function (b, c) {
                return new a(b, c)
            }, a
        });

        var el = document.getElementById(elem);

        Sortable.create(el, params);
    },

    confirm: function (text, options, callback) {
        bootbox.confirm(text, function (result) {
            if (result) {
                if (typeof options === 'object' && options) {
                    if ('' != options.url) {
                        window.location = options.url;
                    }
                }
            }

            if (typeof callback === 'function') {
                callback(result);
            }
        });
    },

    includeSecurityToken: function(params) {
        if ('object' === typeof params) {
            params[this.securityTokenKey] = intelli.securityToken;
        }

        return params;
    },

    post: function(url, data, success, dataType) {
        return $.post(url, this.includeSecurityToken(data), success, dataType);
    },

    getLocale: function() {
        if ('function' === typeof moment) {
            var existLocales = moment.locales();

            var locales = [
                intelli.languages[intelli.config.lang].locale.replace('_', '-'),
                intelli.config.lang
            ];

            var map = {
                zh: 'zh-cn'
            };

            for (var i in locales) {
                var locale = locales[i];

                if (typeof map[locale] !== 'undefined') {
                    locale = map[locale];
                }

                if (-1 !== $.inArray(locale, existLocales)) {
                    return locale;
                }
            }
        }

        return 'en';
    }
};

function _t(key, def) {
    if (intelli.admin && intelli.admin.lang[key]) {
        return intelli.admin.lang[key];
    }

    return _f(key, def);
}

function _f(key, def) {
    if (intelli.lang[key]) {
        return intelli.lang[key];
    }

    return (def ? (def === true ? key : def) : '{' + key + '}');
}