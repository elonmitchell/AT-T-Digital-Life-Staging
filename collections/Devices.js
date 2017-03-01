/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
// Filename: collections/Devices.js
define([
	'backbone',
	'logger',
    'basecollection',
	'models/Device'
], function (Backbone, Logger, BaseCollection, DeviceModel) {
    'use strict';
    var DeviceCollection = BaseCollection.extend({
		model: DeviceModel,
        dataName: 'device',
		url: function () {
            return this.account.url() + "/devices";
        }
	});
	return DeviceCollection;
});
