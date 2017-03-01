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
    'i18n!apps/email/nls/Messages',
    'tpl!apps/email/templates/EmailProfiles.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getEmailList: function () {
                    return window.App.emailAccountData;
                }
            };
        },
        events: {
            "click #finish" : "onFinishBtn",
            "click #skip" : "onSkipBtn",
            "click .proceedFlow" : "onProceedBtn"
        },
        onBeforeRender: function () {
            Logger.debug("EmailProfiles : before render");
            if (_.isUndefined(window.App.emailAccountData)) {
                Logger.debug("EmailProfiles : no emailaccounts");
                window.App.emailAccountData = "";
            }
        },
        initialize: function (options) {
            Logger.info("EmailProfiles: initialize ");

            this.controller = options.controller;
            this.modify = false;

            var emailList = options.emailDetails.emailAccountData;
            Logger.info("EmailProfiles: options.emailDetails " + emailList);

            if (options.result === "ERROR") {
                window.App.emailAccountData = "";
                return;
            }
            try {
				emailList = JSON.parse(emailList);
			} catch (ex) {
                Logger.debug("EmailProfiles : parser error " + ex);
            }
            if (!_.isUndefined(emailList)) {
				window.App.emailAccountData = emailList;
            }
        },
        onRender: function () {
            Logger.info("EmailProfiles: onRender ");
        },
        onProceedBtn: function (ev) {
            Logger.info("EmailProfiles: onProceedBtn");
            var data = {},
                args = ev.target.id.split("_"),
                arg1 = args[1] + ",",
                arg2 = args[2] + ",";
            data.signalValue = "proceed";
            data.emailConnect = arg1 + arg2;
            Logger.info("EmailProfiles : data.emailConnect" + data.emailConnect);
            this.controller.signal(this.model.get("signal"), data);
        },
        onFinishBtn: function (ev) {
            Logger.info("EmailProfiles: onFinishBtn");
            var data = {};
            data.signalValue = "finish";
            this.controller.signal(this.model.get("signal"), data);
        },
        onSkipBtn: function () {
            Logger.info("WorkflowWiFiSSID: onSkipBtn");
            var data = {};
            data.signalValue = "skip";
            this.controller.signal(this.model.get("signal"), data);
        }
    });
});