/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'jquery',
	'backbone.marionette',
    'underscore',
    'logger',
    'i18n!apps/myInfo/nls/Messages',
	'tpl!apps/myInfo/templates/Account.html'
], function ($, Marionette, _, Logger, i18n, Template) {
    'use strict';
	return Marionette.ItemView.extend({
		template: Template,
        templateHelpers: {
            isValidAccount: function () {
                return !_.isNull(this.subscriberId);
            },
            isAnonymous: function () {
                return this.anonymous === true;
            },
            getAttribute: function (attr) {
                if (!_.isUndefined(this.attributes)) {
                    return this.attributes[attr] || "";
                } else {
                    return "";
                }
            },
            percentBandwidthRemaining: function () {
                if (!_.isUndefined(this.attributes)) {
                    // Prevent divison by zero and other errors
                    if (!this.attributes.maxBandwidth) {
                        this.attributes.maxBandwidth = 250;
                    }
                    if (!this.attributes.bandwidthRemaining) {
                        this.attributes.bandwidthRemaining = 0;
                    }

                    var percentBandwidthRemaining = (this.attributes.bandwidthRemaining / this.attributes.maxBandwidth) * 100;
                    return percentBandwidthRemaining;
                }
                return 0;
            },

            // Merge first and last names to avoid inevitable issues with
            // international names
            name: function () {
                if (!_.isUndefined(this.firstName) && this.firstName !== "null" &&
                        !_.isUndefined(this.lastName) && this.lastName !== "null") {
                    return this.firstName + '&nbsp;' + this.lastName;
                }
                return "";
            },
            i18n: i18n
        },
        modelEvents: {
            "change": "render"
        },
        initialize: function () {

            // Draw loading spinner initially
            // (this will be replaced with actually content when it exists)
            this.$el.addClass('loading');
            // Set up window resize event handler.
            var lazyGauge = _.debounce(this._updateGauge, 300);
            $(window).resize(function () {
                lazyGauge();
            });

        },
        doRender: function () {
            Logger.debug("AccountView : render");

            // Hide spinner, draw content
            this.$el.removeClass('loading');
        },

        onRender: function () {
            this._updateGauge();
        },

        // Update the gaue background size and gauge value. The gauge bar is implemented with
        // an image that needs it's background size appropriately assigned, for any screen width.
        _updateGauge: function () {
            var self = this;

            // Make sure the .bandwidth-bar element is ready and we can access its width. Kinda
            // hacky but it works for now.
            setTimeout(function () {
                var bandwidthBarWidth = self.$('.bandwidth-bar').width();
                self.$('.gauge').css('background-size', bandwidthBarWidth + 'px 50px');
            }, 0);
        }
    });
});
