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
    'backbone',
    'underscore',
    'basemodel',
    'models/Domain',
    'collections/Domains',
    'models/Device',
    'collections/Devices',
    'backbone.relational'
], function (Backbone, _, BaseModel, DomainModel, DomainCollection, DeviceModel, DeviceCollection) {
    'use strict';
    /**
     * Account class
     * This is the Account model class
     * @class Account
     * @extends Backbone.RelationalModel
     * @constructor
     * @return Account object
     */
    var Account = BaseModel.extend({
        name: 'account',
        url: function () {
            return App.getURLRoot() + "/account/" + this.id;
        },
        relations: [{
            type: Backbone.HasMany,
            key: 'domains',
            relatedModel: DomainModel,
            collectionType: DomainCollection,
            collectionKey: 'account',
            reverseRelation: {
                key: 'account'
            }
        }, {
            type: Backbone.HasMany,
            key: 'devices',
            relatedModel: DeviceModel,
            collectionType: DeviceCollection,
            collectionKey: 'account',
            reverseRelation: {
                key: 'account'
            }
        }],
        defaults: {
            "subscriberId": null
        },
        idAttribute: "subscriberId"
    });
    return Account;
});
