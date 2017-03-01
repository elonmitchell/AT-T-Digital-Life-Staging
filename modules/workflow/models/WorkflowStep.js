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
    'backbone'
], function (Backbone) {
    'use strict';
    return Backbone.Model.extend({
        defaults: {
            name : "",
            displayName : "",
            signal : "next",
            header : "",
            body : "",
            footer : "",
            button : "",
            isCancelButtonHidden : true,
            isSuspendButtonHidden : true,
            handled : false
        },
        workflow: null
    });
});
