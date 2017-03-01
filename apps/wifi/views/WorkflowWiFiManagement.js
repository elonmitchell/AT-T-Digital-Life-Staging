/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App,$*/
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!apps/wifi/nls/Messages',
    'tpl!apps/wifi/templates/WorkflowWiFiManagement.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getNetnameValue: function () {
                    return self.model.get(self.model.get("netname"));
                },
                getPasswordValue: function () {
                    return self.model.get(self.model.get("password"));
                },
                getChannelValue: function () {
                    return self.model.get(self.model.get("channel"));
                },
                getSecurityTypeValue: function () {
                    return self.model.get(self.model.get("securitytype"));
                },
                getVisibilityValue: function () {
                    return self.model.get(self.model.get("visibility"));
                }
            };
        },
        events: {
            "click #skipsetup" : "onSkipSetup",
            "click #restore_button" : "onRestore",
            "click #save_button" : "onSave",
            "click #done_button" : "onDone",
            "click #autoenable_button" : "onEnableAuto",
            "click #regeneratepassword_button" : "onRegeneratePwd",
            "click #advanced" : "onAdvanced",
            "click #configactivate" : "onConfigActivate"
        },
        initialize: function (options) {
            Logger.info("WiFiManagement:initialize");
            var self = this;

            this.$el.on('click', '#skipsetup', _.bind(self.onSkipSetup, this));
            this.$el.on('click', '#restore_button', _.bind(self.onRestore, this));
            this.$el.on('click', '#save_button', _.bind(self.onSave, this));
            this.$el.on('click', '#done_button', _.bind(self.onDone, this));
            this.$el.on('click', '#advanced', _.bind(self.onAdvanced, this));
            this.$el.on('click', '#autoenable_button', _.bind(self.onEnableAuto, this));
            this.$el.on('click', '#regeneratepassword_button', _.bind(self.onRegeneratePwd, this));
            this.$el.on('click', '#configactivate', _.bind(self.onConfigActivate, this));

            this.controller = options.controller;
            this.modify = false;
        },
        onRender: function () {
            Logger.info("OnRender Method Invoked");

            this.$("#advanced-settings").hide();
        },
        onConfigActivate: function () {
            this.$(".leftcolumn").show();
            this.$(".rightcolumn").hide();
            this.$("#btnBarConfig").hide();
        },
        onSkipSetup: function () {
            Logger.info("WorkflowWiFiManagement - onSkipSetup");

            var data = {"signalValue": "skip"};
            this.controller.signal(this.model.get("signal"), data);
        },
        onRestore: function () {
            Logger.info("WorkflowWiFiManagement - onRestore");

            var data = {"signalValue": "restore"};
            this.controller.signal(this.model.get("signal"), data);
        },
        onEnableAuto: function () {
            Logger.info("WorkflowWiFiManagement - onEnableAuto");

            var data = {"signalValue": "disable"};
            this.controller.signal(this.model.get("signal"), data);
        },
        onRegeneratePwd: function () {
            Logger.info("WorkflowWiFiManagement - onRegeneratePwd");

            var data = {"signalValue": "regeneratepass"};
            this.controller.signal(this.model.get("signal"), data);
        },
        onSave: function (event) {
            Logger.info("WiFiManagement: onSave");

            var data = {},
                regex = null,
                regexpass = null,
                i,
                visibilitylist,
                visibilityValue = "";

            if (this.model.attributes.regex !== null) {
                regex = new RegExp(this.model.attributes.regex);
            }
            if (this.model.attributes.regexpass !== null) {
                regexpass = new RegExp(this.model.attributes.regexpass);
            }
            if ((regex !== null) && (this.$('#netname').val().match(regex) === null)) {
                this.$('#errormessagelabel').show();
                this.$('#errormessagepasslabel').hide();
                this.$('#netname').focus();
            } else if ((regexpass !== null) && (this.$('#password').val().match(regexpass) === null)) {
                this.$('#errormessagepasslabel').show();
                this.$('#errormessagelabel').hide();
                this.$('#password').focus();
            } else {
                data[this.model.get("netname")] = this.$('#netname').val();
                data[this.model.get("password")] = this.$('#password').val();
                data[this.model.get("securitytype")] = this.$('#cbSecurity').val();
                data[this.model.get("channel")] = this.$('#cbChannel').val();
                data[this.model.get("visibility")] = this.$('#visibility').val();

                if (this.$("#backup").is(':checked')) {
                    data.backupSettings = "true";
                    Logger.info("##################### BackupSettings Value" + data.backupSettings);
                } else {
                    data.backupSettings = "false";
                    Logger.info("##################### BackupSettings Value" + data.backupSettings);
                }

                data.signalValue = "save";

                this.$('#errormessagelabel').hide();
                this.$('#errormessagepasslabel').hide();

                this.controller.signal(this.model.get("signal"), data);
            }
        },
        onDone: function () {
            Logger.info("WorkflowWiFiManagement - onDone");

            var data = {"signalValue": "done"};
            this.controller.signal(this.model.get("signal"), data);
        },
        onAdvanced: function () {
            this.$("#advanced-settings").toggle();
        }
    });
});
