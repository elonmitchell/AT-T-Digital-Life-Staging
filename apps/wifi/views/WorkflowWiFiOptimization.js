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
    'logger',
    'i18n!apps/wifi/nls/Messages',
    'tpl!apps/wifi/templates/WorkflowWiFiOptimization.html'
], function (Marionette, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        fixAccounts: "",
        numFixAccounts: 0,
        templateHelpers: function () {
            var self = this,
                badSignal = 0,
                redSignal = 0,
                orangeSignal = 0,
                greenSignal = 0;
            return {
                i18n: i18n,
                getAccountData: function () {
                    return self.model.get("accountdata");
                },
                getAccountDataLength: function () {
                    return self.model.get("accountdata").length;
                },
                getDeviceSummary: function () {
                    var summaryData,
                        idx = 0,
                        signalStrength,
                        signalData = {};

                    summaryData = self.model.get("accountdata");
                    for (idx = 0; idx < summaryData.length; idx = idx + 1) {
                        signalStrength = summaryData[idx].signalStrength;
                        if (signalStrength === "1") {
                            badSignal = badSignal + 1;
                        } else if (signalStrength === "2") {
                            redSignal = redSignal + 1;
                        } else if (signalStrength === "3") {
                            orangeSignal = orangeSignal + 1;
                        } else if (signalStrength === "4") {
                            greenSignal = greenSignal + 1;
                        }
                    }
                    signalData.badSignal  = badSignal;
                    signalData.redSignal  = redSignal;
                    signalData.orangeSignal  = orangeSignal;
                    signalData.greenSignal  = greenSignal;
                    return signalData;
                },
                getResolutionsData: function () {
                    return self.model.get("recommendedresolutionsdata");
                },
                cleanHostString: function (string) {
                    var cleanString = string.replace(/^,/, '');
                    return cleanString;
                },
                getHostCount: function (string) {
                    var array, i;
                    array = string.split(',');
                    return array.length;
                }
            };
        },
        events: {
            "click #refresh-btn" : "onRefreshBtn",
            "click .repogateway_btn" : "onRepoGatewayBtn",
            "click .setchannel_btn" : "onSetChannelBtn",
            "click .devicenotdetected_btn" : "onDeviceNotDetectedBtn",
            "click .badconnection_btn" : "onBadConnectionBtn",
            "click .showSummary_btn" : "onShowSummaryBtn",
            "click #showRecom_btn" : "onShowRecommendSettings"

        },
        initialize: function (options) {
            Logger.info("WiFiOptimization: initialize ");

            this.controller = options.controller;
            this.modify = false;
        },
        onRender: function () {
            Logger.info("WiFiOptimization: onRender ");
        },
        onRepoGatewayBtn: function () {
            Logger.info("WiFiOptimize: onRepoGatewayBtn");
            var data = {};
            Logger.info("WiFiOptimize: onRepoGatewayBtn :: self.fixAccounts ");
            data.signalValue = "repositiongateway";
            this.controller.signal(this.model.get("signal"), data);
        },
        onShowSummaryBtn: function () {
            Logger.info("WiFiOptimize: onShowSummaryBtn");
            this.$("#tableSummaryMobile").show();
            this.$(".devicenotdetected_btn").show();
            this.$("#recommendedContainer").hide();
            this.$("#refresh-btn").hide();
            this.$(".showSummary_btn").hide();
            this.$("#showRecom_btn").show();
        },
        onShowRecommendSettings: function () {
            Logger.info("WiFiOptimize: onShowRecommendSettings");
            this.$("#tableSummaryMobile").hide();
            this.$(".devicenotdetected_btn").hide();
            this.$("#recommendedContainer").show();
            this.$("#refresh-btn").show();
            this.$(".showSummary_btn").show();
            this.$("#showRecom_btn").hide();
        },
        onSetChannelBtn: function () {
            Logger.info("WiFiOptimize: onSetChannelBtn");
            var data = {};
            Logger.info("WiFiOptimize: onSetChannelBtn :: self.fixAccounts ");
            data.signalValue = "setChannel";
            this.controller.signal(this.model.get("signal"), data);
        },
        onDeviceNotDetectedBtn: function (e) {
            e.preventDefault();
            e.stopPropagation();
            Logger.info("WiFiOptimize: onDeviceNotDetectedBtn");
            var data = {};
            Logger.info("WiFiOptimize: onDeviceNotDetectedBtn :: ");
            data.signalValue = "devicenotdetected";
            this.controller.signal(this.model.get("signal"), data);
        },
        onBadConnectionBtn: function () {
            Logger.info("WiFiOptimize: onBadConnectionBtn");
            var data = {};
            Logger.info("WiFiOptimize: onBadConnectionBtn :: ");
            data.signalValue = "badconnection";
            this.controller.signal(this.model.get("signal"), data);
        },
        onRefreshBtn: function () {
            Logger.info("WiFiOptimize: onRefreshBtn");
            var data = {};
            data.signalValue = "refresh";
            this.controller.signal(this.model.get("signal"), data);
        }
    });
});