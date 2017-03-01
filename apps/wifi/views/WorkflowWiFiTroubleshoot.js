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
    'tpl!apps/wifi/templates/WorkflowWiFiTroubleshoot.html'
], function (Marionette, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        fixAccounts: "",
        numFixAccounts: 0,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getAccountData: function () {
                    var accountData,
                        updatedAccountData,
                        idy = 0,
                        idx = 0,
                        updateAdd,
                        updateStatus,
                        updateSignalStrength,
                        ipAdd;
                    accountData = self.model.get("accountdata");
                    updatedAccountData = self.model.get("updatedaccountdata");
                    Logger.info("getAccountData :: accountData-length " + accountData.length);
                    Logger.info("getAccountData :: updatedAccountData-length " + updatedAccountData.length);
                    if (updatedAccountData !== 0) {
                        for (idy = 0; idy < updatedAccountData.length; idy = idy + 1) {
                            updateAdd = updatedAccountData[idy].IPAddress;
                            updateStatus = updatedAccountData[idy].status;
                            updateSignalStrength = updatedAccountData[idy].signalStrength;
                            for (idx = 0; idx < accountData.length; idx = idx + 1) {
                                ipAdd = accountData[idx].IPAddress;
                                if (ipAdd === updateAdd) {
                                    accountData[idx].status = updateStatus;
                                    accountData[idx].signalStrength = updateSignalStrength;
                                }
                            }
                        }
                        return accountData;
                    } else {
                        Logger.info("getAccountData :: else ");
                        return accountData;
                    }
                },
                getNumFixAccounts: function () {
                    Logger.info("Number of fix accounts = " + self.numFixAccounts);
                    return self.numFixAccounts;
                },
                addIPAddress: function (newIPAddress) {
                    Logger.info("addIPAddress " + newIPAddress);
                    if (self.fixAccounts === "") {
                        self.fixAccounts = newIPAddress;
                    } else {
                        self.fixAccounts += "," + newIPAddress;
                    }
                    return self.fixAccounts;
                },
                getStatusLabel: function (idx) {
                    var labels = self.model.get("statuslabels").split(",");
                    return labels[idx];
                }
            };
        },
        events: {
            "click .optionbtn" : "onOptionBtn",
            "click #refresh_button" : "onRefreshBtn"
        },
        initialize: function (options) {
            Logger.info("WiFiSummary: initialize ");

            this.controller = options.controller;
            this.modify = false;
        },
        onRender: function () {
            Logger.info("WiFiSummary: onRender ");
        },
        onOptionBtn: function (ev) {
            Logger.info("WiFiSummary: onOptionBtn");
            var data = {},
                args = ev.target.id.split("_"),
                arg1 = args[1] + ",",
                arg2 = args[2] + ",",
                arg3 = args[3] + ",",
                arg4 = args[4] + ",";
            data.signalValue = args[0];
            data.emailToFixOrTest = arg1 + arg2 + arg3 + arg4;
            this.controller.signal(this.model.get("signal"), data);
        },
        onRefreshBtn: function () {
            Logger.info("WiFiSummary: onRefreshBtn");
            var data = {};
            Logger.info("WiFiSummary: onRefreshBtn :: self.fixAccounts " + this.fixAccounts);
            data.emailToFixOrTest = this.fixAccounts;
            data.signalValue = "refresh";
            this.controller.signal(this.model.get("signal"), data);
        }
    });
});