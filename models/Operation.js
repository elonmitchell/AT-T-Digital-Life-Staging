/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone',
    'underscore',
    'basemodel'
], function (Backbone, _, BaseModel) {
    'use strict';
    var Operation = BaseModel.extend({
        name: 'operation',
        defaults: {
            "name":  "",
            "type":  "",
            "status":  ""
        },
        idAttribute: "name"
    });

    return Operation;
});
