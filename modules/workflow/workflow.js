
/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'jquery',
    'backbone',
    'backbone.marionette',
    'logger',
    'modules/workflow/managers/WorkflowManager',
    'css!modules/workflow/themes/breadcrumb/BreadCrumb.css',
    'css!workflowTheme/workflow.css'
], function ($, Backbone, Marionette, Logger, WorkflowManager) {
    'use strict';
    Logger.info("Workflow : Create");
    var Module = new Marionette.Application();
    Logger.info("Workflow : Add Initializer");
    Module.addInitializer(function (options) {
    });
    Module.create = function (params) {
        if (window.App.workflowManager === undefined) {
            window.App.workflowManager = WorkflowManager;
            window.App.workflowManager.initialize();
        }
        // Get an instance of workflowController. Will return a
        // new workflowController instance if one does not exist
        // else it will return the running instance for the workflow
        return window.App.workflowManager.getController(params);
    };
    return Module;
});