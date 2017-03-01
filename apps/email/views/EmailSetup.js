/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App, $*/
define([
    'backbone.marionette',
	'underscore',
    'logger',
    'i18n!apps/email/nls/Messages',
    'tpl!apps/email/templates/EmailSetup.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n
            };
        },
        events: {
            "click #skipsetup" : "onSkipSetup",
            "click #configure_button" : "onSave"
        },
        initialize: function (options) {
            Logger.info("EmailSetup: initialize");
			var self = this;
            this.controller = options.controller;
            this.modify = false;
        },
        onRender: function () {
            Logger.info("EmailSetup: onRender");

        },
        onSkipSetup: function () {
            Logger.info("EmailSetup: onSkipSetup");

            var data = {"signalValue": "skip"};
            this.controller.signal(this.model.get("signal"), data);
        },
        onSave: function (event) {
            Logger.info("EmailSetup: onSave");

            var data = {},
                regex = null,
                regexid = null,
                regexpass = null,
                i,
                domainList,
				mailClients,
                mailClientsValue = "",
                self = this;

            if (this.model.attributes.regex !== null) {
                regex = new RegExp(this.model.attributes.regex);
            }
            if (this.model.attributes.regexid !== null) {
                regexid = new RegExp(this.model.attributes.regexid);
            }
            if (this.model.attributes.regexpass !== null) {
                regexpass = new RegExp(this.model.attributes.regexpass);
            }
            // hide all the error message when Save button is clicked
            this.$('#errormessagelabel').hide();
            this.$('#errormessageidlabel').hide();
            this.$('#errormessagepasslabel').hide();
            this.$('#errormessageconflabel').hide();

            if ((regex !== null) && (this.$('#emaildisplayname').val().match(regex) === null)) {
                this.$('#errormessagelabel').show();
                this.$('#emaildisplayname').focus();
            } else if ((regexid !== null) && (this.$('#emailid').val().match(regexid) === null)) {
                this.$('#errormessageidlabel').show();
                this.$('#emailid').focus();
            } else if ((regexpass !== null) && (this.$('#emailpassword').val().match(regexpass) === null)) {
                this.$('#errormessagepasslabel').show();
                this.$('#emailpassword').focus();
            } else if ((this.$('#emailpassword').val()) !== (this.$('#emailconpassword').val())) {
                this.$('#errormessageconflabel').show();
                this.$('#emailpassword').focus();
            } else {
                data[this.model.get("emaildisplayname")] = this.$('#emaildisplayname').val();
                data[this.model.get("emailid")] = this.$('#emailid').val();
                data[this.model.get("emailpassword")] = this.$('#emailpassword').val();
                data[this.model.get("emailconpassword")] = this.$('#emailconpassword').val();
                data[this.model.get("emaildomain")] = this.$('#emaildomain').val();
                data.isDefault = (this.$('#isDefault').attr('checked') === "checked") ? "YES" : "NO";
                this.$("input[type=radio]:checked").each(function () {
                    data[self.model.get("mailclients")] = this.value;
                });

				data.signalValue = "add";

                Logger.info("Submitting Values - Email Display Name :" + data[this.model.get("emaildisplayname")]);
                Logger.info("Submitting Values - Email Id :" + data[this.model.get("emailid")]);
                Logger.info("Submitting Values - Email Password :" + data[this.model.get("emailpassword")]);
                Logger.info("Submitting Values - Email Confirm Password :" + data[this.model.get("emailconpassword")]);
                Logger.info("Submitting Values - Email Domain :" + data[this.model.get("emaildomain")]);
                Logger.info("Submitting Values - Mail Clients :" + data[this.model.get("mailclients")]);
                Logger.info("Submitting Values - Make Default account :" + data.isDefault);
                Logger.info("Submitting Values - SignalValue:" + data.signalValue);

                // hide all the error message when sending values
                this.$('#errormessagelabel').hide();
                this.$('#errormessageidlabel').hide();
                this.$('#errormessagepasslabel').hide();
                this.$('#errormessageconflabel').hide();

                this.controller.signal(this.model.get("signal"), data);
            }
        }
    });
});
