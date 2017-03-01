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
	'modules/workflow/workflow',
	'apps/wifi/views/WorkflowWiFiManagement',
	'apps/wifi/views/WorkflowWiFiTroubleshoot',
	'apps/wifi/views/WorkflowWiFiOptimization',
	'apps/wifi/views/WifiProfile',
    'apps/wifi/views/RebootDialog',
	'i18n!modules/workflow/nls/Workflow'
], function (Marionette, _, Logger, Workflow, WiFiManagementView, WiFiTroubleshootView,
             WiFiOptimizationView, WifiProfileView, RebootDialog, i18n) {
	'use strict';
	return Marionette.Controller.extend({
	    initialize: function (options) {
			this.app = options.app;
			Logger.debug("WiFiController: Initialize");

			App.vent.on("workflow:step:wifimanagement", this.processWiFiStep, this);
			App.vent.on("workflow:step:wifitroubleshoot", this.processWiFiSummaryStep, this);
			App.vent.on("workflow:step:wifioptimization", this.processWiFiOptimizationStep, this);
            App.vent.on("workflow:step:dataevent:rebootDialogShow", this._processRebootDialogShow, this);
            App.vent.on("workflow:step:dataevent:rebootDialogHide", this._processRebootDialogHide, this);
		},
        showStep: function (workflowView, view, headerView) {
            headerView.animate = true;
            workflowView.header.show(headerView);
            workflowView.content.show(view);
        },
		processWiFiStep: function (step, workflowView, workflowController) {
			Logger.debug("WiFiController: Process WiFi Step");

			if (_.isUndefined(step.get("title"))) {
				step.set("title", i18n.get("invalidTitle"));
			}
			if (_.isUndefined(step.get("button"))) {
				step.set("button", i18n.get("invalidButton"));
			}
			var view = new WiFiManagementView({
				model : step,
				controller : workflowController
			});

			workflowView.content.show(view);
			step.set("handled", true);
		},
		processWiFiSummaryStep: function (step, workflowView, workflowController) {
            Logger.info("WiFiController: Process WiFi Summary Step");

            if (_.isUndefined(step.get("title"))) {
                step.set("title", i18n.get("invalidTitle"));
            }
            if (_.isUndefined(step.get("button"))) {
                step.set("button", i18n.get("invalidButton"));
            }
            var view = new WiFiTroubleshootView({
                model : step,
                controller : workflowController
            });

            workflowView.content.show(view);
            step.set("handled", true);
        },
		processWiFiOptimizationStep: function (step, workflowView, workflowController) {
            Logger.info("WiFiController: Process WiFi Optimization Step");

            if (_.isUndefined(step.get("title"))) {
                step.set("title", i18n.get("deviceSummaryText"));
            }
            if (_.isUndefined(step.get("button"))) {
                step.set("button", i18n.get("invalidButton"));
            }
            var view = new WiFiOptimizationView({
                model : step,
                controller : workflowController
            });
            this.showStep(workflowView, view, workflowView.headerView);
            step.set("handled", true);
        },
		_processRebootDialogShow: function (step, workflowView, workflowController) {
            Logger.info("WiFiController: Process RebootDialogShow Step");

            if (_.isUndefined(step.get("title"))) {
                step.set("title", i18n.get("deviceSummaryText"));
            }
            if (_.isUndefined(step.get("button"))) {
                step.set("button", i18n.get("invalidButton"));
            }
            this.rebootView = new RebootDialog({
                model : step,
                controller : workflowController
            });

            var nextData = {};

            this.showStep(workflowView, this.rebootView, workflowView.headerView);
            step.set("handled", true);
            nextData.signalValue = "next";
            workflowController.signal(step.get("signal"), nextData, true);
        },
        _processRebootDialogHide: function (step, workflowView, workflowController) {
            Logger.info("WiFiController: Process RebootDialogHide Step");
            var nextData = {};
            if (!_.isUndefined(this.rebootView)) {
                this.rebootView.closeDialog();
            }
            step.set("handled", true);
            nextData.signalValue = "next";
            workflowController.signal(step.get("signal"), nextData);
        },
        _processDataEvent: function (step, workflowView, workflowController) {
            Logger.info("WiFiTestController: Process Data Event Step");
        }
    });
});