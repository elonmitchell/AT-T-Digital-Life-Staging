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
    'apps/myDevice/views/MyDevice',
    'apps/myDevice/views/CPEInfoView',
    'i18n!apps/myDevice/nls/Messages'
], function (Marionette, _, Logger, Workflow, MyDeviceView, CPEInfoView, i18n) {
    'use strict';
    return Marionette.Controller.extend({
        initialize: function (options) {
            Logger.info("MyDeviceController: Initialize");

        },
        showDeviceInfo: function () {
            var data = {},
                domain = this.options.model,
                subscriberId = domain.get("account").get("subscriberId"),
                anonymous = domain.get("account").get("anonymous"),
                workflowName = domain.attributes.attributes.workflow;

            data.anonymous = anonymous === true ? "true" : "false";

            Logger.debug("MyDeviceController : showDeviceInfo");
            if (!_.isUndefined(this.deviceView)) {
                this.deviceView = null;
            }

            if (_.isUndefined(workflowName)) {
                workflowName = "SSC_My_Device";
            }

            this.deviceView = new MyDeviceView();
            Logger.debug("MyDeviceView Created : " + this.deviceView);

            this.cpeInfoView = new CPEInfoView();
            Logger.debug("CPEInfoView Created : " + this.cpeInfoView);
            Logger.debug("MyDeviceView.Layout Created : " + this.deviceView.myDeviceLayout);

            App.vent.trigger("showDashboardContent", this.deviceView);

            Logger.debug("MyDeviceController : launchCheck : " + workflowName + "  data: " + data);

            this.workflow = Workflow.create({
                baseURL: App.getURLRoot(),
                name: workflowName,
                subscriberId: subscriberId,
                data: data
            });

            this.workflow.on('done', this._processDoneStep, this);
            this.workflow.on('error', this._processError, this);
            this.workflow.on('dataevent', this._processDataEvent, this);

            this.workflow.on("workflow:step:info", this.workflowError, this);
            this.workflow.start();

            this.deviceView.myDeviceLayout.show(this.workflow.getView());
        },
        _processDoneStep: function (step) {
            Logger.info("MyDeviceController: Workflow: Process Done Step");
            this.workflow.off("workflow:step:info", this.workflowError);
            this.workflow = null;
            App.vent.trigger("cpeWorkflowDone");

            this.deviceView.myDeviceLayout.show(this.cpeInfoView);

            if (this.cpeData && this.cpeData.make !== "") {
                this.cpeInfoView.showDeviceDetail(this.cpeData);
            } else {
                this.cpeInfoView.showDeviceNotFound();
            }
        },
        _processError: function () {
            Logger.info("MyDeviceController: Workflow: Process Error");
            this.workflow.off("workflow:step:info", this.workflowError);
            this.workflow.stop();
            this.workflow = null;

            this.deviceView.myDeviceLayout.show(this.cpeInfoView);
            this.cpeInfoView.showDeviceNotFound();
        },
        _processDataEvent: function (data, step, workflowcontroller) {
            Logger.info("MyDeviceController: Workflow: Process Data Event Step");

            if (data !== undefined) {
                this.cpeData = data;
            } else {
                this.cpeData = {make: '', model: ''};
            }

            workflowcontroller.signal(step.get("signal"), {signalValue: 'next'});
        },
        workflowError: function (step, view, workflow) {
            Logger.debug("MyDeviceController : workflowError - no error, part of client install ");
        }

    });
});