/**
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App
 */
define([
    'backbone.relational',
    'underscore'
], function (Backbone, _) {
    'use strict';
    /**
     * Base class
     * This is the base model class to support Base data
     * @class Base
     * @extends Backbone.RelationalModel
     * @constructor
     * @return Base object
     */
    var Base = Backbone.RelationalModel.extend({
        foundData: false,
        parsedData: null,
        name: 'base',
        defaults: {
            "id": null
        },
        idAttribute: "id",
        initialize: function () {
            if (this.name !== 'event') {
                // Register for event notifications
                App.vent.trigger('resourceCreate', this);
            }
        },
        findObjectByName: function (obj, objName) {
            var name;
            if (_.isObject(obj)) {
                if (_.has(obj, 'restTL')) {
                    this.parsedData = obj;
                    this.foundData = true;
                } else if (_.has(obj, objName)) {
                    // Found our keys, add them to the response
                    if (_.isObject(obj[objName]) || _.isArray(obj[objName])) {
                        this.parsedData = obj[objName];
                        this.foundData = true;
                    } else {
                        this.parsedData = obj;
                        this.foundData = true;
                    }
                } else {
                    for (name in obj) {
                        if (obj.hasOwnProperty(name) && _.isObject(obj[name]) && _.isEmpty(this.parsedData)) {
                            this.findObjectByName(obj[name], objName);
                            if (this.foundData) {
                                break;
                            }
                        }
                    }
                }
            }
        },
        parse: function (resp, options) {
            this.parsedData = "";
            this.foundData = false;

            // Find the collection in the response
            this.findObjectByName(resp, this.name);

            return this.parsedData;
        },
        sync: function (method, model, options) {
            // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
            var methodMap = {
                'create': 'POST',
                'update': 'PUT',
                'patch':  'PATCH',
                'delete': 'DELETE',
                'read':   'GET'
            }, type, params, beforeSend, success, error, xhr, urlError, keys,
                attrs = {}, resource = {}, resourceName = model.name,
                rquery = /\?/;

            urlError = function () {
                throw new Error('A "url" property or function must be specified');
            };

            type = methodMap[method];

            // Default options, unless specified.
            if (_.isUndefined(options)) {
                options = {};
            }
            _.defaults(options, {
                emulateHTTP: Backbone.emulateHTTP,
                emulateJSON: Backbone.emulateJSON
            });

            // Default JSON-request options.
            if (App.configuration.get('noCredentials') === "true") {
                // This is needed to support Authentication with ECS
                params = {
                    type: type,
                    dataType: 'json'
                };
            } else {
                params = {
                    type: type,
                    dataType: 'json',
                    xhrFields: {
                        withCredentials: true
                    }
                };
            }

            // Ensure that we have a URL.
            if (!options.url) {
                params.url = _.result(model, 'url') || urlError();
            }

            // Add soaTraceId as query param to all requests
            // Do not pass headers as this causes OPTIONS call per CORS
            params.url += (rquery.test(params.url) ? "&" : "?") + 'soaTraceId=' + window.App.sessionGUID;

            // Ensure that we have the appropriate request data.
            if ((_.isNull(options.data) || _.isUndefined(options.data)) && model && (method === 'create' || method === 'update' || method === 'patch')) {
                if (!_.isNull(resourceName) && !_.isUndefined(resourceName)) {
                    // Get all the model attribute keys so we can add them to the
                    // request properly
                    keys = _.keys(model.attributes);
                    _.each(keys, function (prop) {
                        if (prop === 'attributes') {
                            resource[prop] = model.attributes[prop];
                        } else if (prop === 'account' && resourceName !== 'account') {
                            resource[prop] = model.attributes[prop].id;
                        } else if (!_.isObject(model.attributes[prop]) && !_.isUndefined(model.attributes[prop])) {
                            resource[prop] = model.attributes[prop];
                        } else if (_.isObject(model.attributes[prop]) && resourceName === 'workflow') {
                            resource[prop] = model.attributes[prop];
                        }
                    });
                    // If an id is not set, set the id value to the idAttribute
                    if (!_.has(resource, 'id')) {
                        resource['id'] = resource[model.idAttribute];
                    }
                    attrs[resourceName] = {};
                    _.extend(attrs[resourceName], resource);
                    params.data = JSON.stringify(attrs);
                } else {
                    params.data = JSON.stringify(options.attrs || model.toJSON(options));
                }
                params.contentType = 'application/json';
            }

            // For older servers, emulate JSON by encoding the request into an HTML-form.
            if (options.emulateJSON) {
                params.contentType = 'application/x-www-form-urlencoded';
                params.data = params.data ? {model: params.data} : {};
            }

            // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
            // And an `X-HTTP-Method-Override` header.
            if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
                params.type = 'POST';
                if (options.emulateJSON) {
                    params.data._method = type;
                }
                beforeSend = options.beforeSend;
                options.beforeSend = function (xhr) {
                    xhr.setRequestHeader('X-HTTP-Method-Override', type);
                    if (beforeSend) {
                        return beforeSend.apply(this, arguments);
                    }
                };
            }

            // Don't process data on a non-GET request.
            if (params.type !== 'GET' && !options.emulateJSON) {
                params.processData = false;
            }

            // Make the request, allowing the user to override any Ajax options.
            xhr = options.xhr = Backbone.ajax(_.extend(params, options));
            model.trigger('request', model, xhr, options);
            return xhr;
        }
    });
    return Base;
});
