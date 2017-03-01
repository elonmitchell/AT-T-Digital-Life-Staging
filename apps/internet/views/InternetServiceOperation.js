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
    'i18n!apps/internet/nls/Messages',
    'tpl!apps/internet/templates/InternetOperation.html',
    'tpl!apps/internet/templates/InternetAdditionalOperation.html'
], function (Marionette, _, Logger, Env, i18n, Template, AddTemplate) {
    'use strict';
    return Marionette.ItemView.extend({
        tagName: "li",
        templateHelpers: function () {
            return {
                i18n: i18n,
                domain: this.model.get("service").get("domain")
            };
        },
        getTemplate: function () {
            var template;

            if (this.model.get("type") === "additional") {
                template = AddTemplate;
            } else {
                template = Template;
            }

            return template;
        },
        initialize: function () {
            Logger.log("InternetServiceOperationView : initialize " + this.model.id);
            this.listenTo(this.model, 'change:result', this.resultChanged);
            this.failFixableCount = 0;
        },
        resultChanged: function (model, value, options) {
            Logger.log("InternetServiceOperationView : resultChanged " + value);
            this.$el.find("#status-updating-" + this.model.id).hide();
            this.$el.find("#operation-curvalue-updating-" + this.model.id).hide();
            this.$el.find("#operation-recvalue-updating-" + this.model.id).hide();

            this.model.get("service").set("checked", true);
            switch (value) {
            case "VALID":
				if (!_.isNull(this.model.get('currentValueText'))) {
					this.$("#operation-curvalue-result-" + this.model.id).text(this.model.get('currentValueText'));
				}
				if (!_.isNull(this.model.get('recommendedValueText'))) {
					this.$("#operation-recvalue-result-" + this.model.id).text(this.model.get('recommendedValueText'));
				}
				this.$el.find("#operation-curvalue-result-" + this.model.id).show();
				this.$el.find("#operation-recvalue-result-" + this.model.id).show();
				this.$el.find("#status-ok-" + this.model.id).show();
                break;
            case "INVALID_FIXABLE":
                if (!_.isNull(this.model.get('currentValueText'))) {
					this.$("#operation-curvalue-result-" + this.model.id).text(this.model.get('currentValueText'));
				}
				if (!_.isNull(this.model.get('recommendedValueText'))) {
					this.$("#operation-recvalue-result-" + this.model.id).text(this.model.get('recommendedValueText'));
				}
				this.$el.find("#operation-curvalue-result-" + this.model.id).show();
				this.$el.find("#operation-recvalue-result-" + this.model.id).show();
				this.$el.find("#status-fail-" + this.model.id).show();

                var is_chrome = (Env.getBrowserName() === 'Google Chrome');

                // This is to check Google Chrome is not supported for history and checkcache
                // when the chrome browser is open. If you want to expand exceptions for any
                // other browser operation you can add it here. The FIX option is not supported currently for
                // history and checkcache operation.
                if ((is_chrome === true) && (this.model.id === "history")) {
                    this.$el.find("#status-fail-" + this.model.id).hide();
                    this.$el.find("#operation-fix-gc-history-button").show();
                    this.$el.find("#status-unknown-" + this.model.id).show();
					this.$el.find("#operation-retry-" + this.model.id + "-button").hide();
					this.$el.find("#operation-curvalue-result-" + this.model.id).show();
					this.$el.find("#operation-recvalue-result-" + this.model.id).show();
                } else if ((is_chrome === true) && (this.model.id === "checkcache")) {
                    this.$el.find("#status-fail-" + this.model.id).hide();
                    this.$el.find("#operation-fix-gc-checkcache-button").show();
                    this.$el.find("#status-unknown-" + this.model.id).show();
					this.$el.find("#operation-retry-" + this.model.id + "-button").hide();
					this.$el.find("#operation-curvalue-result-" + this.model.id).show();
					this.$el.find("#operation-recvalue-result-" + this.model.id).show();
                } else if ((is_chrome === true) && (this.model.id === "browsersecurity")) {
                    this.$el.find("#operation-fix-gc-browsersecurity-button").show();
					this.$el.find("#operation-retry-" + this.model.id + "-button").hide();
					this.$el.find("#operation-curvalue-result-" + this.model.id).show();
					this.$el.find("#operation-recvalue-result-" + this.model.id).show();
                } else {
                    this.$el.find("#operation-fix-" + this.model.id + "-button").show();
                    this.model.get("service").set("fixall", true);
                    this.failFixableCount = this.failFixableCount + 1;
                }
                break;
            case "INVALID_NOTFIXABLE":
            case "INVALID_UNFIXABLE":
                if (!_.isNull(this.model.get('currentValueText'))) {
					this.$("#operation-curvalue-result-" + this.model.id).text(this.model.get('currentValueText'));
				}
				if (!_.isNull(this.model.get('recommendedValueText'))) {
					this.$("#operation-recvalue-result-" + this.model.id).text(this.model.get('recommendedValueText'));
				}
				this.$el.find("#operation-curvalue-result-" + this.model.id).show();
				this.$el.find("#operation-recvalue-result-" + this.model.id).show();
				this.$el.find("#status-fail-" + this.model.id).show();
                break;
            default:
                if (!_.isNull(this.model.get('currentValueText'))) {
					this.$("#operation-curvalue-result-" + this.model.id).text(this.model.get('currentValueText'));
				}
				if (!_.isNull(this.model.get('recommendedValueText'))) {
					this.$("#operation-recvalue-result-" + this.model.id).text(this.model.get('recommendedValueText'));
				}
				this.$el.find("#operation-curvalue-result-" + this.model.id).show();
				this.$el.find("#operation-recvalue-result-" + this.model.id).show();
				this.$el.find("#operation-retry-" + this.model.id + "-button").show();
				this.$el.find("#status-unknown-" + this.model.id).show();
                break;
            }

            this.model.unset("result", {silent: true});

        },
        events: {
            "click .pchc-fix-button"    : "setOperation",
            "click .pchc-retry-button"  : "getOperation",
            "click .pchc-addfix-button" : "setAddOperation",
            "click img"                 : "onStatusClick"
        },
        setOperation: function (e) {
            this.hideStatusItems();
            this.showUpdating();
            this.model.get("service").set("setOne", this.model);
        },
        setAddOperation: function (e) {
            this.$el.find("#operation-" + this.model.id + "-button").hide();
			this.$el.find("#operation-" + this.model.id + "-status").show();
			this.model.get("service").set("setOne", this.model);
			this.$el.find("#operation-" + this.model.id + "-button").show();
		},
        getOperation: function (e) {
            this.hideStatusItems();
            this.showUpdating();
            this.model.get("service").set("getOne", this.model);
        },
        hideStatusItems: function () {
            this.$el.find("#status-unknown-" + this.model.id).hide();
            this.$el.find("#status-updating-" + this.model.id).hide();
            this.$el.find("#status-fail-" + this.model.id).hide();
            this.$el.find("#operation-fix-" + this.model.id + "-button").hide();
			this.$el.find("#operation-retry-" + this.model.id + "-button").hide();
            this.$el.find("#status-ok-" + this.model.id).hide();
			this.$el.find("#operation-curvalue-result-" + this.model.id).hide();
            this.$el.find("#operation-recvalue-result-" + this.model.id).hide();
		},
        showUpdating: function () {
			this.$el.find("#status-updating-" + this.model.id).show();
            this.$el.find("#operation-curvalue-updating-" + this.model.id).show();
            this.$el.find("#operation-recvalue-updating-" + this.model.id).show();
        },
        onStatusClick: function (event) {
            Logger.debug("InternetServiceOperation : onStatusClick - Status icon (" + event.target.id + ") clicked");
            var idx = event.target.id.lastIndexOf('-');
            if (event.target.id.indexOf('status-updating') === -1) {
                App.vent.trigger("pchc:statusClick", event.target.id.substr(idx + 1));
            }
            event.stopPropagation();
        }
    });
});