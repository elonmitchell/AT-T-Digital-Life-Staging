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
    'i18n!apps/wifi/nls/Messages',
    'tpl!apps/wifi/templates/WifiProfile.html'
], function ($, Marionette, _, Logger, i18n, Template) {
    'use strict';
	return Marionette.ItemView.extend({
		template: Template,
        templateHelpers: {
            i18n: i18n
        },
        initialize: function (options) {
            Logger.debug("WifiProfileView : initialize");
            this.controller = options.controller;
            this.step = options.step;
            this.profileURL = options.profileURL;
            var self = this;
            this.$el.on('click', '#profile', _.bind(self.onProfilePress, this));
            this.$el.on('click', '#continue', _.bind(self.onPress, this));
        },
        onProfilePress: function (event) {
            Logger.info("Button onProfilePressed **********");
            event.stopPropagation();
            var profileName = this.step.get('wifiProfileData').SSID;
            Logger.debug("Button onProfilePressed ********** profileName=" + profileName);
            window.plugins.profileManager.storeProfile(this.profileURL, profileName, function (result) {
                Logger.log("storeProfile successful call installProfile... result.profileStored = " +  result.profileStored);
                window.plugins.profileManager.installProfile(profileName);
            }, function (err) {
                Logger.log("Error storing storeProfile");
            });

        },
        onPress: function (event) {
            Logger.info("Button pressed **********");
            window.App.vent.trigger("WifiProfile:downloadStarted", this.step, this.controller);
        }
    });
});
