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
    'logger'
], function (Backbone, _, Logger) {
	'use strict';
	var MenuCollection = Backbone.Collection.extend({
		model: Backbone.Model.extend(),

		// Build menu collection using domains, services, and operations
		// As well as affordances for "My Info" and "My Devices" experiences
		repopulate: function (accountModel) {
		    Logger.debug("MenuCollection : repopulate");
			var self = this,
                anonymous = accountModel.get("anonymous"),
                mobileApp = !_.isUndefined(window.App.cafid),
                sortedDomains;

			sortedDomains = _.sortBy(accountModel.get('domains').models, function (domain) {
                if (_.isUndefined(domain.attributes.attributes) ||
                        _.isUndefined(domain.attributes.attributes.menuOrder) ||
                        _.isNull(domain.attributes.attributes.menuOrder)) {
                    return 99;
                }
                return parseInt(domain.attributes.attributes.menuOrder, 10);
            });

			// Add in dynamic domains
			_.each(sortedDomains, function (domain) {

				// Ignore alert domain
                if (domain.attributes.attributes.hideDomain === "yes" ||
                        (domain.attributes.attributes.mobileAppOnly === "yes" && !mobileApp)) {
                    return;
                }

                var authRequired = false,
                    connRequired = true,
                    domainMenuItem,
                    sortedServices;

                if (!_.isUndefined(domain.attributes.attributes) &&
                        domain.attributes.attributes.authenticationRequired === "yes" &&
                        anonymous) {
                    authRequired = true;
                } else {
                    authRequired = false;
                }
                if (!_.isUndefined(domain.attributes.attributes) &&
                        domain.attributes.attributes.connectivityRequired === "yes") {
                    connRequired = true;
                } else {
                    connRequired = false;
                }

                domainMenuItem = new Backbone.Model({
					name: domain.get('name'),
					hash: '#' + domain.get('name'),
                    authenticationRequired: authRequired,
                    connectivityRequired: connRequired,
					children: new Backbone.Collection(),
                    type : 'domain'
				});

                if (domain.attributes.attributes.hideServices !== "yes") {
                    sortedServices = _.sortBy(domain.get('services').models, function (service) {
                        if (_.isUndefined(service.attributes.attributes) ||
                                _.isUndefined(service.attributes.attributes.menuOrder) ||
                                _.isNull(service.attributes.attributes.menuOrder)) {
                            return 99;
                        }
                        return parseInt(service.attributes.attributes.menuOrder, 10);
                    });
                    _.each(sortedServices, function (service) {
                        if (service.attributes.attributes.mobileAppOnly === "yes" && !mobileApp) {
                            return;
                        }

                        if (!_.isUndefined(service.attributes.attributes) &&
                                service.attributes.attributes.authenticationRequired === "yes" &&
                                anonymous) {
                            authRequired = true;
                        } else {
                            authRequired = false;
                        }

                        if (!_.isUndefined(service.attributes.attributes) &&
                                service.attributes.attributes.connectivityRequired === "yes") {
                            connRequired = true;
                        } else {
                            connRequired = false;
                        }

                        var serviceMenuItem = new Backbone.Model({
                            name: service.get('name'),
                            hash: '#' + domain.get('name') + '/' + service.get('name'),
                            authenticationRequired: authRequired,
                            connectivityRequired: connRequired,
                            children: new Backbone.Collection(),
                            type : 'service'
                        }),
                            sortedOperations;

                        sortedOperations = _.sortBy(service.get('operations').models, function (operation) {
                            if (_.isUndefined(operation.attributes.attributes) ||
                                    _.isUndefined(operation.attributes.attributes.menuOrder) ||
                                    _.isNull(operation.attributes.attributes.menuOrder)) {
                                return 99;
                            }
                            return parseInt(operation.attributes.attributes.menuOrder, 10);
                        });

                        _.each(sortedOperations, function (operation) {

                            if (operation.attributes.attributes.mobileAppOnly === "yes" && !mobileApp) {
                                return;
                            }

                            if (!_.isUndefined(operation.attributes.attributes) &&
                                    operation.attributes.attributes.authenticationRequired === "yes" &&
                                    anonymous) {
                                authRequired = true;
                            } else {
                                authRequired = false;
                            }

                            if (!_.isUndefined(operation.attributes.attributes) &&
                                    operation.attributes.attributes.connectivityRequired === "yes") {
                                connRequired = true;
                            } else {
                                connRequired = false;
                            }

                            var operationMenuItem = new Backbone.Model({
                                name: operation.get('name'),
                                hash: '#' + domain.get('name') + '/' + service.get('name') + '/' + operation.get('name'),
                                authenticationRequired: authRequired,
                                connectivityRequired: connRequired,
                                children: new Backbone.Collection(),
                                type : 'operation'
                            });

                            // Add operation model to this service's menu collection
                            serviceMenuItem.get('children').add(operationMenuItem);

                        });

                        // Add service model to this domain's menu collection
                        domainMenuItem.get('children').add(serviceMenuItem);
                    });
                }
				// Add domain model to menu collection
				self.add(domainMenuItem);
			});

			this.flatten(this.models);
		},

		reset: function (models, options) {
			var self = this;
			Backbone.Collection.prototype.reset.apply(this, arguments);
			this.flatten(models);
		},

		// Take a nested array of nav item objects and flatten it,
		// setting the "parent" properties of the items in the process.
		flatten: function (models, parent) {
			var self = this;
			_.each(models, function (model) {
				if (model.get('children')) {
					self.flatten(model.get('children').models, model.get('name'));
					model.unset('children');
				}
				if (parent) {
					model.set('parent', parent);
					self.add(model);
				} else {
					model.set('parent', null);
				}
			});
		},

		// Return a deep copy of this collection
		// (if collection specified as arg, use that instead)
		clone: function (collection) {
			var self = this, newCollection = new Backbone.Collection();
			(collection || this).each(function (model) {
				newCollection.add(new Backbone.Model({
					name: model.get('name'),
					hash: model.get('hash'),
					children: model.get('children') ? self.clone(model.get('children')) : new Backbone.Collection()
				}));
			});

			return newCollection;
		}
	});
	return MenuCollection;
});