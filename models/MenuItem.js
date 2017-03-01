/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone'
], function (Backbone) {
    'use strict';
    var MenuItem = Backbone.Model.extend({
        name: 'menuItem',
        defaults: {
            'name': null,
            'children': null,
            'hash': null,
            'model': null,
            'localize': true,
            'authenticationRequired': false
        }
    });
    return MenuItem;
});
