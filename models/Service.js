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
    'basemodel',
    'models/Operation',
    'collections/Operations',
    'backbone.relational'
], function (Backbone, _, BaseModel, OperationModel, OperationCollection) {
    'use strict';
    var Service = BaseModel.extend({
        name: 'service',
        relations: [{
            type: Backbone.HasMany,
            key: 'operations',
            relatedModel: OperationModel,
            collectionType: OperationCollection,
            collectionKey: "operationTarget",
            reverseRelation: {
                key: 'service'
            }
        }],
        defaults: {
            "id": null,
            "name":  "",
            "displayName": ""
        },
        idAttribute: "name"
    });

    return Service;
});
