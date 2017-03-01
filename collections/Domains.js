/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
// Filename: collections/Domains.js
define([
	'backbone',
	'logger',
    'basecollection',
	'models/Domain'
], function (Backbone, Logger, BaseCollection, DomainModel) {
    'use strict';
    var DomainCollection = BaseCollection.extend({
        model: DomainModel,
        dataName: 'domain',
        url: function () {
            return this.account.url() + "/domains";
        }
	});
	return DomainCollection;
});
