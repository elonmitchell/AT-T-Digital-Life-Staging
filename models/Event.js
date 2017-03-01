/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone',
    'basemodel'
], function (Backbone, BaseModel) {
    'use strict';
    var Event = BaseModel.extend({
        name: 'event',
        defaults: {
            'id': null,
            'href': null,
            'type': null
        },
        idAttribute: 'id'
    });
    return Event;
});



