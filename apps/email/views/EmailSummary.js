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
    'tpl!apps/email/templates/EmailSummary.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        fixAccounts: "",
        numFixAccounts: 0,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getNumFixAccounts: function () {
                    Logger.info("Number of fix accounts = " + self.numFixAccounts);
                    return self.numFixAccounts;
                },
                addFixAccount: function (newFixAccounts) {
                    self.fixAccounts = self.fixAccounts + newFixAccounts;
                    self.numFixAccounts = self.numFixAccounts + 1;
                },
                getStatusLabel: function (idx) {
                    var labels = self.model.get("statuslabels").split(",");
                    return labels[idx];
                }
            };
        },
        events: {
            "click .optionbtn" : "onOptionBtn",
            "click .setdefaultbtn" : "onOptionBtn",
            "click .addaccount" : "onAddAccount",
            "click #fix_all_button" : "onFixAllBtn"
        },
        initialize: function (options) {
            Logger.info("EmailSummary: initialize");

            this.controller = options.controller;
            this.modify = false;
        },
        onRender: function () {
            Logger.info("EmailSummary: onRender");
        },
        onOptionBtn: function (ev) {
            Logger.info("EmailSummary: onOptionBtn");
            var data = {},
                args = ev.target.id.split("_"),
                arg1 = args[1] + ",",
                arg2 = args[2] + ",",
                arg3 = args[3] + ",",
                arg4 = args[4] + ",",
                arg5 = args[5] + ",";

            data.signalValue = args[0];
            data.emailToFixOrTest = arg1 + arg2 + arg3 + arg4 + arg5;
            this.controller.signal(this.model.get("signal"), data);
        },
        onFixAllBtn: function () {
            Logger.info("EmailSummary: onFixAllBtn");
            var data = {};

            data.signalValue = "fixAll";
            data.emailToFixOrTest = this.fixAccounts;
            this.controller.signal(this.model.get("signal"), data);
        },
        onAddAccount: function () {
            Logger.info("EmailSummary: onAddAccount");
            var data = {};

            data.signalValue = "add";
            data.emailToFixOrTest = "";
            this.controller.signal(this.model.get("signal"), data);
        }
    });
});
