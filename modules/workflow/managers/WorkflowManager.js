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
    'underscore',
    'logger',
    'modules/workflow/controllers/WorkflowController'
], function (_, Logger, WorkflowController) {
    'use strict';
    var WorkflowManager = {
        _arrControllers: [],
        initialize: function () {
            Logger.debug("WorkflowManager : Initialize");
        },
        getController: function (params) {
            Logger.info("WorkflowManager: getController");
            var controller = null;
            // If we are resuming a flow, start a new one regardless of
            // whether one is already running
            if (_.isUndefined(params.data) || _.isUndefined(params.data.executionId)) {
                controller = this._findController(params.name);
            }

            if (_.isNull(controller)) {
                Logger.debug("WorkflowManager - Creating an instance of workflow - " + params.name);
                controller = new WorkflowController(params);
                this._arrControllers.push(controller);
                controller.once('workflow:stopped', this._removeController, this);
                controller.once('suspended', this._removeController, this);
                controller.once('done', this._removeController, this);
            } else {
                Logger.debug("WorkflowManager - Found an instance of workflow - " + params.name);
            }
            return controller;
        },
        removeAllControllers: function () {
            Logger.info("WorkflowManager: removeAllControllers");
            var controller;
            while (this._arrControllers.length > 0) {
                controller = this._arrControllers.pop();
                if (controller && controller.model) {
                    controller.model.destroy();
                }
            }
        },
        _removeController: function (controller) {
            Logger.info("WorkflowManager: removeController");
            if (controller && controller.model) {
                var idx;
                for (idx = this._arrControllers.length - 1; idx >= 0; idx = idx - 1) {
                    if (this._arrControllers[idx].model.id === controller.model.id) {
                        Logger.debug("WorkflowManager: removing flow - " + controller.options.name);
                        this._arrControllers.splice(idx, 1);
                        // Make sure we delete the workflow
                        if (controller && controller.model) {
                            controller.model.destroy();
                        }
                    }
                }
            }
        },
        _findController: function (flowName) {
            var idx;
            for (idx = 0; idx < this._arrControllers.length; idx = idx + 1) {
                if (this._arrControllers[idx].options.name === flowName) {
                    return this._arrControllers[idx];
                }
            }
            return null;
        }
    };
    return WorkflowManager;
});
