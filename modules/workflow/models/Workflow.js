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
    'logger',
    'basemodel'
], function (Backbone, Logger, BaseModel) {
    'use strict';
    return BaseModel.extend({
        name: "workflow",
        urlRoot: function () {
            if (this.isNew()) {
                // Make sure we set the id and add it to the POST
                // URL since backbone won't unless it is in the attributes.
                // SSC-ECS doesn't accept the id in the attributes on POST
                this.id = this.cid;
                return this.baseURL + "/workflows/" + this.id;
            }
            // The id will be in the attributes if the model is not new
            // so we don't add it to the URL since backbone will do it
            return this.baseURL + "/workflows";
        },
        defaults: {
            subscriberId: "",
            name: "",
            data: "{}",
            status: 0,
            step: null,
            signal: null,
            event: null
        },
        idAttribute: "id",
        initialize: function (attributes, options) {
            // Register with events collection
            BaseModel.prototype.initialize.call(this, options);
            this.baseURL = options.baseURL;
        }
    });
});
