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
    'backbone.relational'
], function (Backbone, _, BaseModel, ServiceModel, ServiceCollection) {
    'use strict';
    var Domain = BaseModel.extend({
        name: 'domain',
        relations: [{
            type: Backbone.HasMany,
            key: 'services',
            relatedModel: ServiceModel,
            collectionType: ServiceCollection,
            collectionKey: "serviceTarget",
            reverseRelation: {
                key: 'domain'
            }
        }],
        defaults: {
            "name":  "",
            "displayName": "",
            "account" : null,
            "type" : ""
        },
        idAttribute: "name"
    });

    return Domain;
});