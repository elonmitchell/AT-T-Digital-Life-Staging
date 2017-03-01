/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App,jQuery
 */
define([
    'backbone.marionette',
    'underscore',
    'jquerybreadcrumb',
    'logger',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowStepTrail.html'
], function (Marionette, _, $, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getBreadCrumbs: function () {
                    return self.model.get('breadcrumbs');
                },
                showReverse: function () {
                    return self.reverseBreadCrumbs;
                },
                getStepTrailName: function (stepID, stepName) {
                    return self.controller.getCustomStepName(stepID) || stepName;
                }
            };
        },
        modelEvents: {
            "change": "render"
        },
        initialize: function (options) {
            Logger.debug("WorkflowStepTrail : Initialize");
            var self = this;
            this.controller = options.controller;

            // Create the breadcrumb control
            this.bcOptions = {};
            this.bcOptions.minimumCompressionElements = 5;
            this.bcOptions.beginingElementsToLeaveOpen = 0;
            this.bcOptions.previewWidth = 45;
            if (options.breadCrumbCfg && options.breadCrumbCfg.maxCrumbs) {
                this.bcOptions.maxElementShow = options.breadCrumbCfg.maxCrumbs;
            }
            this.bcOptions.useCompression = false;
            if (options.breadCrumbCfg && options.breadCrumbCfg.compress) {
                this.bcOptions.useCompression = options.breadCrumbCfg.compress;
            }
            this.reverseBreadCrumbs = false;
            if (options.breadCrumbCfg && options.breadCrumbCfg.reverse) {
                this.reverseBreadCrumbs = options.breadCrumbCfg.reverse;
                this.bcOptions.reverseBreadCrumbs = options.breadCrumbCfg.reverse;
            }

            this.$el.on('click', '.crumb', _.bind(this._goToStep, this));

            this.$el.on('load_resize', 'window', _.bind(function () {
                var self = this;
                self.getBreadCrumbControl().find("div:first").css("width", "100%");
            }, this));
        },
        onRender: function () {
            Logger.debug("WorkflowStepTrail : onRender");
            var self = this,
                breadcrumbControl,
                breadcrumbs = this.model.get('breadcrumbs');

            if (this.model.get('template') !== 'wait') {
                if (!_.isUndefined(breadcrumbs)) {
                    breadcrumbControl = this.getBreadCrumbControl().jBreadCrumb(this.bcOptions);
                }
            }
        },
        _goToStep: function (evt) {
            var data = {};
            if (evt.target.id === this.model.id) {
                // Same step as current step. nothing to do
                return;
            }

            data.targetStepID = evt.target.id;
            data.signalValue = "goToStep";

            Logger.info("WorkflowStepTrail : _goToStep - Going to step : " + evt.target.id);
            this.controller.signal("goToStep", data);
        },
        getBreadCrumbControl: function () {
            return jQuery("#breadCrumb");
        }
    });
});
