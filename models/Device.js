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
    'models/Service',
    'collections/Services',
    'models/Operation',
    'collections/Operations',
    'backbone.relational'
], function (Backbone, _, BaseModel, ServiceModel, ServiceCollection, OperationModel, OperationCollection) {
    'use strict';
    var Device = BaseModel.extend({
        name: 'device',
        relations: [{
            type: Backbone.HasMany,
            key: 'operations',
            relatedModel: OperationModel,
            collectionType: OperationCollection,
            collectionKey: "operationTarget",
            reverseRelation: {
                key: 'device'
            }
        }],
        defaults: {
            "id": null,
            "name": ""
        },
        idAttribute: "id"
    });
    return Device;
});