/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'modules/workflow/regions/AnimatedRegion',
    'modules/workflow/views/WorkflowStepTrail',
    'modules/workflow/views/WorkflowHeader',
    'modules/workflow/views/WorkflowProgress',
    'modules/workflow/views/WorkflowFooter',
    'tpl!modules/workflow/templates/Workflow.html'
], function (Marionette, _, Logger, AnimatedRegion, StepTrailView, HeaderView, ProgressView, FooterView, Template) {
    'use strict';
    return Marionette.Layout.extend({
        _content: null,
        template: Template,
        regions: {
            steptrail: "#workflow-steptrail",
            header:  AnimatedRegion.extend({ el: "#workflow-header" }),
            content: AnimatedRegion.extend({ el: "#workflow-content" }),
            footer:  AnimatedRegion.extend({ el: "#workflow-footer" })
        },
        events: {
            "click #advanced"      : "onAdvanced"
        },
        initialize: function (options) {
            Logger.debug("WorkflowView : initialize");

            this.controller = options.controller;
            if (options.breadCrumbCfg && options.breadCrumbCfg.enable === true) {
                this.stepTrailView = new StepTrailView({model: this.model,
                    controller: this.controller,
                    breadCrumbCfg: options.breadCrumbCfg});
            }
            this.headerView = new HeaderView({model: this.model, controller: this.controller});
            this.progressView = new ProgressView({model: this.model, controller: this.controller});
            this.footerView = new FooterView({model: this.model, controller: this.controller});
        },
        onRender: function () {
            Logger.debug("WorkflowView : onRender");
            if (!_.isUndefined(this.stepTrailView)) {
                this.steptrail.show(this.stepTrailView);
            }
            this.header.show(this.headerView);
            this.content.show(this.progressView);
            this.footer.show(this.footerView);
        },
        onClose: function () {
            Logger.debug("WorkflowView : onClose");
            // Suspend event polling
            if (this.controller.running === true) {
                window.App.vent.trigger('events:suspendPolling');
            }
        },
        showProgress: function () {
            Logger.debug("WorkflowView : showProgress");
            var prevView = this.progressView;
            this.progressView = new ProgressView({model: this.model, controller: this.controller});
            // clean up the old progress view
            prevView = null;
            //this.progressView.delegateEvents();
            this.content.show(this.progressView);
        },
        showContent: function (view) {
            Logger.debug("WorkflowView : showContent");
            this.headerView.animate = true;
            this.footerView.animate = true;
            this.header.show(this.headerView);
            view.animate = true;
            this.content.show(view);
            this.footer.show(this.footerView);
        },
        onAdvanced: function (e) {
            e.stopPropagation();
            e.preventDefault();

            // Toggle Advance Checkbox On/Off using classes
            this.$('#advanced').toggleClass('checked');

            // Show/Hide Advanced Settings
            this.$("#advanced-settings").toggle();
        },
        hideStepTrail: function () {
            if (!_.isUndefined(this.stepTrailView)) {
                this.steptrail.reset();
            }
        }
    });
});
