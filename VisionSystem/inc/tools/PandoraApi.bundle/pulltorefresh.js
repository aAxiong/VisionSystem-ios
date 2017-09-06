(function() {

    var TEMPLATE = '<div style="position: fixed;top: 0;left: 0;height:0px;line-height:0;width: 100%;overflow:hidden;text-align: center;z-index: 2147483647"><div style="margin: 3px auto;margin-bottom:10px;width:{WIDTH};height:{WIDTH};background-color: rgb(255, 255, 255);border-radius: 50%;box-shadow: rgb(187, 187, 187) 0px {SHADOWOFFSETY}px {SHADOWBLUR}px;"><canvas width="200" height="200" style="width:{WIDTH}"></canvas></div></div>'
    if (typeof Object.assign != 'function') {
        Object.assign = function(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }
    var Deferred = (function() {

        var forEach = Array.prototype.forEach;
        var hasOwn = Object.prototype.hasOwnProperty;
        var breaker = {};
        var isArray = function(elem) {
            return typeof elem === "object" && elem instanceof Array;
        };
        var isFunction = function(fn) {
            return typeof fn === "function";
        };

        var // Static reference to slice
            sliceDeferred = [].slice;

        // String to Object flags format cache
        var flagsCache = {};

        // Convert String-formatted flags into Object-formatted ones and store in cache
        function createFlags(flags) {
            var object = flagsCache[flags] = {},
                i, length;
            flags = flags.split(/\s+/);
            for (i = 0, length = flags.length; i < length; i++) {
                object[flags[i]] = true;
            }
            return object;
        }

        // Borrowed shamelessly from https://github.com/wookiehangover/underscore.Deferred
        var _each = function(obj, iterator, context) {
            var key, i, l;

            if (!obj) {
                return;
            }
            if (forEach && obj.forEach === forEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (i = 0, l = obj.length; i < l; i++) {
                    if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                        return;
                    }
                }
            } else {
                for (key in obj) {
                    if (hasOwn.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === breaker) {
                            return;
                        }
                    }
                }
            }
        };

        var Callbacks = function(flags) {

            // Convert flags from String-formatted to Object-formatted
            // (we check in cache first)
            flags = flags ? (flagsCache[flags] || createFlags(flags)) : {};

            var // Actual callback list
                list = [],
                // Stack of fire calls for repeatable lists
                stack = [],
                // Last fire value (for non-forgettable lists)
                memory,
                // Flag to know if list is currently firing
                firing,
                // First callback to fire (used internally by add and fireWith)
                firingStart,
                // End of the loop when firing
                firingLength,
                // Index of currently firing callback (modified by remove if needed)
                firingIndex,
                // Add one or several callbacks to the list
                add = function(args) {
                    var i,
                        length,
                        elem,
                        type,
                        actual;
                    for (i = 0, length = args.length; i < length; i++) {
                        elem = args[i];
                        if (isArray(elem)) {
                            // Inspect recursively
                            add(elem);
                        } else if (isFunction(elem)) {
                            // Add if not in unique mode and callback is not in
                            if (!flags.unique || !self.has(elem)) {
                                list.push(elem);
                            }
                        }
                    }
                },
                // Fire callbacks
                fire = function(context, args) {
                    args = args || [];
                    memory = !flags.memory || [context, args];
                    firing = true;
                    firingIndex = firingStart || 0;
                    firingStart = 0;
                    firingLength = list.length;
                    for (; list && firingIndex < firingLength; firingIndex++) {
                        if (list[firingIndex].apply(context, args) === false && flags.stopOnFalse) {
                            memory = true; // Mark as halted
                            break;
                        }
                    }
                    firing = false;
                    if (list) {
                        if (!flags.once) {
                            if (stack && stack.length) {
                                memory = stack.shift();
                                self.fireWith(memory[0], memory[1]);
                            }
                        } else if (memory === true) {
                            self.disable();
                        } else {
                            list = [];
                        }
                    }
                },
                // Actual Callbacks object
                self = {
                    // Add a callback or a collection of callbacks to the list
                    add: function() {
                        if (list) {
                            var length = list.length;
                            add(arguments);
                            // Do we need to add the callbacks to the
                            // current firing batch?
                            if (firing) {
                                firingLength = list.length;
                                // With memory, if we're not firing then
                                // we should call right away, unless previous
                                // firing was halted (stopOnFalse)
                            } else if (memory && memory !== true) {
                                firingStart = length;
                                fire(memory[0], memory[1]);
                            }
                        }
                        return this;
                    },
                    // Remove a callback from the list
                    remove: function() {
                        if (list) {
                            var args = arguments,
                                argIndex = 0,
                                argLength = args.length;
                            for (; argIndex < argLength; argIndex++) {
                                for (var i = 0; i < list.length; i++) {
                                    if (args[argIndex] === list[i]) {
                                        // Handle firingIndex and firingLength
                                        if (firing) {
                                            if (i <= firingLength) {
                                                firingLength--;
                                                if (i <= firingIndex) {
                                                    firingIndex--;
                                                }
                                            }
                                        }
                                        // Remove the element
                                        list.splice(i--, 1);
                                        // If we have some unicity property then
                                        // we only need to do this once
                                        if (flags.unique) {
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        return this;
                    },
                    // Control if a given callback is in the list
                    has: function(fn) {
                        if (list) {
                            var i = 0,
                                length = list.length;
                            for (; i < length; i++) {
                                if (fn === list[i]) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    // Remove all callbacks from the list
                    empty: function() {
                        list = [];
                        return this;
                    },
                    // Have the list do nothing anymore
                    disable: function() {
                        list = stack = memory = undefined;
                        return this;
                    },
                    // Is it disabled?
                    disabled: function() {
                        return !list;
                    },
                    // Lock the list in its current state
                    lock: function() {
                        stack = undefined;
                        if (!memory || memory === true) {
                            self.disable();
                        }
                        return this;
                    },
                    // Is it locked?
                    locked: function() {
                        return !stack;
                    },
                    // Call all callbacks with the given context and arguments
                    fireWith: function(context, args) {
                        if (stack) {
                            if (firing) {
                                if (!flags.once) {
                                    stack.push([context, args]);
                                }
                            } else if (!(flags.once && memory)) {
                                fire(context, args);
                            }
                        }
                        return this;
                    },
                    // Call all the callbacks with the given arguments
                    fire: function() {
                        self.fireWith(this, arguments);
                        return this;
                    },
                    // To know if the callbacks have already been called at least once
                    fired: function() {
                        return !!memory;
                    }
                };

            return self;
        };

        var Deferred = function(func) {
            var doneList = Callbacks("once memory"),
                failList = Callbacks("once memory"),
                progressList = Callbacks("memory"),
                state = "pending",
                lists = {
                    resolve: doneList,
                    reject: failList,
                    notify: progressList
                },
                promise = {
                    done: doneList.add,
                    fail: failList.add,
                    progress: progressList.add,

                    state: function() {
                        return state;
                    },

                    // Deprecated
                    isResolved: doneList.fired,
                    isRejected: failList.fired,

                    then: function(doneCallbacks, failCallbacks, progressCallbacks) {
                        deferred.done(doneCallbacks).fail(failCallbacks).progress(progressCallbacks);
                        return this;
                    },
                    always: function() {
                        deferred.done.apply(deferred, arguments).fail.apply(deferred, arguments);
                        return this;
                    },
                    pipe: function(fnDone, fnFail, fnProgress) {
                        return Deferred(function(newDefer) {
                            _each({
                                done: [fnDone, "resolve"],
                                fail: [fnFail, "reject"],
                                progress: [fnProgress, "notify"]
                            }, function(data, handler) {
                                var fn = data[0],
                                    action = data[1],
                                    returned;
                                if (isFunction(fn)) {
                                    deferred[handler](function() {
                                        returned = fn.apply(this, arguments);
                                        if (returned && isFunction(returned.promise)) {
                                            returned.promise().then(newDefer.resolve, newDefer.reject, newDefer.notify);
                                        } else {
                                            newDefer[action + "With"](this === deferred ? newDefer : this, [returned]);
                                        }
                                    });
                                } else {
                                    deferred[handler](newDefer[action]);
                                }
                            });
                        }).promise();
                    },
                    // Get a promise for this deferred
                    // If obj is provided, the promise aspect is added to the object
                    promise: function(obj) {
                        if (!obj) {
                            obj = promise;
                        } else {
                            for (var key in promise) {
                                obj[key] = promise[key];
                            }
                        }
                        return obj;
                    }
                },
                deferred = promise.promise({}),
                key;

            for (key in lists) {
                deferred[key] = lists[key].fire;
                deferred[key + "With"] = lists[key].fireWith;
            }

            // Handle state
            deferred.done(function() {
                state = "resolved";
            }, failList.disable, progressList.lock).fail(function() {
                state = "rejected";
            }, doneList.disable, progressList.lock);

            // Call given func if any
            if (func) {
                func.call(deferred, deferred);
            }

            // All done!
            return deferred;
        };

        // Deferred helper
        var when = function(firstParam) {
            var args = sliceDeferred.call(arguments, 0),
                i = 0,
                length = args.length,
                pValues = new Array(length),
                count = length,
                pCount = length,
                deferred = length <= 1 && firstParam && isFunction(firstParam.promise) ?
                firstParam :
                Deferred(),
                promise = deferred.promise();

            function resolveFunc(i) {
                return function(value) {
                    args[i] = arguments.length > 1 ? sliceDeferred.call(arguments, 0) : value;
                    if (!(--count)) {
                        deferred.resolveWith(deferred, args);
                    }
                };
            }

            function progressFunc(i) {
                return function(value) {
                    pValues[i] = arguments.length > 1 ? sliceDeferred.call(arguments, 0) : value;
                    deferred.notifyWith(promise, pValues);
                };
            }
            if (length > 1) {
                for (; i < length; i++) {
                    if (args[i] && args[i].promise && isFunction(args[i].promise)) {
                        args[i].promise().then(resolveFunc(i), deferred.reject, progressFunc(i));
                    } else {
                        --count;
                    }
                }
                if (!count) {
                    deferred.resolveWith(deferred, args);
                }
            } else if (deferred !== firstParam) {
                deferred.resolveWith(deferred, length ? [firstParam] : []);
            }
            return promise;
        };

        Deferred.when = when;
        Deferred.Callbacks = Callbacks;

        return Deferred;

    })();
    var touch = (function() {
        var t = window;
        var n = t.document,
            r = {
                NONE: 0,
                NOOP: 1,
                UP: 2,
                RIGHT: 3,
                DOWN: 4,
                LEFT: 5,
                LEFT_RIGHT: 6
            },
            o = {
                con: "",
                minDistance: 4,
                onPullStart: function() {},
                onMove: function() {},
                onPullEnd: function() {}
            },
            a = function(t) {
                "string" == typeof t.con && (t.con = n.querySelector(t.con)),
                    this.options = Object.assign({}, o, t),
                    this.hasTouch = !1,
                    this.direction = r.NONE,
                    this.distanceX = this.startY = this.startX = 0,
                    this.isPull = !1,
                    this.initEvent()
            };
        return a.prototype = {
            initEvent: function() {
                var e = this;
                this._touchStart = function(t) {
                    e.__start(t)
                };
                this._touchMove = function(t) {
                    e.__move(t)
                };
                this._touchEnd = function(t) {
                    e.__end(t)
                };
                var useCapture = true;
                this.options.con.addEventListener("touchstart", this._touchStart, useCapture),
                    this.options.con.addEventListener("touchmove", this._touchMove, useCapture),
                    this.options.con.addEventListener("touchend", this._touchEnd, useCapture)
            },
            detachEvent: function() {
                var useCapture = true;
                this.options.con.removeEventListener("touchstart", this._touchStart, useCapture),
                    this.options.con.removeEventListener("touchmove", this._touchMove, useCapture),
                    this.options.con.removeEventListener("touchend", this._touchEnd, useCapture)
            },
            __start: function(e) {
                e = e.targetTouches,
                    1 === e.length && (this.startX = e[0].pageX,
                        this.startY = e[0].pageY,
                        this.direction = r.NONE,
                        this.distanceX = 0,
                        this.hasTouch = !0,
                        this.startScrollY = t.scrollY)
            },
            __move: function(e) {
                if (this.hasTouch) {
                    if (this.direction === r.UP)
                        return;
                    var t = e.targetTouches[0];
                    if (this.direction === r.NONE) {
                        this.distanceX = t.pageX - this.startX,
                            this.distanceY = t.pageY - this.startY;
                        var n = Math.abs(this.distanceY),
                            o = Math.abs(this.distanceX);
                        o + n > this.options.minDistance && (o > 1.73 * n ? this.direction = r.LEFT_RIGHT : n > 1.73 * o ? this.direction = this.distanceY < 0 ? r.UP : r.DOWN : this.direction = r.NOOP,
                                this.startScrollY < 10 && this.distanceY > 0 && (this.direction = r.DOWN)),
                            this.startScrollY < 10 && this.direction === r.DOWN && this.distanceY > this.options.minDistance && (this.isPull = !0,
                                this.options.onPullStart(e, this.distanceY))
                    }
                    this.isPull && this.direction === r.DOWN && (this.distanceY = t.pageY - this.startY,
                        this.refreshY = parseInt(this.distanceY * this.options.pullRatio),
                        this.options.onMove(e, this.distanceY))
                }
            },
            __end: function(e) {
                !this.hasTouch || r.LEFT_RIGHT !== this.direction && r.DOWN !== this.direction || (this.direction === r.LEFT_RIGHT && (
                            e.preventDefault(), e.stopPropagation(),
                            this.options.onPullEnd(e, this.distanceX, r.LEFT_RIGHT)),
                        this.direction === r.DOWN && this.isPull && (e.preventDefault(), e.stopPropagation(), this.options.onPullEnd(e, this.distanceY, r.DOWN))),
                    this.hasTouch = !1,
                    this.isPull = !1
            }
        }, {
            init: function(e) {
                return new a(e)
            },
            DIRECTION: r
        }

    })();
    var canvasUtils = (function() {
        var e = function(e, t, n, r, o, a, i, s, globalAlpha) {
                "string" == typeof t && (t = parseFloat(t)),
                    "string" == typeof n && (n = parseFloat(n)),
                    "string" == typeof r && (r = parseFloat(r)),
                    "string" == typeof o && (o = parseFloat(o)),
                    "string" == typeof a && (a = parseFloat(a)),
                    "string" == typeof i && (i = parseFloat(i));
                2 * Math.PI;
                //              e.globalAlpha = globalAlpha;
                switch (e.save(),
                    //                  e.beginPath(),
                    //                  e.moveTo(t, n),
                    //                  e.lineTo(r, o),
                    //                  e.lineTo(a, i),
                    s) {
                    case 0:
                        var c = Math.sqrt((a - t) * (a - t) + (i - n) * (i - n));
                        e.arcTo(r, o, t, n, .55 * c),
                            e.fill();
                        break;
                    case 1:
                        if (globalAlpha > 0.5) {
                            e.save();
                            e.beginPath(),
                                e.moveTo(t, n),
                                e.lineTo(r, o),
                                e.lineTo(a, i),
                                e.lineTo(t, n);
                            e.fill();
                        }
                        break;
                    case 2:
                        e.stroke();
                        break;
                    case 3:
                        var l = (t + r + a) / 3,
                            u = (n + o + i) / 3;
                        e.quadraticCurveTo(l, u, t, n),
                            e.fill();
                        break;
                    case 4:
                        var d, p, f, h, c, m = 5;
                        if (a == t)
                            c = i - n,
                            d = (r + t) / 2,
                            f = (r + t) / 2,
                            p = o + c / m,
                            h = o - c / m;
                        else {
                            c = Math.sqrt((a - t) * (a - t) + (i - n) * (i - n));
                            var v = (t + a) / 2,
                                g = (n + i) / 2,
                                _ = (v + r) / 2,
                                b = (g + o) / 2,
                                y = (i - n) / (a - t),
                                w = c / (2 * Math.sqrt(y * y + 1)) / m,
                                x = y * w;
                            d = _ - w,
                                p = b - x,
                                f = _ + w,
                                h = b + x
                        }
                        e.bezierCurveTo(d, p, f, h, t, n),
                            e.fill()
                }
                e.restore()
            },
            t = function(e, t, r, o, a, i, s, c, l, u, d, p, f, globalAlpha) {
                c = "undefined" != typeof c ? c : 3,
                    l = "undefined" != typeof l ? l : 1,
                    u = "undefined" != typeof u ? u : Math.PI / 8,
                    d = "undefined" != typeof d ? d : 10,
                    p = "undefined" != typeof p ? p : 1,
                    e.save();
                //              e.rect(0, 100, 200, 100);
                //              e.clip();
                e.beginPath();
                //              e.shadowOffsetY = 4;
                //              e.shadowBlur = 10;
                //              e.shadowColor = "#bbb";
                e.globalAlpha = 1;
                //              e.arc(100, 100, 100, 0, 2 * Math.PI);
                //              e.fillStyle = '#fff';
                //              e.fill();
                e.restore();
                e.lineWidth = p,
                    e.beginPath(),
                    e.arc(t, r, o, a, i, s),
                    e.stroke();
                var h, m, v, g, _;
                if (1 & l && (h = Math.cos(a) * o + t,
                        m = Math.sin(a) * o + r,
                        v = Math.atan2(t - h, m - r),
                        s ? (g = h + 10 * Math.cos(v),
                            _ = m + 10 * Math.sin(v)) : (g = h - 10 * Math.cos(v),
                            _ = m - 10 * Math.sin(v)),
                        n(e, h, m, g, _, c, 2, u, d, globalAlpha)),
                    2 & l) {
                    h = Math.cos(i) * o + t,
                        m = Math.sin(i) * o + r,
                        v = Math.atan2(t - h, m - r),
                        s ? (g = h - 10 * Math.cos(v),
                            _ = m - 10 * Math.sin(v)) : (g = h + 10 * Math.cos(v),
                            _ = m + 10 * Math.sin(v)),
                        n(e, h - f * Math.sin(i), m + f * Math.cos(i), g - f * Math.sin(i), _ + f * Math.cos(i), c, 2, u, d, globalAlpha)
                }
                e.restore()
            },
            n = function(t, n, r, o, a, i, s, c, l, globalAlpha) {
                "string" == typeof n && (n = parseFloat(n)),
                    "string" == typeof r && (r = parseFloat(r)),
                    "string" == typeof o && (o = parseFloat(o)),
                    "string" == typeof a && (a = parseFloat(a)),
                    i = "undefined" != typeof i ? i : 3,
                    s = "undefined" != typeof s ? s : 1,
                    c = "undefined" != typeof c ? c : Math.PI / 8,
                    l = "undefined" != typeof l ? l : 10;
                var u, d, p, f, h = "function" != typeof i ? e : i,
                    m = Math.sqrt((o - n) * (o - n) + (a - r) * (a - r)),
                    v = (m - l / 3) / m;
                1 & s ? (u = Math.round(n + (o - n) * v),
                        d = Math.round(r + (a - r) * v)) : (u = o,
                        d = a),
                    2 & s ? (p = n + (o - n) * (1 - v),
                        f = r + (a - r) * (1 - v)) : (p = n,
                        f = r);
                //              t.rect(0, 100, 200, 100);
                //              t.clip();
                t.beginPath(),
                    t.moveTo(p, f),
                    t.lineTo(u, d),
                    t.stroke();
                var g = Math.atan2(a - r, o - n),
                    _ = Math.abs(l / Math.cos(c));
                if (1 & s) {
                    var b = g + Math.PI + c,
                        y = o + Math.cos(b) * _,
                        w = a + Math.sin(b) * _,
                        x = g + Math.PI - c,
                        k = o + Math.cos(x) * _,
                        E = a + Math.sin(x) * _;
                    h(t, y, w, o, a, k, E, i, globalAlpha)
                }
                if (2 & s) {
                    var b = g + c,
                        y = n + Math.cos(b) * _,
                        w = r + Math.sin(b) * _,
                        x = g - c,
                        k = n + Math.cos(x) * _,
                        E = r + Math.sin(x) * _;
                    h(t, y, w, n, r, k, E, i, globalAlpha)
                }
            };
        return {
            drawArrow: n,
            drawArcedArrow: t
        }
    })();

    var pulltorefresh = function() {
        var t = window;
        var n = t.document,
            s = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(e) {
                window.setTimeout(e, 1e3 / 60)
            },
            c = {
                con: "",
                minDistance: 4
            },
            l = ["onPullStart", "onMove", "onRelease", "needRefresh", "doRefresh", "noop"],
            u = 25, //30
            d = 0,
            p = 300,
            h = 10,
            m = function(e) {
                var t = 5 * e / 12;
                return t
            },
            v = function() {
                var e = document.createElement("canvas"),
                    t = !(!e.getContext || !e.getContext("2d")),
                    n = navigator.userAgent.toLowerCase(),
                    r = (n.match(/chrome\/([\d.]+)/),
                        n.match(/version\/([\d.]+).*safari/)),
                    o = (n.match(/firefox\/([\d.]+)/),
                        n.match(/mx[\d.]+/)),
                    a = !1;
                return o && r && (a = !0), !t && a
            }(),
            g = function() {
                return !0
            }(),
            _ = function(t) {
                t.con = document.body;
                var r = {},
                    a = this;
                for (var i = 0; i < l.length; i++) {
                    r[l[i]] = a["_" + l[i]].bind(a)
                }
                this.options = Object.assign({}, c, r, t),
                    this.shouldRefresh = !1,
                    this.isRefreshing = !1,
                    this.$pullTip = null,
                    r.onPullEnd = this._onPullEnd.bind(this),
                    t = Object.assign({}, r, t),
                    this.touchPull = touch.init(t),
                    this.refreshTimes = 0
            };
        _.prototype = {
            _onPullStart: function(e, t) {
                this.isRefreshing || (e.preventDefault(),
                    this.addPullTip(this.options.con))
            },
            _onMove: function(e, t) {
                if (!this.isRefreshing) {
                    e.preventDefault();
                    var n = m(t);
                    n = this.isRefreshing ? n + this.minRefreshDistance : n,
                        this.movePullTip(n),
                        this.changePullTip(n, this.options.con)
                }
            },
            _onPullEnd: function(e, n, r) {
                if (!this.isRefreshing) {
                    var o = this;
                    this.options.needRefresh(n),
                        this.options.onRelease().then(function() {
                            o.options.needRefresh() ? (
                                o.isRefreshing = !0,
                                o.refreshTimes += 1,
                                o.options.doRefresh()) : (o.reset(),
                                o.options.noop())
                        })
                }
            },
            transitionDefer: null,
            onTransitionEnd: function() {
                var e = this;
                e.shouldRefresh ? e.canvasObj.startAuto() : e.reset(),
                    setTimeout(function() {
                        e.transitionDefer.resolve()
                    }, !1)
            },
            _onRelease: function() {
                if (this.transitionDefer = Deferred(),
                    this.pullTipExist()) {
                    var t = this.$pullTip;
                    t.addEventListener("webkitTransitionEnd", this.onTransitionEnd.bind(this), !1);
                    var n = this.shouldRefresh ? this.minRefreshDistance : 0,
                        r = !0;
                    this.movePullTip(n, "all " + p + "ms linear", r)
                } else
                    this.transitionDefer.resolve();
                return this.transitionDefer
            },
            _doRefresh: function() {
                var t = Deferred();
                return t.resolve(),
                    t
            },
            _noop: function() {},
            _needRefresh: function(e) {
                return e = m(e), !this.shouldRefresh && e >= this.minRefreshDistance && (this.shouldRefresh = !0),
                    this.shouldRefresh
            },
            pullTipExist: function() {
                return this.$pullTip
            },
            reset: function() {
                var e = this.isRefreshing;
                this.isRefreshing = !1,
                    this.shouldRefresh = !1,
                    this.removePullTip(e)
            },
            canvasObj: function() {
                function t() {
                    var e = (B + 1) % P.length;
                    return B = e,
                        e
                }

                function n(e) {
                    return 360 + e - W
                }

                function r() {
                    E.clearRect(0, 0, 2 * A, 2 * F);
                }

                function o(e) {
                    if (!v) {
                        var t = e.start,
                            n = e.end,
                            o = e.lineWidth,
                            a = e.color,
                            i = e.counterClockwise,
                            s = e.co,
                            c = e.clearRect;
                        c && r();
                        E.save();
                        E.globalCompositeOperation = s;
                        E.beginPath();
                        E.arc(A, F, O, y(t), y(n), i),
                            E.lineWidth = o,
                            E.strokeStyle = a,
                            E.stroke(),
                            E.restore()
                    }
                }

                function c() {
                    if (!v) {
                        var e = U.speed,
                            r = U.startAngle,
                            a = H,
                            i = U.color,
                            s = U.lineWidth,
                            c = U.counterClockwise,
                            l = U.globalCompositeOperation,
                            u = J || +new Date;
                        a = +new Date,
                            e = 360 / j * (a - u),
                            J = a,
                            H += e,
                            a = Math.min(G, H);
                        var d = "draw" === V;
                        if (!T && (o({
                                    start: r,
                                    end: a,
                                    color: i,
                                    lineWidth: s,
                                    counterClockwise: c,
                                    co: l,
                                    clearRect: d
                                }),
                                H >= G)) {
                            if (E.closePath(),
                                U = "erase" !== V ? X : I,
                                V = "erase" !== V ? "erase" : "draw",
                                "draw" === V) {
                                R = U.color;
                                var p = t(R);
                                U.color = P[p],
                                    U.startAngle = (U.startAngle - W) % 360,
                                    H = U.startAngle,
                                    G = n(H)
                            } else
                                H = U.startAngle = I.startAngle
                        }
                    }
                }

                function l(e) {
                    if (!v) {
                        var clip = e;
                        var t = I.speed,
                            n = I.startAngle,
                            r = I.startAngle,
                            o = P[0];
                        if (!isNaN(e)) {
                            e = Math.min(x.minRefreshDistance - u, e);
                            var a = e / (x.minRefreshDistance - u),
                                i = (G - h) * a - I.startAngle;
                            t = i
                        }
                        r += t,
                            q = r;
                        f({
                            start: n,
                            end: r,
                            color: o,
                            distance: e,
                            clip: clip
                        })
                    }
                }

                function d() {
                    var t = x.minRefreshDistance - u,
                        n = t / j * 1.3,
                        r = P[0],
                        o = t,
                        a = +new Date,
                        i = Deferred(),
                        c = function e() {
                            if (o >= 0) {
                                var t = +new Date;
                                o -= n * (t - a),
                                    a = t;
                                var c = o / (x.minRefreshDistance - u),
                                    l = (G - h) * c - I.startAngle,
                                    d = q - l;
                                d = Math.min(d, q),
                                    f({
                                        start: d,
                                        end: q,
                                        color: r,
                                        distance: o,
                                        clip: o
                                    }),
                                    s(e)
                            } else
                                i.resolve()
                        };
                    return s(c),
                        i
                }

                function f(t) {
                    var n = t.distance,
                        o = T ? 10 : 25,
                        s = S,
                        c = n / (x.minRefreshDistance - u);
                    isNaN(n) || (o *= c,
                        s = S * c);
                    r();
                    if (!L) {
                        //                                          var height = t.clip * 200 / (40 * x.options.ratio);
                        //                                          if (height < 200) {
                        //                                              k.style.webkitTransition = "none";
                        //                                              k.style.webkitTransform = "rotate(0deg)";
                        //                                          }
                        //                                          E.restore(), E.save(), E.beginPath(), E.rect(0, 200, 200, -height),
                        //                                              E.clip(),
                        E.globalAlpha = 1 * t.distance / (x.minRefreshDistance + 10);
                    }
                    (
                        E.strokeStyle = t.color,
                        E.fillStyle = t.color,
                        canvasUtils.drawArcedArrow(E, A, F, O, y(t.start), y(t.end), !1, 1, 2, y(45), o, S, s, E.globalAlpha))
                }

                function m(e) {
                    var t = 0;
                    if (e) {
                        e = e.replace("matrix(", "").replace(")", ""),
                            e = e.replace(/\s+/gi, "");
                        var n = e.split(",");
                        t = n[5] || 0
                    }
                    return t
                }

                function g() {
                    var styles = x.$pullTip.ownerDocument.defaultView.getComputedStyle(x.$pullTip, null);
                    var e = m(styles["transform"]);
                    if (!(e < u)) {
                        var t = p,
                            n = e / t,
                            r = e,
                            o = +new Date,
                            a = function e() {
                                if (r > u && x.$pullTip) {
                                    var t = +new Date,
                                        a = n * (t - o);
                                    r -= a,
                                        //                                      b(r - u),
                                        l(r - u),
                                        _(r - u),
                                        o = t,
                                        s(e)
                                }
                            };
                        s(a)
                    }
                }

                function _(t) {
                    //                  var n = 1 * t / (x.minRefreshDistance - u + 40 * x.options.ratio);
                    //                  k.style.opacity = n;
                }

                function b(e, t) {
                    var n = e;
                    t || (n = Math.max(0, (e - u - 40 * x.options.ratio) / (x.minRefreshDistance) * 360));
                    k.style.webkitTransition = "none";
                    k.style.webkitTransform = "rotate(" + n + "deg)";
                }

                function y(e) {
                    return e * (Math.PI / 180)
                }

                function w(e) {
                    //                  clearTimeout(z);
                    //                      e = e || 8e3,
                    //                      z = setTimeout(function() {
                    //                          x.reset()
                    //                      }, e)
                }
                var x = null,
                    k = null,
                    E = null,
                    T = !1,
                    A = 100,
                    F = 100,
                    O = 50,
                    C = 0,
                    S = 15,
                    L = !1,
                    M = 5,
                    D = 0,
                    N = 1500,
                    j = 1e3,
                    P = ["green"],
                    R = P[0],
                    B = 1,
                    I = {
                        startAngle: D,
                        speed: M,
                        color: P[0],
                        counterClockwise: !1,
                        globalCompositeOperation: "source-out",
                        lineWidth: S
                    },
                    X = {
                        startAngle: D,
                        speed: M,
                        color: "white",
                        counterClockwise: !1,
                        globalCompositeOperation: "destination-out",
                        lineWidth: S + 40
                    },
                    H = D,
                    q = D,
                    U = I,
                    V = "draw",
                    W = 50,
                    G = 0,
                    J = 0,
                    z = -1;
                return {
                    init: function(e, t) {
                        this.reset(),
                            J = 0,
                            L = !1,
                            k = e.querySelector("canvas"),
                            E = k.getContext ? k.getContext("2d") : k,
                            T = !k.getContext,
                            q = H = D,
                            I.startAngle = X.startAngle = D,
                            G = n(H),
                            B = 1,
                            I.color = P[B],
                            V = "draw",
                            U = I,
                            x = t,
                            T ? (C = 9,
                                A = F = O = (40 - 2 * C) / 2) : (A = F = 100,
                                C = 0,
                                O = 50)
                    },
                    reset: function() {
                        k = null,
                            E = null
                    },
                    drawArrowedArcByDis: function(e) {
                        l(e)
                    },
                    drawArc: function(e) {
                        v ? console.log("not support") : c(e)
                    },
                    clearCurrent: function() {
                        v ? console.log("not support") : g()
                    },
                    rotate: b,
                    changeOpacity: _,
                    autoRotate: function() {
                        var e = k.style.webkitTransform;
                        e = e.replace("rotate(", "").replace("deg", "").replace(")", "");
                        var t = parseFloat(e);
                        var n = 360 / N,
                            r = this,
                            o = +new Date,
                            a = function e() {
                                if (L) {
                                    var a = +new Date,
                                        i = t + n * (a - o);
                                    o = a;
                                    r.rotate(i, !0),
                                        t = i,
                                        s(e)
                                }
                            };
                        s(a)
                    },
                    autoDraw: function() {
                        if (!v) {
                            var t = function t() {
                                    L && (c(),
                                        s(t))
                                },
                                n = d();
                            n.done(function() {
                                s(t)
                            })
                        }
                    },
                    startAuto: function() {
                        L = !0;
                        var style = k.parentNode.style;
                        //                      style.backgroundColor = '#fff';
                        //                      style.borderRadius = 20 * x.options.ratio + 'px';
                        //                      style.boxShadow = '0 4px 10px #bbb';
                        x.touchPull.detachEvent();
                        this.autoDraw();
                        this.autoRotate();
                        w()
                    },
                    stopAuto: function() {
                        L = !1;
                        var style = k.parentNode.style;
                        //                      style.backgroundColor = 'transparent';
                        //                      style.borderRadius = '0';
                        //                      style.boxShadow = 'none';
                        x.touchPull.initEvent();
                        clearTimeout(z)
                    }
                }
            }(),
            initCanvas: function() {
                this.canvasObj.init(this.$pullTip, this)
            },
            addPullTip: function(t) {
                this.removePullTip(),
                    t = this.options.con;
                var n = this.$pullTip;
                if (!n) {
                    var pullTipElemTemp = document.createElement('div');
                    pullTipElemTemp.innerHTML = TEMPLATE.replace(/\{WIDTH\}/g, 40 * this.options.ratio + 'px').replace(/\{SHADOWOFFSETY\}/g, 2 * this.options.ratio).replace(/\{SHADOWBLUR\}/g, 5 * this.options.ratio);
                    this.$pullTip = document.body.appendChild(pullTipElemTemp.firstElementChild),
                        n = this.$pullTip;
                    this.$pullTipInner = n.querySelector('div');
                    var offsetHeight = n.offsetHeight;
                    u = 25 * this.options.ratio;
                    this.minRefreshDistance = (20 + 50) * this.options.ratio;
                    var f = n;
                    var canvas = f.querySelector('canvas');
                    f.style.top = this.options.offset - offsetHeight + 'px';
                    f.style.webkitTransition = "none";
                    f.style.webkitTransform = "translate3d(0,0,0)";
                    this.initCanvas()
                }
            },
            movePullTip: function(e, t, n) {
                if (this.pullTipExist()) {
                    var r = Math.min(this.options.range + 20 * this.options.ratio, e);
                    this.$pullTip.style.webkitTransition = t || "none";
                    var height = this.options.ratio * 50;
                    r = Math.max(0, r - height);
                    this.$pullTip.style.webkitTransform = "translate3d(0," + r + "px,0)";
                    this.$pullTip.style.height = Math.min(e, height) + 'px';
                    this.$pullTipInner.style.webkitTransform = "translateY(" + Math.min(0, Math.max(-height, (e - height))) + "px)";
                    if (e === 0) {
                        this.canvasObj.clearCurrent()
                    } else {
                        if (e > u) {
                            if (this.shouldRefresh) {
                                this.isRefreshing || n === !0 || this.canvasObj.rotate(e)
                            } else {
                                if (e <= this.options.range + 20 * this.options.ratio - 5 && e >= 40 * this.options.ratio) {
                                    this.canvasObj.rotate(e)
                                }
                                this.canvasObj.drawArrowedArcByDis(e - u)
                                this.canvasObj.changeOpacity(e - u)
                            }
                        }
                    }
                }
            },
            changePullTip: function(e, t) {
                this.pullTipExist()
            },
            removePullTip: function(t) {
                if (this.pullTipExist())
                    if (t) {
                        var n = this;
                        n.canvasObj.stopAuto(),
                            n.$pullTip.style.webkitTransition = "all 100ms linear",
                            n.$pullTip.style.opacity = .1,
                            n.$pullTip.style.webkitTransform += " scale(0.1)"
                    } else
                        this.$pullTip.removeEventListener("webkitTransitionEnd", this.onTransitionEnd, !1),
                        this.$pullTip.remove(),
                        this.$pullTip = null;
            }
        };
        var b = {
            init: function(e) {
                return new _(e)
            }
        };
        return b
    }();
    var readyRE = /complete|loaded|interactive/;

    var ready = function(callback) {
        if (readyRE.test(document.readyState)) {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                callback();
            }, false);
        }
    };

    var __pulltorefresh__;
    var isDetached = false;
    window.__setPullToRefresh__ = function(style, callback) {
        ready(function() {
            if (!style.support && __pulltorefresh__) { //禁用下拉刷新
                __pulltorefresh__.reset();
                __pulltorefresh__.touchPull.detachEvent()
                isDetached = true;
                return;
            }
            if (style.support) {
                var ratio = window.innerWidth / (window.plus && plus.screen.resolutionWidth || window.screen.width);
                var offset = parseInt(style.offset);
                var range = parseInt(style.range) || 64 * 2; //默认64
                offset = offset * ratio;
                range = range * ratio + offset;
                if (__pulltorefresh__) {
                    if (isDetached) {
                        __pulltorefresh__.touchPull.initEvent();
                    }
                    if (style.offset) {
                        __pulltorefresh__.options.offset = offset;
                    }
                    if (style.range) {
                        __pulltorefresh__.options.range = range;
                    }
                    __pulltorefresh__.options.doRefresh = callback;
                } else {
                    __pulltorefresh__ = pulltorefresh.init({
                        offset: offset,
                        range: range,
                        ratio: ratio,
                        doRefresh: callback
                    })
                }
            }
        });
    };
    window.__endPullToRefresh__ = function() {
        __pulltorefresh__ && __pulltorefresh__.reset();
    }

})();