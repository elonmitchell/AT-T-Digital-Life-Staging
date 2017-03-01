/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone',
    'backbone.marionette',
    'logger'
], function (Backbone, Marionette, Logger) {
    'use strict';
    return Marionette.AppRouter.extend({
        appRoutes: {
            "myDevice": "showDeviceInfo"
        },
        initialize: function () {
            Logger.debug("MyDeviceRouter : initialize");
        }
    });
});
