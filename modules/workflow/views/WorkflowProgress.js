/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App
 */
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'spin',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowProgress.html',
    'css!workflowTheme/workflow.css'
], function (Marionette, _, Logger, Spinner, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        _timer: null,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getBody: function () {
                    return self.model.get('body') || "";
                }
            };
        },
        initialize: function (options) {
            Logger.debug("WorkflowProgress : initialize");
            var opts,
                __nativeST__,
                timeout;

            this.controller = options.controller;
            this.controller.on('done', this.onClose, this);
            this.controller.on('error', this.onClose, this);
            this.controller.on('workflow:step:received', this._onKillTimer, this);

            // Pre-IE9 hack
            if (document.all && !window.setTimeout.isPolyfill) {
                __nativeST__ = window.setTimeout;
                window.setTimeout = function (vCallback, nDelay) {
                    var aArgs = Array.prototype.slice.call(arguments, 2);
                    return __nativeST__(vCallback instanceof Function ? function () {
                        vCallback.apply(null, aArgs);
                    } : vCallback, nDelay);
                };
                window.setTimeout.isPolyfill = true;
            }

            opts = {
                lines: 9, // The number of lines to draw
                length: 0, // The length of each line
                width: 18, // The line thickness
                radius: 32, // The radius of the inner circle
                corners: 1, // Corner roundness (0..1)
                rotate: 0, // The rotation offset
                direction: 1, // 1: clockwise, -1: counterclockwise
                speed: 0.9, // Rounds per second
                trail: 68, // Afterglow percentage
                shadow: false, // Whether to render a shadow
                hwaccel: true, // Whether to use hardware acceleration
                className: 'spinner', // The CSS class to assign to the spinner
                zIndex: 2e9, // The z-index (defaults to 2000000000)
                color: '#555',
                top: 100, // Top position relative to parent in px
                left: 100 // Left position relative to parent in px
            };

            this.spinner = new Spinner(opts);
            // Configure out timeout
            timeout = this.model.get('timeout');
            if (_.isUndefined(timeout)) {
                timeout = window.App.configuration.get('spinnerTimeout');
                if (!_.isUndefined(timeout)) {
                    timeout = parseInt(timeout, 10);
                }
            }
            if (_.isUndefined(timeout) || timeout === 0 || timeout === null) {
                timeout = 60000;
            }
            this._timer = window.setTimeout(this._onSpinnerTimeout, timeout, this);
        },
        onRender: function () {
            Logger.debug("WorkflowProgress : onRender");
            this.spinner.spin(this.$("#spinner")[0]);
            this.$("#spinner").fadeIn("slow");
        },
        onClose: function () {
            Logger.debug("WorkflowProgress : onClose");
            this._onKillTimer();
            this.spinner.stop();
        },
        _onKillTimer: function () {
            Logger.debug("WorkflowProgress : onKillTimer");
            if (!_.isNull(this._timer)) {
                window.clearTimeout(this._timer);
                this._timer = null;
            }
            // Remove the listeners
            this.controller.off(null, null, this);
        },
        _onSpinnerTimeout: function (self) {
            Logger.error("WorkflowProgress : onSpinnerTimeout - Timeout reached for spinner");
            self.controller.trigger('workflow:error', i18n.get('stepTimeoutError'));
        }
    });
});
