/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
	'backbone',
	'logger',
    'basecollection',
	'models/Service'
], function (Backbone, Logger, BaseCollection, ServiceModel) {
    'use strict';
	var ServiceCollection = BaseCollection.extend({
		model: ServiceModel,
        dataName: 'service',
		url: function () {
            return this.serviceTarget.url() + "/services";
        }
	});
	return ServiceCollection;
});
