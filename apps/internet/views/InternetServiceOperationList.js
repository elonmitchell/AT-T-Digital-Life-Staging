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
    'i18n!apps/internet/nls/Messages',
    'apps/internet/views/InternetServiceOperation',
    'tpl!apps/internet/templates/InternetOperationList.html'
], function (Marionette, _, Logger, i18n, ServiceOperationView, Template) {
    'use strict';
    return Marionette.CompositeView.extend({
        template: Template,
        itemView: ServiceOperationView,
        templateHelpers: function () {
            return {
                i18n: i18n
            };
        },
        initialize: function () {
            Logger.log("InternetServiceOperationListView : initialize " + this.model.id);
            this.listenTo(this.model, 'change:fixall', this.showFixAll);
            this.listenTo(this.model, 'change:checked', this.showRefresh);
            this.listenTo(this.model, 'change:setOne', this.setOne);
            this.listenTo(this.model, 'change:getOne', this.getOne);
            this.collection = this.model.get("operations");
            App.vent.on("pchc:workflowDone", this.workflowDone, this);
        },
        appendHtml: function (cv, iv, index) {
            Logger.log("InternetServiceOperationListView : appendHtml " + this.model.id);

            if (iv.model.get("type") === "additional") {
                cv.$el.find("#additional-service-" + this.model.id).show();
                cv.$(".additonalOperationlist").append(iv.el);
            } else {
                cv.$(".operationlist").append(iv.el);
            }

        },
        showFixAll: function () {
            Logger.log("InternetServiceOperationListView : showFixAll " + this.model.id);
            this.$el.find("#service-" + this.model.id + "-button").show();
            this.model.unset("fixall", {silent: true});
        },
        showRefresh: function () {
            Logger.log("InternetServiceOperationListView : showRefresh " + this.model.id);
            this.$el.find("#service-" + this.model.id + "-refresh-button").show();
            this.model.unset("checked", {silent: true});
        },
        events: {
            "click .pchc-fixall-button"     : "setService",
            "click .pchc-refresh-button"    : "getService"
        },
        setService: function (e) {
            Logger.log("InternetServiceOperationListView : setService ");
            this.$el.find("#service-" + this.model.id + "-button").hide();
            this.$el.find("#service-" + this.model.id + "-refresh-button").hide();
            var data = {"operationType" : "set"},
                workflow;
            data[this.model.id] = "yes";
            this.children.each(function (v) {
                v.hideStatusItems();
                v.showUpdating();
                data[v.model.attributes.operationName] = "true";
            });
            workflow = this.model.get("domain").attributes.attributes.workflow;
            App.vent.trigger("pchc:launchCheck", workflow, data);
            App.vent.trigger("pchc:hideStatus");
        },
        getService: function (e) {
            Logger.log("InternetServiceOperationListView : getService ");
            this.$el.find("#service-" + this.model.id + "-button").hide();
            this.$el.find("#service-" + this.model.id + "-refresh-button").hide();

            this.children.each(function (v) {
                v.failFixableCount = 0;
				v.hideStatusItems();
                v.showUpdating();

            });
            var data = {"operationType" : "get"},
                workflow;
            data[this.model.id] = "yes";
            workflow = this.model.get("domain").attributes.attributes.workflow;
            App.vent.trigger("pchc:hideStatus");
            App.vent.trigger("pchc:launchCheck", workflow, data);
        },
        setOne: function (model, operationModel, options) {
            Logger.log("InternetServiceOperationListView : setOperation ");
            var data = {"operationType" : "set"},
                workflow;
            data[operationModel.get("service").id] = "yes";
            data[operationModel.attributes.operationName] = "true";

            workflow = this.model.get("domain").attributes.attributes.workflow;
            App.vent.trigger("pchc:launchCheck", workflow, data);
            this.model.unset("setOne", {silent: true});
        },
        getOne: function (model, operationModel, options) {
            Logger.log("InternetServiceOperationListView : getOperation ");
            var data = {"operationType" : "get"},
                workflow;

            data[operationModel.get("service").id] = "yes";
            data[operationModel.attributes.operationName] = "true";

            workflow = this.model.get("domain").attributes.attributes.workflow;
            App.vent.trigger("pchc:launchCheck", workflow, data);
            this.model.unset("getOne", {silent: true});
        },
        workflowDone: function () {
            Logger.log("InternetServiceOperationListView : workflowDone ");
            App.vent.off("pchc:workflowDone", this.workflowDone, this);
            this.children.each(function (v) {
                var stat_updating = v.$el.find("#status-updating-" + v.model.id);
                if (stat_updating.is(":visible")) {
                    stat_updating.hide();
                    v.$el.find("#status-unknown-" + v.model.id).show();
                }
                stat_updating = v.$el.find("#status-add-updating-" + v.model.id);
                if (stat_updating.is(":visible")) {
                    stat_updating.hide();
                }
            });
        }
    });
});