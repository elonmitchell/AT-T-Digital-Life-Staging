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
    'tpl!apps/internet/templates/PCHCLayout.html'
], function (Marionette, _, Template) {
    'use strict';
    return Marionette.Layout.extend({
        template: Template,
		templateHelpers: function () {
            var self = this;
		},
        regions: {
            'domainDetail': '#domain-detail',
            'serviceList':  '#service-list',
            'workflowDiv':  '#workflow-div',
            'statusDetail': '#statusDetail'
        },
        installClient: false,
        showWorkflow: function () {
            this.installClient = true;
            this.$el.find("#service-list").hide();
            this.$el.find("#workflow-div").show();
        },
        hideWorkflow: function () {
            this.installClient = false;
            this.$el.find("#workflow-div").hide();
            this.$el.find("#service-list").show();
        }
    });
});