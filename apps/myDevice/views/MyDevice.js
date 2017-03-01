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
    'i18n!apps/myDevice/nls/Messages',
    'tpl!apps/myDevice/templates/MyDeviceLayout.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.Layout.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n
            };
        },
        regions: {
            'myDeviceLayout': '#my-device-layout'
        }
    });
});
