/*
 * Copyright (c) 2014 Motive, Inc.
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
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowMobileConfigureProfile.html'
], function ($, Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers:  function () {
            var self = this;
            return {
                i18n : i18n,
                getBody: function () {
                    return self.model.get('body') || "";
                },
                getContinueText: function () {
                    return self.model.get('continueText') || "";
                },
                getErrorText: function () {
                    return self.model.get('errorText') || "";
                }
            };
        },
        initialize: function (options) {

            Logger.debug("WorkflowMobileConfigureProfile : initialize");
            this.controller = options.controller;
            this.profileManager = options.profileManager;
            this.profileConfigured = "failure";

            var self = this,
                errorMsg = "",
                profileName = this.model.get('profileId'),
                exProfileData = this.model.get('profileData'),
                nextData = {signalValue: "failure"},
                profileData = {
                    "id" : profileName,
                    "description" : this.model.get('profileDescription'),
                    "expires" : parseInt(this.model.get('cacheExpire'), 10)
                };


            window.App.vent.on("app:resume", self.onResume, this);
            this.$el.on('click', '#continue', _.bind(self.onPress, this));
            this.$el.on('click', '#download_profile', _.bind(self.onProfilePress, this));

            // Merge any extra profileData
            if (!_.isUndefined(exProfileData)) {
                _.extend(profileData, exProfileData);
            }

            this.profileData = profileData;

            if (_.isUndefined(this.profileManager)) {
                Logger.error("WorkflowController:_processProfileConfigureStep Profile Manager library unavailable");
                this.controller.signal(this.profileConfigured, nextData);
                return;
            }

            if (!_.isUndefined(window.App.platform) && window.App.platform === "Android") {
                if (!_.isEmpty(this.model.get('profileInboxDocument')) || !_.isNull(this.model.get('profileInboxDocument'))) {               // make sure theres xml document
                    _.extend(this.profileData, {"iot" : this.model.get('profileInboxDocument')});
                } else {
                    errorMsg = "WorkflowController:_processProfileConfigureStep inbox document not available for Android configuration";
                    Logger.error(errorMsg);
                    this.controller.trigger("workflow:error", errorMsg);
                    return;
                }
                // Apply profile and set the signalValue to "success" or "failure"
                this.profileManager._sendInboxDocument(this.profileData.iot, function (profileConfigured) {
                    nextData.signalValue = profileConfigured;
                    if (profileConfigured === "success") {
                        self.backupProfile();
                    }
                    self.controller.signal(profileConfigured, nextData);
                });
            } else {     //load the view if ios
                if (!_.isEmpty(this.model.get('profileURL')) || !_.isNull(this.model.get('profileURL'))) {
                    _.extend(this.profileData, {"URL" : this.model.get('profileURL')});
                } else {
                    errorMsg = "WorkflowController:_processProfileConfigureStep profile URL not available for IOS configuration";
                    Logger.error(errorMsg);
                    this.controller.trigger("workflow:error", errorMsg);
                    return;
                }
                this.controller.view.showContent(this);
            }
        },
        onResume: function () {
            var self = this;
            Logger.debug("WorkflowMobileConfigureProfile : onResume called, checking for profile install state");
            this.profileManager.isProfileInstalled(this.model.get('profileId'), function (ret) {
                Logger.debug("WorkflowMobileConfigureProfile : isProfileInstalled return value = " + ret);
                self.profileConfigured = ret;
                self.showDownloadContent(ret);
            });

        },
        onProfilePress: function (event) {
            var self = this,
                profileName = this.profileData.id;
            Logger.debug("WorkflowMobileConfigureProfile : onProfilePressed");
            event.stopPropagation();

            Logger.debug("WorkflowMobileConfigureProfile : onProfilePressed -  profileName=" + profileName);
            if (!_.isUndefined(this.profileManager)) {
                this.profileManager.installProfile(this.profileData.URL, profileName, function (profileConfigured) {
                    Logger.debug("WorkflowMobileConfigureProfile : onProfilePressed -  installProfile return value =" + profileConfigured);
                    self.profileConfigured = profileConfigured;
                    if (self.profileConfigured === "failure") {
                        self.showDownloadContent("downloadFailure");
                    }
                });
            } else {
                Logger.error("WorkflowMobileConfigureProfile : onProfilePressed - profileManager is undefined!");
            }
        },
        onPress: function () {
            Logger.debug("WorkflowMobileConfigureProfile : onPress" + this.profileConfigured);
            var nextData = {},
                profileName = this.profileData.id;

            // Set our signalValue
            nextData.signalValue = this.profileConfigured;
            if (!_.isUndefined(this.profileManager)) {
                if (this.profileConfigured === "success") {
                    this.backupProfile();
                } else {
                    Logger.debug("WorkflowMobileConfigureProfile : onPress - delete IOS profile - " + profileName);
                    this.profileManager.deleteIOSProfile(profileName, function (result) {});
                }
            }
            // Send our signal
            this.controller.signal(this.profileConfigured, nextData);
        },
        showDownloadContent: function (status) {
            Logger.debug("WorkflowMobileConfigureProfile : showDownloadContent called with status - " + status);
            switch (status) {
            case "failure":
            case "downloadFailure":
                this.$el.find(".download-content").hide();
                this.$el.find(".continue-content").hide();
                this.$el.find(".error-content").fadeIn(150);
                break;
            case "success":
                this.$el.find(".error-content").hide();
                this.$el.find(".download-content").hide();
                this.$el.find(".continue-content").fadeIn(150);
                break;
            }
        },
        backupProfile: function () {
            // Cache the profile if told to
            if (this.model.get('cacheProfile') !== false) {
                if (this.model.get('overwrite') === false) {
                    if (this.model.get('profileType') === 'email') {
                        this.profileManager.storeEmailProfile(this.profileData); //backup if backup is available
                    } else if (this.model.get('profileType') === 'wifi') {
                        this.profileManager.storeWifiProfile(this.profileData); //backup if backup is available
                    }
                } else {
                    if (this.model.get('profileType') === 'email') {
                        this.profileManager.updateEmailProfile(this.profileData); //update if available
                    } else if (this.model.get('profileType') === 'wifi') {
                        this.profileManager.updateWifiProfile(this.profileData); //update if available
                    }
                }
            } else {
                if (!_.isUndefined(window.App.platform) && window.App.platform === "iOS") {
                    Logger.debug("WorkflowMobileConfigureProfile : onPress - delete IOS profile - " + this.profileData.id);
                    this.profileManager.deleteIOSProfile(this.profileData.id, function (result) {});
                }
            }
        }
    });
});
