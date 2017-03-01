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
    'backbone.marionette',
    'underscore',
    'logger',
    'environment',
    'modules/workflow/models/Workflow',
    'modules/workflow/models/WorkflowStep',
    'modules/workflow/views/Workflow',
    'modules/workflow/views/WorkflowInfo',
    'modules/workflow/views/WorkflowLocalPCCheck',
    'modules/workflow/views/WorkflowMenu',
    'modules/workflow/views/WorkflowMobileConfigureProfile',
    'modules/workflow/views/WorkflowPrompt',
    'modules/workflow/views/WorkflowSelector',
    'modules/workflow/views/WorkflowQuestion',
    'i18n!modules/workflow/nls/Messages'
], function (Marionette, _, Logger, Env, WorkflowModel, WorkflowStepModel,
             WorkflowView, InfoView, LocalPCCheckView, MenuView,
             MobileProfileDownloadView, PromptView, SelectorView, QuestionView, i18n) {
    'use strict';
    return Marionette.Controller.extend({
        GET_STEP_TIMEOUT: 10000,
        running: false,
        customStepTrail: {},     // This contains custom step names in the step trail
        initialize: function (options) {
            Logger.debug("WorkflowController : initialize");
            var wfStartOptions,
                self = this;
            if (options.data === undefined || options.data === null) {
                options.data = {};
            }
            // Set default breadcrumb cfg
            if (options.breadCrumbCfg === undefined || options.breadCrumbCfg === null) {
                options.breadCrumbCfg = {enable: false};
            }
            // Set the environment values in the data property
            Env.getEnvironment(options.data);
            options.data.subscriberId = options.subscriberId;

            // Add in mobile device properties
            if (!_.isUndefined(window.App.cafid)) {
                options.data.cafid = window.App.cafid;
                options.data.manufacturer = window.App.manufacturer || "";
                options.data.model = window.App.modelName || "";
                options.data.platform = window.App.platform;
                options.data.clientVersion = window.App.configuration.get("version");
                options.data.osVersion = window.App.osVersion;

                Logger.debug("WorkflowController: loading device functions and profile manager libs");
                try {
                    require(["utilities/deviceFunctions", "utilities/profileManager"], function (DeviceFunctions, ProfileManager) {
                        self.deviceFunctions = DeviceFunctions;
                        self.profileManager = ProfileManager;
                    });
                } catch (ex) {
                    Logger.error("WorkflowController: Unable to load libraries " + ex);
                }
            }

            wfStartOptions = {name: options.name,
                subscriberId: options.subscriberId,
                locale: i18n.lang(),
                data: options.data};
            if (options.breadCrumbCfg.enable === true) {
                wfStartOptions.breadcrumbs = options.breadCrumbCfg.enable;
            }
            // Setup resume flow and executionEnvironment
            if (!_.isUndefined(options.data.executionId)) {
                wfStartOptions.executionId = options.data.executionId;
            }
            if (!_.isUndefined(options.data.executionEnvironmentId)) {
                wfStartOptions.executionEnvironmentId = options.data.executionEnvironmentId;
            }

            this.model = new WorkflowModel(wfStartOptions, {baseURL : options.baseURL});
            this.model.bind('change:status', this._processStatus, this);
            this.model.bind('change:step', this._processStep, this);
            this.bind('workflow:error', this._processError, this);
            this.step = new WorkflowStepModel({controller: this});
            this.step.workflow = this.model;

            this.view = new WorkflowView({model: this.step, controller: this, breadCrumbCfg : options.breadCrumbCfg});
        },
        isSuspendResumeEnabled: function () {
            return (this.options.enableSuspendResume && this.lastStep !== true) || false;
        },
        start: function () {
            Logger.debug("WorkflowController : start");
            if (!this.running) {
                this.model.save();
                this.running = true;
                this.customStepTrail = {};
                App.vent.trigger("events:startPolling");
            } else {
                Logger.debug("WorkflowController: start - Already running, render last view");
                // Reset the step handled property so the step will be handled like a new step
                this.step.set("handled", false, {silent: true});
                this.view = null; // Mark the old view for garbage collection
                // Create a new workflow view since our regions have been closed
                // when the view was switched
                this.view = new WorkflowView({
                    model: this.step,
                    controller: this,
                    breadCrumbCfg : this.options.breadCrumbCfg
                });
                // Need to defer this so the workflow view has time to render its
                // regions before we render the step view.
                _.defer(function (self) {
                    self._showStep({}, self.step);
                }, this);
                App.vent.trigger("events:resumePolling");
            }
        },
        event: function (name, data, silent) {
            Logger.debug("WorkflowController : event = " + name + " data = " + data);

            if (_.isUndefined(silent) || silent !== true) {
                // Reset the message to prevent a previous node
                // message from being displayed when it shouldn't be.
                this.step.set('isSuspendButtonHidden', true, {silent: true});
                this.step.set('header', '', {silent: true});
                this.step.set('body', '');
                this.view.showProgress();
            }

            if (this.running) {
                // Make sure we resume polling
                App.vent.trigger("events:resumePolling");
                var event = {};

                event.name = name;
                if (data !== null) {
                    event.data = data;
                } else {
                    event.data = {};
                }
                this.model.set("event", event);
                this.model.set('signal', null, {silent: true}); // Clear out the last signal
                this.model.set("step", null, {silent: true});  // Clear out the last step

                this.model.save();
            }
        },
        signal: function (name, data, silent, lastStep) {
            Logger.debug("WorkflowController : signal = " + name + " data = " + data);

            if (_.isUndefined(silent) || silent !== true) {
                // Reset the message to prevent a previous node
                // message from being displayed when it shouldn't be.
                if (lastStep !== true) {
                    this.step.set('isSuspendButtonHidden', true, {silent: true});
                    this.step.set('header', '', {silent: true});
                    this.step.set('body', '');
                }
                this.view.showProgress();
            }

            if (this.running) {
                // Make sure we resume polling
                App.vent.trigger("events:resumePolling");
                var signal = {},
                    step,
                    customStepNames,
                    stepName = null,
                    idx = 0;

                signal.name = name;
                if (data !== null) {
                    signal.data = data;
                } else {
                    signal.data = {};
                }
                signal.stepId = null;

                step = this.model.get("step");
                if (step !== null) {
                    signal.stepId = step.id;
                    // Custom step name support
                    customStepNames = this.stepTrailNames;
                    if (!_.isUndefined(customStepNames)) {
                        for (idx = 0; idx < customStepNames.length; idx += 1) {
                            if (customStepNames[idx].signal === signal.name) {
                                stepName = customStepNames[idx].stepName;
                            }
                        }
                        if (!_.isNull(stepName)) {
                            this.customStepTrail[step.id] = stepName;
                        }
                    }
                }
                this.model.set("signal", signal);
                this.model.set('event', null, {silent: true}); // Clear out the last event
                this.model.set("step", null, {silent: true});  // Clear out the last step

                this.model.save();
            }
        },
        getCustomStepName: function (stepID) {
            return this.customStepTrail[stepID];
        },
        getStep: function () {
            Logger.debug("WorkflowController : getStep");

            this.model.set("step", null, {silent: true});  // Clear out the last step

            if (this.running) {
                this.model.fetch();
            }
        },
        stop: function () {
            Logger.debug("WorkflowController : stop");

            if (this.running) {
                this.running = false;
            } else {
                Logger.warn("WorkflowController:stop - stop called but workflow is not running!");
            }
            // Remove controller from WorkflowManager.
            // This will also destroy the workflow causing a DELETE to be sent
            this.trigger("workflow:stopped", this);
        },
        cancel: function (data) {
            Logger.debug("WorkflowController : cancel");

            if (this.running) {
                this.event('cancel', data, false);
            }
        },
        getView: function () {
            return this.view;
        },
        _processStatus: function (model, status) {
            Logger.debug("WorkflowController : _processStatus");
            if (status !== 0 && status !== 200) {
                Logger.info("Workflow Step Error = " + JSON.stringify(status));
                this.trigger("workflow:error", status);
            }
        },
        _processStep: function (model, step) {
            Logger.debug("WorkflowController : _processStep");

            var content = null,
                data = null,
                attributes = {},
                status;

            if (!this.running) {
                Logger.warn("WorkflowController : _processStep - Step received when workflow was not running - " + JSON.stringify(step));
                this.trigger('workflow:stopped');
                return; // Return because not really started or already done
            }

            this._processStatus(model, model.get("status"));

            if (step === null) {
                Logger.warn("WorkflowController:_processStep - Received null step, nothing to do");
                return;
            }

            if (step.template === "no_step") {
                this.model.set("step", null, {silent: true});  // Clear out the last step
                return; // Don't process a no_step
            }

            _.each(step, function (value, key) {
                if (key !== "content") {
                    attributes[key] = value;
                }
            });

            if (step.content !== null && step.content !== undefined) {
                try {
                    // Handle "'" properly
                    content = JSON.parse(step.content.replace(/[']/g, "u0027"));
                    if (content !== null) {
                        _.each(content, function (value, key) {
                            if (key !== "data") {
                                attributes[key] = value;
                            }
                        });
                    }
                } catch (ex1) {
                    Logger.error("Failed to parse step content: " + ex1);
                    this.trigger("workflow:error", i18n.get('parseBadStepContentError') + step.content);
                }
            } else {
                Logger.info("Received step without content");
                this.trigger("workflow:error", i18n.get('parseNoStepContentError'));
                return;
            }

            if (content !== null && content.data !== null && content.data !== "") {
                try {
                    // Only do JSON parse if content.data is a String
                    if (_.isString(content.data)) {
                        data = JSON.parse(content.data);
                    } else {
                        data = content.data;
                    }

                    if (data !== null) {
                        _.each(data, function (value, key) {
                            attributes[key] = value;
                        });
                    }
                } catch (ex2) {
                    Logger.error("Failed to parse step data: " + ex2);
                    this.trigger("workflow:error", i18n.get('parseBadContentError') + content.data);
                }
            } else {
                data = null;
            }
            // Kill any progress timer
            this.trigger('workflow:step:received');
            this.step.clear({silent: true});
            this.step.set(this.step.defaults, {silent: true});
            this.step.set(attributes);
            this.stepTrailNames = this.step.get('stepTrailNames');
            this._showStep(data, this.step);
        },
        _showStep: function (data, step) {
            var view,
                template = step.get('template'),
                nodeId = step.get('nodeId'),
                event = "workflow:step:" + template;
            // If we have a template id, append it to the event
            // This is used to handle specific steps without
            // effecting other flows
            if (nodeId) {
                Logger.debug("WorkflowController: _showStep - nodeId (" + nodeId + ") specified, appending to event");
                event = "workflow:step:" + template + ":" + nodeId;
            }

            Logger.debug("WorkflowController: _showStep - Triggering Model Event: " + event);

            // If this is the last step, clear out the button so
            // no button is shown
            this.lastStep = false;
            if (step.get('lastStep') === true) {
                step.set('button', '');
                this.lastStep = true;
            }

            App.vent.trigger(event, this.step, this.view, this);
            if (!step.get("handled")) {
                Logger.debug("WorkflowController: _showStep - Triggering Model Event on flow: " + event);
                this.trigger(event, step, this.view, this);
            } else {
                // See if this is the last step in the flow and
                // send next so the flow ends properly
                if (this.lastStep === true) {
                    Logger.debug("WorkflowController: _processStep - " + step.template + " has lastStep, signalling Next");
                    //Hide the stepTrail since the flow is done
                    this.view.hideStepTrail();
                    // Trigger the next step to complete the flow
                    data = {};
                    data.signalValue = "next";
                    this.signal("next", data, true, true);
                }
            }

            if (!step.get("handled")) {
                step.set("handled", true, {silent: true}); // Used to toggle state.

                switch (template) {
                case "info":
                    view = new InfoView({
                        model : step,
                        controller : this
                    });
                    this.view.showContent(view);
                    break;
                case "prompt":
                    view = new PromptView({
                        model : step,
                        controller : this
                    });
                    this.view.showContent(view);
                    break;
                case "question":
                    view = new QuestionView({
                        model : step,
                        controller : this
                    });
                    this.view.showContent(view);
                    break;
                case "selector":
                    view = new SelectorView({
                        model : step,
                        controller : this
                    });
                    this.view.showContent(view);
                    break;
                case "menu":
                    view = new MenuView({
                        model : step,
                        controller : this
                    });
                    this.view.showContent(view);
                    break;
                case "localpccheck":
                    view = new LocalPCCheckView({
                        model : step,
                        controller : this
                    });
                    this.view.showContent(view);
                    break;
                case "sscconfigureprofile":
                    view = new MobileProfileDownloadView({
                        model : step,
                        profileManager: this.profileManager,
                        controller : this
                    });
                    break;
                case "dataevent":
                    Logger.warn("WorkflowController:_showStep - Unhandled DataEvent Step");
                    this.trigger("error", "Unhandled dataEvent step - " + JSON.stringify(step));
                    break;
                case "sscdevicefunction":
                    Logger.debug("WorkflowController:_showStep - Process SSCDeviceFunction Step");
                    this._processDeviceFunctionStep(this.step);
                    break;
                case "ssccache":
                    Logger.debug("WorkflowController:_showStep - Process SSCCache Step");
                    this._processCacheStep(this.step);
                    break;
                }
            }

            switch (template) {
            case "done":
                Logger.debug("WorkflowController:_showStep - Process Done Step");
                this.view.hideStepTrail();
                this.model.set("step", null, {silent: true});  // Clear out the last step
                this.running = false;
                this.trigger("done", this);
                break;
            case "info":
                Logger.debug("WorkflowController:_showStep - Process Info Step");
                if (this.lastStep === true) {
                    Logger.debug("WorkflowController:_showStep - Info node has lastStep, signalling Next");
                    //Hide the stepTrail since the flow is done
                    this.view.hideStepTrail();
                    // Trigger the next step to complete the flow
                    data = {};
                    data.signalValue = "next";
                    this.signal("next", data, true, true);
                }
                break;
            case "wait":
                Logger.debug("WorkflowController:_showStep - Process Wait Step");
                this.view.showProgress();
                this.model.set("step", null, {silent: true});  // Clear out the last step
                break;
            case "no_step":
                Logger.debug("WorkflowController:_showStep - Process No Step");
                this.model.set("step", null, {silent: true});  // Clear out the last step
                break;
            case "error":
                Logger.warn("WorkflowController:_showStep - Received workflow error step");
                this.model.set("step", null, {silent: true});  // Clear out the last step
                this.trigger("error", 0);
                break;
            case "suspended":
                Logger.debug("WorkflowController:_showStep - Process Suspended Step");
                this.model.set("step", null, {silent: true});  // Clear out the last step
                this.trigger("suspended", this);
                break;
            }
        },
        _processError: function (error) {
            Logger.warn("Workflow error: Workflow sync failure: error = " + JSON.stringify(error));
            this.stop();
            App.vent.trigger("workflow:error", error);
        },
        _processCacheStep: function (step) {
            var data,
                lastStep = false,
                nextSignal = "failure";
            if (step.get('lastStep')) {
                lastStep = step.get('lastStep');
            }
            data = step.get("cacheData");
            if (data) {
                if (!_.isUndefined(window.App.cache)) {
                    nextSignal =  window.App.cache.cacheItems(data); //success or failure
                }
            } else {
                Logger.error("CacheLib: no flow data to cache check data format");
            }
            //go to next signal
            if (lastStep !== true) {
                this.signal(nextSignal, {});
            }
        },
        _processDeviceFunctionStep: function (step) {
            var results = {},
                self = this,
                nextSignal = "failure",
                funcName = step.get('funcName'),
                funcParams = step.get('funcParams'),
                resultName = step.get('returnName');
            // This is used to group the properties under a specific key
            // in the dictionary
            results.__formName = resultName;
            results[resultName + ".result"] = "ERROR";
            results[resultName + ".reason"] = "NA";
            if (_.isUndefined(this.deviceFunctions)) {
                Logger.error("WorkflowController: Device Functions library unavailable");
                this.signal(nextSignal, results);
                return;
            }

            if (funcParams && funcParams.length > 0) {
                try {
                    funcParams = JSON.parse(funcParams);
                } catch (err) {
                    Logger.error("WorkflowController:_processDeviceFunctionStep - Failed to parse function parameters: " + err);
                    results[resultName + ".reason"] = "Function Parameter JSON parse error";
                    this.signal(nextSignal, results);
                    return;
                }
            }

            //set timeout
            this.timer = _.delay(this._onDeviceFunctionsTimeout, 20000, results, resultName, this);

            // Call the function
            this.deviceFunctions.processFunction(funcName, function (funcResults) {
                if (!_.isNull(self.timer)) {
                    Logger.debug("WorkflowController:_processDeviceFunction clearing timeout");
                    window.clearTimeout(self.timer);
                    self.timer = null;
                }
                if (_.isEmpty(funcResults)) {
                    results[resultName + ".result"] = "ERROR";
                    results[resultName + ".reason"] = "Function Error";
                    nextSignal = "failure";
                } else {
                    nextSignal = "success";
                }
                _.each(funcResults, function (value, key) {
                    Logger.debug("func return" + key + " " + value);
                    results[resultName + "." + key] = value.toString();
                });
                self.signal(nextSignal, results);
            }, funcParams);
        },
        _onDeviceFunctionsTimeout: function (results, resultName, self) {
            Logger.error("WorkflowController : onDeviceFunctionsTimeout - Timeout reached for function");

            if (!_.isNull(self.timer)) {
                Logger.debug("WorkflowController:_processDeviceFunction clearing timeout");
                window.clearTimeout(self.timer);
                self.timer = null;
            }
            results[resultName + ".reason"] = "TIMEOUT";
            self.signal("failure", results);
        }
    });
});
