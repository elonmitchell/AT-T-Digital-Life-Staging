/*
 * Copyright (c) 2014 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App*/
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!apps/wifi/nls/Messages',
    'tpl!apps/wifi/templates/RebootDialog.html',
    'jqueryui'
], function (Marionette, _, Logger, i18n, Template, $) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        _dialogShowing: false,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n
            };
        },
        initialize: function (options) {
            Logger.debug("RebootDialog: initialize");

            this.controller = options.controller;
        },
        onRender: function () {
            _.delay(function (self) {
                self._showDialog();
            }, 500, this);
        },
        onClose: function () {
            if (!_.isUndefined(this.nIntervalId) && this.nIntervalId !== 0) {
                window.clearInterval(this.nIntervalId);
                window.$("#dialog-rebooting").dialog("destroy");
                this.rebootCounter = 0;
                this.nIntervalId = 0;
                this._dialogShowing = false;
            }
        },
        closeDialog: function () {
            if (!_.isUndefined(this.nIntervalId) && this.nIntervalId !== 0) {
                window.clearInterval(this.nIntervalId);
                window.$("#dialog-rebooting").dialog("destroy");
                this.rebootCounter = 0;
                this.nIntervalId = 0;
                this._dialogShowing = false;
            }
        },
        _showDialog: function () {
            if (this._dialogShowing === false) {
                this._dialogShowing = true;
                var self = this,
                    numValue,
                    text = i18n.get('rebootingTimerText'),
                    __nativeSI__ = window.setInterval;
                self.nIntervalId = 0;

                this.rebootCounter = 15;

                text = text.replace('%n', self.rebootCounter.toString());
                // Set the dialog text
                window.$("#dialog-rebooting").html(text);

                // This is required for IE versions lower than 10.
                // setTimeout and setInterval do not support passing parameters
                // so we have to override these to support parameter passing
                if (document.all && !window.setInterval.isPolyfill) {
                    window.setInterval = function (vCallback, nDelay) {
                        var aArgs = Array.prototype.slice.call(arguments, 2);
                        return __nativeSI__(vCallback instanceof Function ? function () {
                            vCallback.apply(null, aArgs);
                        } : vCallback, nDelay);
                    };
                    window.setInterval.isPolyfill = true;
                }

                this.nIntervalId = window.setInterval(this._updateCounter, 1000, self);
                window.$("#dialog-rebooting").dialog({
                    dialogClass: "no-close",
                    closeOnEscape: false,
                    resizable: false,
                    height: 140,
                    modal: true,
                    buttons: []
                });
            }
        },
        _updateCounter: function (self) {
            var text = i18n.get('rebootingTimerText'),
                now = new Date();

            self.rebootCounter = self.rebootCounter - 1;

            if (self.rebootCounter > 0) {
                text = text.replace('%n', self.rebootCounter.toString());
                // Set the dialog text
                window.$("#dialog-rebooting").html(text);
            }
        }
    });
});