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
    'jqueryui',
    'underscore',
    'logger',
    'i18n!apps/internet/nls/Messages',
    'tpl!apps/internet/templates/StatusDetail.html'
], function (Marionette, $, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        tagName: "li",
        template: Template,
        templateHelpers: function () {
            return {
                i18n: i18n,
                getStatusDetailHeadline: function () {
                    if (_.isUndefined(this.model)) {
                        return "";
                    }
                    return this.model.id;
                },
                getStatusDetail: function () {
                    if (_.isUndefined(this.model)) {
                        return "";
                    }
                    return "Status detail...";
                }
            };
        },
        initialize: function () {
            Logger.log("StatusDetail : initialize");
            this.statusDialogOpen = false;
            App.vent.on("pchc:hideStatus", this._hideStatusDetail, this);
        },
        showStatusDetail: function (operation) {
            var self = this;
            this.model = operation;
            // Set the dialog headline and status text
            window.$("#statusHeadline").text(this.model.id);
            if (!_.isNull(this.model.get('statusText'))) {
                window.$("#statusText").text(this.model.get('statusText'));
            } else {
                window.$("#statusText").text("No Status Details for " + this.model.id);
            }

            if (_.isUndefined(this.statusDialog) || this.statusDialogOpen === false) {
                this.statusDialogOpen = true;
                window.$("#dialog-status-detail").dialog({
                    resizable: false,
                    draggable: false,
                    width: '600px',
                    height: 'auto',
                    position: [400, 300],
                    show: function () {
                        window.$("#dialog-status-detail").fadeIn(5000);
                    },
                    hide: function () {
                        window.$("#dialog-status-detail").fadeOut(4000);
                    },
                    open: function (event, ui) {
                        window.$("#dialog-status-detail").parent().children().children(".ui-dialog-titlebar-close").show();
                        window.$("#dialog-status-detail").parent().children().addClass("ui-dialog-titlebar-plain");
                    },
                    close: function () {
                        window.$("#dialog-status-detail").dialog("destroy");
                        self.statusDialogOpen = false;
                    }
                });
            }
        },
        _hideStatusDetail: function () {
            if (this.statusDialogOpen === true) {
                window.$("#dialog-status-detail").dialog("destroy");
                this.statusDialogOpen = false;
            }
        },
        onClose: function () {
            if (this.statusDialogOpen === true) {
                window.$("#dialog-status-detail").dialog("destroy");
                this.statusDialogOpen = false;
            }
        }
    });
});
