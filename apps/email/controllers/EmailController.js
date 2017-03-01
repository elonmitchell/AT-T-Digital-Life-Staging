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
    'apps/email/views/EmailSetup',
	'apps/email/views/EmailSummary',
	'apps/email/views/EmailProfiles',
    'i18n!apps/email/nls/Messages'
], function (Marionette, _, Logger, EmailSetupView, EmailSummaryView, EmailProfilesView, i18n) {
    'use strict';
    return Marionette.Controller.extend({
        initialize: function (options) {
            this.app = options.app;
            options.model.set("imageUrl", i18n.get("emailHeaderImageURL"));
            Logger.debug("EmailController: Initialize");

            App.vent.on("workflow:step:emailsetup:pcEmailSetup", this.processEmailSetupStep, this);
			App.vent.on("workflow:step:emailsummary:pcEmailTroubleshoot", this.processEmailSummaryStep, this);
			App.vent.on("workflow:step:dataevent:emailList", this._processDataEvent, this);
        },
        processEmailSetupStep: function (step, workflowView, workflowController) {
            step.set("handled", true, {silent: true});
            Logger.debug("EmailController: Process Email Setup Step");

            if (_.isUndefined(step.get("title"))) {
                step.set("title", i18n.get("invalidTitle"));
            }
            if (_.isUndefined(step.get("button"))) {
                step.set("button", i18n.get("invalidButton"));
            }
            var view = new EmailSetupView({
                model : step,
                controller : workflowController
            });
            workflowView.showContent(view);
        },
	    processEmailSummaryStep: function (step, workflowView, workflowController) {
            step.set("handled", true, {silent: true});
            Logger.debug("EmailController: Process Email Setup Step");

            if (_.isUndefined(step.get("title"))) {
                step.set("title", i18n.get("invalidTitle"));
            }
            if (_.isUndefined(step.get("button"))) {
                step.set("button", i18n.get("invalidButton"));
            }
            var view = new EmailSummaryView({
                model : step,
                controller : workflowController
            });
            workflowView.showContent(view);
        },
	    _processDataEvent: function (step, workflowView, workflowController) {
			Logger.info("EmailController: Process Data Event Step");

			var nextData,
				emailList = step.get('emailProfileList'),
				view;

			if (emailList !== undefined) {
                step.set("handled", true, {silent: true});
                Logger.info("EmailController: Process emailList Step");
                Logger.info("EmailController : emailList " + emailList);
				if (_.isUndefined(step.get("title"))) {
                    step.set("title", i18n.get("invalidTitle"));
                }
                if (_.isUndefined(step.get("button"))) {
                    step.set("button", i18n.get("invalidButton"));
                }
                view = new EmailProfilesView({
                    emailDetails: emailList,
                    controller : workflowController,
                    model : step
                });
                workflowView.showContent(view);
            }
		}
    });
});
