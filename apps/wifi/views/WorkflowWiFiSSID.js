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
    'tpl!apps/wifi/templates/WorkflowWiFiSSID.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getConnectedSSID: function () {
                    return window.App.currentConnection;
                }
            };
        },
        events: {
            "click #finish" : "onFinishBtn",
            "click #skip" : "onSkipBtn",
            "click .proceedFlow" : "onProceedBtn"
        },
        onBeforeRender: function () {
            Logger.debug("WorkflowWiFiSSID : before render");
            if (_.isUndefined(window.App.currentConnection)) {
                Logger.debug("WifiTelemetryView : no connections");
                window.App.currentConnection = "";
            }
        },
        initialize: function (options) {
            Logger.info("WorkflowWiFiSSID: initialize ");

            this.controller = options.controller;
            this.modify = false;

            var wifiInfo = options.wifiDetails;
            Logger.info("WorkflowWiFiSSID: options.wifiSSIDData " + options.wifiDetails);

            if (options.result === "ERROR") {
                window.App.currentConnection = "";
                return;
            }
            try {
                wifiInfo = JSON.parse(wifiInfo);
                Logger.info("WorkflowWiFiSSID: wifiInfo =>" + wifiInfo);
            } catch (ex) {
                Logger.debug("WifiTelemetryView : parser error " + ex);
            }
            if (!_.isUndefined(wifiInfo.networks)) {
                Logger.info("WorkflowWiFiSSID: Before wifiInfo.connectedNetwork :: JSON.stringify >>" + JSON.stringify(wifiInfo.networks));
                window.App.currentConnection = wifiInfo.networks;
            }
        },
        onRender: function () {
            Logger.info("WorkflowWiFiSSID: onRender ");
        },
        onProceedBtn: function (ev) {
            Logger.info("WorkflowWiFiSSID: onProceedBtn");
            var data = {},
                args = ev.target.id.split("_"),
                arg1 = args[1] + ",",
                arg2 = args[2] + ",";
            data.signalValue = "proceed";
            data.wifiSSIDConnect = arg1 + arg2;
            Logger.info("WorkflowWiFiSSID : data.wifiSSIDConnect" + data.wifiSSIDConnect);
            this.controller.signal(this.model.get("signal"), data);
        },
        onFinishBtn: function (ev) {
            Logger.info("WorkflowWiFiSSID: onFinishBtn");
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