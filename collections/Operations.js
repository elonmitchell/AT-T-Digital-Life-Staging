/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
// Filename: collections/Operations.js
define([
	'backbone',
	'logger',
    'basecollection',
	'models/Operation'
], function (Backbone, Logger, BaseCollection, OperationModel) {
    'use strict';
    var OperationCollection = BaseCollection.extend({
		model: OperationModel,
        dataName: 'operation',
		url: function () {
            return this.operationTarget.url() + "/operations";
        }
	});
	return OperationCollection;
});
