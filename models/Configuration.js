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
    'text!data/Configuration.json'
], function (Backbone, _, ConfigurationData) {
    'use strict';
    /**
     * Configuration class
     * This is the Configuration model class
     * @class Account
     * @extends Backbone.Model
     * @constructor
     * @return Configuration object
     */
    var Configuration = Backbone.Model.extend({
        defaults: JSON.parse(ConfigurationData)
    });
    return Configuration;
});