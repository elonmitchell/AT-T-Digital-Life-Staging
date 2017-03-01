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
    'modules/workflow/workflow'
], function (Marionette, _, Logger, Workflow) {
    'use strict';
    return Marionette.Controller.extend({
        initialize: function (options) {
            Logger.info("BackgroundController: Initialize");
            this.app = options.app;
            this.model = options.model;
            App.vent.once("AppController:appLoadComplete", this._runBackgroundTasks, this);
        },
        _runBackgroundTasks: function () {
            var services = this.model.get('services'),
                operations,
                self = this;

            Logger.debug("BackgroundController: _runBackgroundTasks - starting");
            if (services) {
                services.each(function (service) {
                    operations = service.get('operations');
                    if (operations) {
                        // Loop through the operations
                        operations.each(function (operation) {
                            if (operation.get('type') === 'workflow') {
                                // This operation is a workflow, so launch it
                                Logger.debug("BackgroundControlller: running background flow" + operation.get('operationName'));
                                self._launchBackgroundFlow(operation);
                            } else {
                                Logger.warn("BackgroundController: Invalid background operation type - " + operation.get('type'));
                            }
                        });
                    }
                });
            }
        },
        _launchBackgroundFlow: function (operation) {
            Logger.debug("BackgroundController: _launchBackgroundFlow - " + operation.get('operationName'));
            var wfData = {},
                workflow,
                account = this.model.get('account');
            if (account) {

                if (operation && operation.attributes.attributes &&
                        operation.attributes.attributes.operationParameters) {
                    wfData = operation.attributes.attributes.operationParameters;
                }
                wfData.operationType = 'get';
                wfData.anonymous = account.get('anonymous') === true ? "true" : "false";

                workflow = Workflow.create({
                    baseURL: App.getURLRoot(),
                    name: operation.get("operationName"),
                    subscriberId: account.get("subscriberId"),
                    enableSuspendResume : false,
                    data: wfData
                });
                workflow.once('workflow:step:done', this._processDoneStep, this);
                workflow.once('workflow:step:error', this._processErrorStep, this);
                workflow.once('workflow:error', this._processErrorStep, this);
                workflow.start();
            } else {
                Logger.error("BackgroundController: _launchBackgroundFlow - Invalid account model");
            }
        },
        _processDoneStep: function (step, view, controller) {
            Logger.info("BackgroundController: _processDoneStep - Finished workflow - " + controller.model.get('name'));
        },
        _processErrorStep: function (step, view, controller) {
            Logger.error("BackgroundController: _processErrorStep - Error while running workflow");
        }
    });
});
