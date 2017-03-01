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
    'apps/myInfo/views/Account',
    'i18n!apps/myInfo/nls/Messages'
], function (Marionette, _, Logger, Workflow, AccountView, i18n) {
    'use strict';
    return Marionette.Controller.extend({
        initialize: function (options) {
            this.app = options.app;
            this.account = options.model.get('account');
            this.domain = options.model;
            this.domain.set("imageUrl", i18n.get("myInfoHeaderImageUrl"));

            App.vent.on("installClient", this.installClient, this);
            // App.vent.on("AppController:appLoadComplete", this.showAccountInfo, this);
            Logger.info("MyInfoController ********************* : Initialize");
        },
        showAccountInfo: function () {
            Logger.debug("MyInfoController : showAccountInfo");
            if (!_.isUndefined(this.view)) {
                this.view = null;
            }
            this.view = new AccountView({model : this.account});

            App.vent.trigger("dashboard:showView", this.view, this.domain.get("imageUrl"), i18n.get("myInfoTitle"));
        },
        installClient: function () {
            var workflowName, subscriberId, anonymous;
            Logger.debug("MyInfoController: installClient" + this.domain.attributes.attributes.FriendlyName);
            workflowName = this.domain.attributes.attributes.workflow;
            subscriberId = this.account.get("subscriberId");
            anonymous = this.account.get("anonymous");
            this.workflow = Workflow.create({
                baseURL: App.getURLRoot(),
                name: workflowName,
                subscriberId: subscriberId
            });
            this.workflow.start();
            App.vent.trigger("dashboard:showView", this.view, this.domain.get("imageUrl"), i18n.get("myInfoTitle"));
        }
    });
});
