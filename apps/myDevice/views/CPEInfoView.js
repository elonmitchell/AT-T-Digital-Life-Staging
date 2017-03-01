/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App, $*/
define([
    'backbone.marionette',
    'logger',
    'i18n!apps/myDevice/nls/Messages',
    'tpl!apps/myDevice/templates/CPEInfoView.html'
], function (Marionette, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n
            };
        },
        showDeviceDetail: function (modem) {
            this.$('.device-detail.' + modem.make + '.' + modem.model).show();
        },
        showDeviceNotFound: function () {
            this.$('.device-detail.notfound').show();
        }
    });
});
