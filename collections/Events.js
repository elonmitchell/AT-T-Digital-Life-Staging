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
    'logger',
    'basecollection',
    'models/Event'
], function (Backbone, _, Logger, BaseCollection, EventModel) {
    'use strict';
    var EventCollection = BaseCollection.extend({
        model: EventModel,
        dataName: 'event',
        _idAttr: 'eventCollection',
        _active: false,
        _numWorkflowsRunnning: 0,
        _sessionId: '',
        _resourceMap: {},
        _request: null,
        _timer: null,
        _timerInterval: 1000,
        _requestRetryInterval: 5000,
        _eventRequestTimeout: 35000,
        _urlRoot: "",
        _accountFetchesInProgress: 0,
        _completeReceived: false,
        _fetchInProgess: false,
        _throttlingEnabled: true,    //If true, then the polling loop will begin adding additional time to the _timerInterval between poll requests in order to reduce the request load on the server under the assumption that the expectation that there is an event on the server diminishes as the time increases from the last event
        _maxThrottle: 60000,    //The maximum number of milliseconds to throttle
        _throttleSteps: 10,    //The number of steps to take when throttling to get to the _maxThrottle.  The amount added to _currentThrottle per throttle poll is equivalent to _maxThrottle / _throttleSteps
        _numberOfAttemptsBeforeThrottling: 5,    //The number of consecutive responses from the server without data before we start throttling

        _currentAttemptCount: 0,    //Value which tracks the number of consecutive polls that resulted in no data from the server
        _currentThrottle: 0,    //Whatever the current latency that is added to the _timerInterval

        url: function () {
            return App.getURLRoot() + "/events?id=" + this._sessionId;
        },
        initialize: function () {
            _.bindAll(this, "start", "stop", "registerResource", "unregisterResource", "_fetchEvents", "_processEvents", "resetInitVariables");

            // Get any configuration overrides
            var cfgData = App.configuration.get("throttlingEnabled");
            if (!_.isUndefined(cfgData)) {
                this._throttlingEnabled = cfgData === "true" ? true : false;
            }
            cfgData = App.configuration.get("maxThrottle");
            if (!_.isUndefined(cfgData)) {
                this._maxThrottle = parseInt(cfgData, 10);
            }
            cfgData = App.configuration.get("throttleSteps");
            if (!_.isUndefined(cfgData)) {
                this._throttleSteps = parseInt(cfgData, 10);
            }
            cfgData = App.configuration.get("numberOfNoDataAttemptsBeforeThrottling");
            if (!_.isUndefined(cfgData)) {
                this._numberOfAttemptsBeforeThrottling = parseInt(cfgData, 10);
            }
            cfgData = App.configuration.get("requestRetryInterval");
            if (!_.isUndefined(cfgData)) {
                this._requestRetryInterval = parseInt(cfgData, 10);
            }
            cfgData = App.configuration.get("eventRequestTimeout");
            if (!_.isUndefined(cfgData)) {
                this._eventRequestTimeout = parseInt(cfgData, 10);
            }

            this._urlRoot = App.getURLRoot();
            App.vent.on('resourceCreate', this.registerResource, this);
        },
        resetInitVariables: function () {
            this._completeReceived = false;
            this._accountFetchesInProgress = 0;
        },
        start : function (sessionId) {
            Logger.debug("EventCollection : Starting event fetching");
            this._sessionId = sessionId;
            this._active = true;
            this._numWorkflowsRunnning = 1; // Account for the initialization flow
            this.resetInitVariables();
            App.vent.on('events:startPolling', function () {
                // We started a workflow, make
                // sure we are polling for responses
                Logger.debug("Events: Received events:startPolling, resume polling");
                this.resumeEventPolling();
            }, this);
            App.vent.on('events:resumePolling', function () {
                // We did a PUT on a workflow, make
                // sure we are polling for responses
                Logger.debug("Events: Received events:resumePolling, resume polling");
                this.resume();
            }, this);
            App.vent.on('events:suspendPolling', function () {
                // We have stopped a workflow, need to suspend events
                Logger.debug("Events: Received events:suspendPolling, suspend polling");
                this.markEventPollingToStop();
            }, this);
            this._timer = window.setTimeout(this._fetchEvents, this._timerInterval);
        },
        stop : function () {
            Logger.debug("EventCollection : Stopping event fetching");

            this._abort();

            this._currentThrottle = 0;
            this._currentAttemptCount = 0;
            this._numWorkflowsRunnning = 0;

            // Clean out the EventCollection
            this.reset();

            // Clean up the resourceMap
            _.each(this._resourceMap, function (resource, cid, resourceMap) {
                delete resourceMap[resource];
            });
            this._resourceMap = {};
        },
        suspend : function () {
            Logger.debug("EventCollection : Suspending event fetching");
            this._abort();
        },
        resetThrottling: function () {
            if (this._throttlingEnabled) {
                var currentThrottle = this._currentThrottle;
                this._currentThrottle = 0;
                this._currentAttemptCount = 0;
                if (this._timer && currentThrottle > 0) {
                    //Kill the timer and force a fetch
                    window.clearTimeout(this._timer);
                    this._timer = null;
                }
                this._fetchEvents();
            }
        },
        _getTimerInterval: function (self, resp, requestError) {
            var timeoutInterval = self._timerInterval;
            if (self._throttlingEnabled) {
                if (!_.isNull(resp) && !_.isUndefined(resp)) {    // Events came back from the server
                    if (self._throttlingEnabled) {
                        self.resetThrottling();
                    }
                } else {
                    self._currentAttemptCount += 1;
                    if (self._currentAttemptCount >= self._numberOfAttemptsBeforeThrottling) {
                        if (self._currentThrottle < self._maxThrottle) {
                            self._currentThrottle += self._maxThrottle / self._throttleSteps;
                        }

                        Logger.debug("EventCollection : Throttling of " + self._currentThrottle + " enabled");
                        timeoutInterval += self._currentThrottle;
                    } else if (requestError) {
                        // Add some delay since this was a request error
                        timeoutInterval = self._requestRetryInterval;
                    }
                }
            }
            return timeoutInterval;
        },
        resume : function () {
            Logger.debug("EventCollection : Resuming event fetching");
            if (this._active === false) {
                this._active = true;
                this._timer = window.setTimeout(this._fetchEvents, this._timerInterval);
            } else {
                this.resetThrottling();
            }
        },
        _abort : function () {
            this._active = false;

            if (this._timer) {
                //Kill the timer
                window.clearTimeout(this._timer);
                this._timer = null;
            }
            if (this._request !== null) {
                this._request.abort();
                this._request = null;
            }
        },
        resumeEventPolling : function () {
            Logger.debug("Workflow has been launched. Resuming Workflow processing.");
            this._numWorkflowsRunnning += 1;
            Logger.debug(this._numWorkflowsRunnning + " workflows are running");
            this.resume();
        },
        markEventPollingToStop : function () {
            Logger.debug("Workflow has finished. Marking events to pause when event collection is complete.");
            if (this._numWorkflowsRunnning > 0) {
                this._numWorkflowsRunnning -= 1;
            }

            Logger.debug("markEventPollingToStop called and now " + this._numWorkflowsRunnning + " workflows are running");
        },
        pauseEventPolling : function () {
            Logger.debug("Pausing event collection due to workflow completion.");
            Logger.debug(this._numWorkflowsRunnning + " workflows are running");
            if (this._numWorkflowsRunnning === 0) {
                this.suspend();
            }
        },
        registerResource : function (resource) {
            if (resource.cid) {
                this._resourceMap[resource.cid] = resource;
            }
            // register for removal events
            resource.on('destroy remove', this.unregisterResource);
        },
        unregisterResource : function (model, collection, options) {
            if (model && _.has(this._resourceMap, model.cid)) {
                Logger.debug("EventCollection : Removing resource model Type - " + model.cid);
                delete this._resourceMap[model.cid];
            } else if (collection && _.has(this._resourceMap, collection.cid)) {
                Logger.debug("EventCollection : Removing resource collection Type - " + collection.cid);
                delete this._resourceMap[collection.cid];
            }
        },
        _fetchEvents : function () {
            if (this._active && !this._fetchInProgess) {
                Logger.debug("EventCollection : Fetching events...");
                this._timer = null;

                var self = this, obj;
                this._fetchInProgess = true;
                this._request = self.fetch({
                    timeout: self._eventRequestTimeout,
                    global: false,
                    cache: false,
                    success: function (model, resp, options) {
                        self._fetchInProgess = false;
                        self._request = null;
                        self._processEvents(model.models);
                        self.reset();

                        var timeoutInterval = self._getTimerInterval(self, resp, false);

                        if (self._numWorkflowsRunnning === 0 && (_.isNull(resp) || _.isUndefined(resp))) {
                            self.suspend();
                        }

                        if (self._active) {
                            self._timer = window.setTimeout(self._fetchEvents, timeoutInterval);
                        }
                    },
                    error: function (model, xhr, options) {
                        self._fetchInProgess = false;
                        self._request = null;
                        Logger.error("EventCollection : Error fetching events - Status code (" + xhr.status + ") " + xhr.responseText);
                        if (xhr.status === 401) {
                            App.vent.trigger("events:authError");
                            self.suspend();
                        } else {
                            var timeoutInterval = self._getTimerInterval(self, null, true);
                            if (self._active) {
                                self._timer = window.setTimeout(self._fetchEvents, timeoutInterval);
                            }
                        }
                    }
                });
            }
        },
        _processEvents : function (models) {
            // Loop through the models/model and find the resource
            var model,
                self = this;

            _.each(models, function (model) {
                if (model instanceof Backbone.Model) {
                    var resource, tmpModel, eventResourceUrl, eventResource = null;
                    eventResourceUrl = self._urlRoot.concat(model.get('href'));
                    Logger.info("EventCollections: eventResourceUrl = " + eventResourceUrl);
                    if (model.get('type') === "execution complete") {
                        self.markEventPollingToStop();
                        // Trigger end of workflow event so whoever is listening knows
                        // the flow has ended
                        Logger.info("Execution Complete received.");
                        if (eventResourceUrl.indexOf('/workflows/init') !== -1) {
                            if (self._accountFetchesInProgress === 0) {
                                Logger.debug("EventCollections: Triggering init workflowComplete event.");
                                App.vent.trigger("workflowComplete");
                                self.resetInitVariables();
                            } else {
                                self._completeReceived = true;
                            }
                        } else {
                            Logger.debug("EventCollections: Triggering workflowComplete event.");
                            App.vent.trigger("workflowComplete");
                        }

                    } else {
                        for (resource in self._resourceMap) {
                            if (self._resourceMap.hasOwnProperty(resource)) {
                                try {
                                    //Logger.info("EventCollections: Comparing href (" + eventResourceUrl + ") to resource url (" + self._resourceMap[resource].url() + ")");
                                    if (eventResourceUrl === self._resourceMap[resource].url()) {
                                        // We found our resource
                                        Logger.info("EventCollections: Found a matching resource");
                                        eventResource = self._resourceMap[resource];
                                        break;
                                    }
                                } catch (ex1) {
                                    // Could not get the URL so this must be an invalid resource
                                    Logger.info("EventCollection : Exception (" + ex1 + ") retrieving URL of resource in ResourceMap with id=" + resource);
                                    Logger.info("EventCollection : Removing resource from ResourceMap with id=" + resource);
                                    delete self._resourceMap[resource];
                                }
                            }
                        }

                        // If we found a resource for this event, process it.
                        if (!_.isNull(eventResource)) {
                            // re-fetch the model/collection
                            Logger.info("EventCollections: Fetching updated resource");
                            if (eventResource.name === "account") {
                                self._accountFetchesInProgress += 1;
                            }
                            eventResource.fetch({
                                reset: true,
                                cache: false,
                                success: function (model, response, options) {
                                    var id = "";
                                    if (!_.isUndefined(model.id)) {
                                        id = model.id;
                                    } else if (!_.isUndefined(model.dataName)) {
                                        id = model.dataName;
                                    }
                                    Logger.debug("EventCollection : Model/Collection fetched successfully for model = " + id);
                                    if (model.name === "account") {
                                        if (self._accountFetchesInProgress > 0) {
                                            self._accountFetchesInProgress -= 1;
                                        }
                                        if (self._accountFetchesInProgress === 0 && self._completeReceived) {
                                            Logger.debug("EventCollections: Triggering workflowComplete event.");
                                            App.vent.trigger("workflowComplete");
                                            self.resetInitVariables();
                                        }
                                    }
                                },
                                error: function (model, xhr, options) {
                                    Logger.error("EventCollection : Failed to fetch the model/collection (" + xhr.statusCode() + ")");
                                    if (model.name === "account") {
                                        if (self._accountFetchesInProgress === 0 && self._completeReceived) {
                                            Logger.debug("EventCollections: Triggering workflowComplete event.");
                                            App.vent.trigger("workflowComplete");
                                            self.resetInitVariables();
                                        }
                                    }
                                }
                            });
                        } else {
                            Logger.info("EventCollections: Did not find a matching resource for href (" + model.get('href') + ")");
                        }
                    }
                }
                // Wipe out the event model
                model.clear();
            });
        }
    });
    return EventCollection;
});
