/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App
*/
define([
    'backbone',
    'underscore',
    'backbone.marionette',
    'logger',
    'modules/workflow/workflow',
    'apps/internet/views/PCHCLayout',
    'apps/internet/views/InternetDomain',
    'apps/internet/views/InternetServiceList',
    'apps/internet/views/StatusDetail',
    'i18n!nls/Messages'
], function (Backbone, _, Marionette, Logger,  Workflow,
             PCHCLayout, DomainView, ServiceView, StatusDetailView, i18n) {
    'use strict';
    return Marionette.Controller.extend({
        initialize: function (options) {
			var ExecutionSessionId;
			this.ExecutionSessionId = null;
            Logger.debug("InternetController : initialize");
            App.vent.on("pchc:launchCheck", this.launchCheck, this);
            App.vent.on("pchc:statusClick", this._showOperationStatusDetail, this);
        },
        showChecks: function () {
            Logger.debug("InternetController : showChecks");

            var domain,
                services,
                serviceView,
                domainView,
                workflowName;

            if (this.pchcLayout === undefined) {
                this.pchcLayout = new PCHCLayout();
            }

            App.vent.trigger("dashboard:showView", this.pchcLayout, i18n.get('internetImageUrl'), i18n.get('internetText'));

            domain = this.options.model;
            workflowName = domain.attributes.attributes.workflow;

            Logger.log("InternetDomain : got workflow: " + workflowName);

            domainView = new DomainView({model: domain, app: App});
            this.pchcLayout.domainDetail.show(domainView);

            services = domain.get("services");

            services.each(function (service) {
                var operations = service.get("operations");
                operations.fetch();
            });

            serviceView = new ServiceView({collection: services});
            this.pchcLayout.serviceList.show(serviceView);

            this.statusDetailView = new StatusDetailView();
            this.pchcLayout.statusDetail.show(this.statusDetailView);
            this.launchCheck(workflowName);

        },
        _showOperationStatusDetail: function (operationName) {
            Logger.debug("InternetController:_showOperationStatusDetail - operation = " + operationName);
            var services = this.options.model.get('services'),
                operations,
                tmpOperation,
                operation = null;

            // Find the operation model
            services.each(function (service) {
                operations = service.get("operations");
                tmpOperation = operations.get(operationName);
                if (!_.isUndefined(tmpOperation)) {
                    operation = tmpOperation;
                }
            });

            if (_.isNull(operation)) {
                // Didn't find an operation, bail
                Logger.debug("InternetController:_showOperationStatusDetail - did not find operation (" + operationName + ")");
                return;
            }

            if (!_.isUndefined(this.statusDetailView)) {
                this.statusDetailView.showStatusDetail(operation);
            }
        },
        launchCheck: function (workflowName, data) {
            Logger.debug("InternetController : launchCheck : " + workflowName + "  data: " + data);
            if (data === undefined) {
                data = {"operationType": "get", "browser": "yes", "system": "yes", "security": "yes", "network": "no", "connectivity": "no"};
            }

            var domain = this.options.model,
                subscriberId = domain.get("account").get("subscriberId"),
                anonymous = domain.get("account").get("anonymous");
			data.isCSRFlow = window.App.configuration.get('csrMode') === "true" ? "yes" : "no";
			if (data.isCSRFlow === "yes") {
				Logger.debug("InternetController : data.isCSRFlow : " + data.isCSRFlow);
				data.EndpointID = window.App.qParams.EndpointID;
				Logger.debug("InternetController : data.EndpointID : " + data.EndpointID);
                data.SubscriberID = window.App.qParams.subscriberId;
				Logger.debug("InternetController : data.SubscriberID : " + data.SubscriberID);
				data.ExecutionSessionId = this.ExecutionSessionId || "";
				Logger.debug("InternetController : data.subscriberOSName : " + data.subscriberOSName);
				data.SubscriberOSName = window.App.qParams.subscriberOSName;
			}
			data.anonymous = anonymous === true ? "true" : "false";
            this.workflow = Workflow.create({
                baseURL : App.getURLRoot(),
                name : workflowName,
                subscriberId : subscriberId,
                data : data
            });

            this.workflow.on('done', this._processDoneStep, this);
            this.workflow.on('workflow:step:dataevent', this._processDataEvent, this);
            this.workflow.on("workflow:step:info", this.workflowError, this);
            this.workflow.start();

            this.pchcLayout.workflowDiv.show(this.workflow.getView());
        },
        _processDoneStep: function (step) {
            Logger.info("InternetController: Workflow: Process Done Step");
            this.workflow.off("workflow:step:info", this.workflowError);
            App.vent.trigger("pchc:workflowDone");
            this.workflow = null;
		},
        _processDataEvent: function (step, workflowView, workflowController) {
            Logger.info("InternetController: Workflow: Process Data Event Step");

            var currentService,
                currentOperation,
                nextData,
                results,
                name = step.get('name');
            if (name !== undefined) {
                Logger.info("InternetController: Workflow: process " + name);
                if (name === "ClientInstall") {
                    this.pchcLayout.showWorkflow();
                }
				if (name === "ExecutionSessionId") {
					// The below line was not working so commented and assigned the results from getting the step results
					// results = data.results;
					results = step.get('results');
					this.ExecutionSessionId = results;
                }
                if (name === "ClientInstallComplete") {
                    this.pchcLayout.hideWorkflow();
                }
                if (name === "CheckResults") {
                    results = step.get('results');
					Logger.info("InternetController: CheckResults: results " + results);
                    _.each(results, function (item) {
                        if (item.service !== undefined && item.name !== undefined) {
                            currentService = this.options.model.get("services").get(item.service);
                            if (currentService) {
                                currentOperation = currentService.get("operations").get(item.name);
                                if (!_.isUndefined(currentOperation) && !_.isNull(currentOperation)) {
                                    Logger.info("InternetController: Setting result:" + item.result + " for Operation: " + item.name + " Service: " + item.service);
                                    currentOperation.set("statusText", item.statusText);
									currentOperation.set("currentValueText", item.currentValueText);
									currentOperation.set("recommendedValueText", item.recommendedValueText);
                                    currentOperation.set("result", item.result);
                                } else {
                                    Logger.error("InternetController: _processDataEvent - Received data for (" + item.name + ") which doesn't exist");
                                }
                            }
                        }
                    }, this);
                }
            }
            step.set('handled', true, {silent: true});
            nextData = {};
            nextData.signalValue = "next";
            workflowController.signal(step.get("signal"), nextData);
        },
        workflowError: function (step, view, workflow) {
            if (this.pchcLayout) {
                if (this.pchcLayout.installClient === true) {
                    Logger.debug("InternetController : workflowError - no error, part of client install ");
                } else {
                    Logger.debug("InternetController : workflowError ");
                    this.workflow.off("workflow:step:info", this.workflowError);
                    App.vent.trigger("pchc:workflowDone");
                    this.workflow = null;
                }
            }
        }
    });
});