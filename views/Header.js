/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global $, jQuery, console*/
define([
	'backbone.marionette',
	'underscore',
	'logger',
	'tpl!templates/Header.html',
    'i18n!nls/Messages'
], function (Marionette, _, Logger, Template, i18n) {
	'use strict';
	return Marionette.ItemView.extend({

		template: Template,

        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getIcon: function () {
                    return self.model.get('icon') || "";
                },
                getTitle: function () {
                    return self.model.get('title') || "";
                },
                getCacheInfo: function () {
                    return self.model.get('cacheInfo') || "";
                },
                isOffline: function () {
                    return window.App.isOnline === false;
                }
            };

        },

        events: {
			'click .header-done': 'exitWorkFlow'
		},

        initialize: function () {
            Logger.debug("Header : initialize");
            this.model.on("change", this.render, this);
            window.App.vent.on("header:offlineHeaderToggle", this.offlineHeaderToggle, this);
        },

        // Toggle Offline Display for Header
        offlineHeaderToggle: function (online) {
            if (online) {
                this.$el.parent().addClass('online');
                this.model.set('icon', i18n.get("onlineImageUrl"));
                this.model.set('title', i18n.get("onlineTitle"));
                this.$el.find('.cacheData').hide();
                this.$el.parent().removeClass('offline');
                window.App.vent.trigger("dashboard:hideConnectButton");
            } else {
                this.$el.parent().removeClass('online');
                this.$el.parent().addClass('offline');
                this.model.set('icon', i18n.get("offlineImageUrl"));
            }
        },

		// We are done with this workflow. Do something.
		exitWorkFlow: function () {
			// console.log('do something');
		}
	});
});