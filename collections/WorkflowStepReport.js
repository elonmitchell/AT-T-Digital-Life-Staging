/*
 * Copyright (c) 2014 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'jquery',
    'backbone',
    'underscore',
    'logger',
    'models/WorkflowStat'
], function ($, Backbone, _, Logger, WorkflowStatModel) {
    'use strict';
    var WorkflowStepReport = Backbone.Collection.extend({
        model: WorkflowStatModel,
        _reportURL: null,
        _xhrOptions: {},
        _postInterval: 60000,
        _cache: null,
        _workflowReports: [],
        _isActive: false,
        _attributes: {},
        _currentFlowName: "",
        _userId: "",
        initialize: function (models, options) {
            Logger.debug("WorkflowStepReport:initialize - Options = " + JSON.stringify(options));
            this._reportURL = window.App.getURLRoot() + '/offlineReport';
            if (!_.isUndefined(options.postInterval)) {
                this._postInterval = options.postInterval;
            }
            if (!_.isUndefined(window.App.cache)) {
                this._cache = window.App.cache;
            }
            if (!_.isUndefined(options.xhrOptions)) {
                this._xhrOptions = options.xhrOptions;
            }

            // If this is a mobile device, we need to pre-load any existing workflow reports
            if (!_.isUndefined(window.App.cafid)) {
                //set the user id of the report with
                this._userId = window.App.cafid;
                if (!_.isNull(this._cache)) {
                    this._reloadFromCache();
                }
            }
        },
        stopReporting: function () {
            Logger.debug("WorkflowStepReport:stopReporting");
            this._isActive = false;
        },
        startReporting: function () {
            Logger.debug("WorkflowStepReport:startReporting");
            this._isActive = true;
        },
        logStartReport: function (flowName) {
            Logger.debug("WorkflowStepReport:logStartReport");
            var propertiesStat,
                reportData;
            if (_.isUndefined(flowName) || _.isEmpty(flowName)) {
                Logger.error("WorkflowStepReport:logStartReport - Invalid startReport, not logging");
                return;
            }

            if (!_.isEmpty(this._currentFlowName) && this._currentFlowName !== flowName) {
                // There is an unfinished report so close it before starting a new one
                this.logEndReport(flowName, "Abort");
            } else {  //set properties if a new flow is started
                //set report data with properties mobile app only for now
                if (!_.isUndefined(window.App.cafid)) {
                    this._setPropertiesData(flowName);
                }
            }

            // Set timer to post interval
            if (this._postInterval > 0 && !this._isActive) {
                this._resetTimer();
                this._isActive = true;
            }

            // Set default data
            this._currentFlowName = flowName;
            this._attributes.subscriber = this._userId;
            this._attributes.workflowName = flowName;
            this._attributes.startTime = this._timeAsString();
            this._attributes.channel = "offline";
            this._attributes.session = window.App.sessionGUID;
            this._attributes.status = "Running";
            this._attributes.workflowExecId = this._generateUUID();
            this._attributes.workflowId = flowName;

            // If we are offline, persist the current state
            if (!this._isOnline() && !_.isNull(this._cache)) {
                this._saveToCache();
            }
        },
        logEndReport: function (flowName, status) {
            Logger.debug("WorkflowStepReport:logEndReport");
            if (_.isUndefined(flowName) || _.isEmpty(flowName) ||
                    _.isUndefined(status) || _.isEmpty(status)) {
                Logger.error("WorkflowStepReport:logEndReport - Invalid endReport, not logging");
                return;
            }
            var report = {};
            this._attributes.stopTime = this._timeAsString();
            this._attributes.status = status;
            this._attributes.stepSequenceCounter = this.length;
            // Save off the report info
            report._attributes = this._attributes;
            report.models = this.models;
            report.length = this.length;
            this._workflowReports.push(report);
            // Clear out the current report
            this.reset();
            this._attributes = {};
            this._currentFlowName = "";
            // If we are offline, persist the current state
            if (!_.isNull(this._cache)) {
                if (!this._isOnline()) {
                    this._saveToCache();
                }
                //clear models and attributes from cache
                this._cache.removeItem('ssc.core.wf_currentReport');
                this._cache.removeItem('ssc.core.wf_currentReportSteps');
            }
        },
        logStepEvent: function (flowName, step, status, map, errorCode, errorMsg) {
            Logger.debug("WorkflowStepReport:logEvent");
            var stat = null,
                report = {},
                reportData;
            if (_.isUndefined(flowName) || _.isEmpty(flowName) ||
                    _.isUndefined(step) || _.isEmpty(step) ||
                    _.isUndefined(status) || _.isEmpty(status)) {
                Logger.error("WorkflowStepReport:logEvent - Invalid stat, not logging");
                return;
            }
            // Create a new step model
            stat = new WorkflowStatModel({
                "stepName": step,
                "displayName": step,
                "stepProcessInstanceId": step,
                "stepSequenceId": this.length,
                "transitionName": status,
                "flowName": flowName,
                "startTime": this._timeAsString(),
                "stopTime": this._timeAsString()
            });
            if (!_.isUndefined(map) && !_.isNull(map)) {
                reportData = this._parseReportData(map);
                if (!_.isEmpty(reportData)) {
                    stat.set('WorkflowReportData', reportData);
                    stat.set('datumSequenceCounter', reportData.length);
                }
            }
            if (!_.isUndefined(errorCode)) {
                stat.set('errorResultCode', errorCode);
            }
            if (!_.isUndefined(errorMsg)) {
                stat.set('errorResultString', errorMsg);
            }
            // Add it to the collection
            this.add(stat);

            // If we are offline, persist the current state
            if (!this._isOnline() && !_.isNull(this._cache)) {
                this._saveToCache();
            }
        },
        postReport: function (self) {
            if (self._isActive && self._isOnline() && !_.isNull(self._reportURL)) {
                Logger.debug("WorkflowStepReport:postReport entered");
                var data,
                    stepData;

                if (self._workflowReports.length > 0) {
                    Logger.debug("WorkflowStepReport:postReport posting report 1 of " + self._workflowReports.length);
                    // Get Report Data
                    stepData = "";
                    data = JSON.stringify(self._workflowReports[0]._attributes);
                    if (self._workflowReports[0].models.length > 0) {
                        if (stepData.length !== 0) {
                            stepData += ",";
                        }
                        stepData += JSON.stringify(self._workflowReports[0].models);
                    }
                    // Fix up the data
                    data = data.slice(0, data.length - 1);
                    data += ',\"WorkflowStepReport\":' + stepData + '}';
                    self._postData(data, 0);
                } else if (self._workflowReports.length === 0 && self.length > 0) {
                    Logger.debug("WorkflowStepReport:postReport posting " + self.length + " steps");
                    data = JSON.stringify(self._attributes);
                    stepData = "";
                    // Add each step
                    if (self.models.length > 0) {
                        if (stepData.length !== 0) {
                            stepData += ",";
                        }
                        stepData += JSON.stringify(self.models);
                    }
                    // Fix up the data
                    data = data.slice(0, data.length - 1);
                    data += ',\"WorkflowStepReport\":' + stepData + '}';
                    self._postData(data, -1);
                } else {
                    self._resetTimer();
                }
            } else {// Reset timer to post interval
                self._resetTimer();
            }
        },
        _postData: function (data, reportIndex) {
            var self = this;
            Logger.debug("WorkflowStepReport:_postData - Sending data =" + data);
            $.ajax({
                url: this._reportURL + "?soaTraceId=" + window.App.sessionGUID,
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                data: data,
                async: true,
                global: false,
                xhrFields: this._xhrOptions,
                success: function (data, status, xhr) {
                    Logger.debug("WorkflowStepReport:_postData - Success data =" + xhr.status);
                    if (reportIndex !== -1) {
                        // Remove posted report
                        self._workflowReports.shift();
                        if (self._workflowReports.length === 0 && self._cache !== null) {
                            self._cache.removeItem('ssc.core.wf_reports');
                        } else {
                            _.defer(function (self) {
                                self.postReport(self);
                            }, self);
                        }
                    } else {
                        // Remove all step models
                        self.reset();
                        self._clearCache();
                    }

                    if (self._workflowReports.length === 0) {
                        self._resetTimer();
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    Logger.error("WorkflowStepReport:_postData  - Failure: status = " + jqXHR.status + " textStatus = " + textStatus + " errorThrown = " + errorThrown);
                    // If we get a 500, delete the data since we have bad data
                    if (jqXHR.status === 500) {
                        Logger.error("WorkflowStepReport:_postData - Error 500 from server, deleting workflow report.");
                        if (reportIndex !== -1) {
                            // Remove bad report
                            // Remove posted report
                            self._workflowReports.shift();
                            if (self._workflowReports.length === 0 && self._cache !== null) {
                                self._cache.removeItem('ssc.core.wf_reports');
                            } else {
                                _.defer(function (self) {
                                    self.postReport(self);
                                }, self);
                            }
                        } else {
                            // Remove all step models
                            self.reset();
                            self._clearCache();
                        }
                    }
                    if (self._workflowReports.length === 0 || jqXHR.status !== 500) {
                        self._resetTimer();
                    }
                }
            });
        },
        _isOnline: function () {
            return (window.App.cordova && !window.App.isOnline) ? false : true;
        },
        _saveToCache: function () {
            if (_.isNull(this._cache)) {
                return;
            }
            try {
                this._cache.setItem('ssc.core.wf_reports', JSON.stringify(this._workflowReports));
                this._cache.setItem('ssc.core.wf_currentReportSteps', JSON.stringify(this.models));
                this._cache.setItem('ssc.core.wf_currentReport', JSON.stringify((this._attributes)));
            } catch (err) {
                Logger.error("WorkflowStepReport:_saveToCache - Error saving to cache (" + err + ")");
                if (err === 'QUOTA_EXCEEDED_ERR') {
                    this._clearCache();
                    var saveCache = _.once(this._saveToCache);
                    _.defer(function () {
                        saveCache();
                    });
                }
            }
        },
        _reloadFromCache: function () {
            if (_.isNull(this._cache)) {
                return;
            }
            var item;
            item = this._cache.getItem('ssc.core.wf_currentReportSteps');
            if (item) {
                this.reset(JSON.parse(item));
            }
            item = this._cache.getItem('ssc.core.wf_currentReport');
            if (item) {
                this._attributes = JSON.parse(item);
            } else {
                this.attributes = {};
            }
            item = this._cache.getItem('ssc.core.wf_reports');
            if (item) {
                this._workflowReports = JSON.parse(item);
            } else {
                this._workflowReports = [];
            }
        },
        _clearCache: function () {
            if (_.isNull(this._cache)) {
                return;
            }

            Logger.debug("WorkflowStepReport:_clearCache - Removing cached workflow data.");
            if (!_.isNull(this._cache)) {
                this._cache.removeItem('ssc.core.wf_currentReportSteps');
                this._cache.removeItem('ssc.core.wf_currentReport');
                this._cache.removeItem('ssc.core.wf_reports');
            }
        },
        _timeAsString: function () {
            // Properly format the time stamp for reports
            var dt = new Date(), timeZone, timeZoneString;
            timeZone = Math.floor(Math.abs(dt.getTimezoneOffset() / 60));
            timeZoneString = (dt.getTimezoneOffset() < 0 ? '+' : '-') + (timeZone < 10 ? '0' + timeZone : timeZone) + ':00';
            return dt.getUTCFullYear()
                + '-' + this._pad(dt.getUTCMonth() + 1)
                + '-' + this._pad(dt.getUTCDate())
                + 'T' + this._pad(dt.getUTCHours())
                + ':' + this._pad(dt.getUTCMinutes())
                + ':' + this._pad(dt.getUTCSeconds())
                + '.' + String((dt.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
                + timeZoneString;
        },
        _pad: function (number) {
            var tmp = String(number);
            if (tmp.length === 1) {
                tmp = '0' + tmp;
            }
            return tmp;
        },
        _generateUUID: function () {
            var dt = new Date().getTime(),
                rseed = 0,
                uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    rseed = (dt + Math.random() * 16) % 16 | 0;
                    dt = Math.floor(dt / 16);
                    return (c === 'x' ? rseed : (rseed & 0x7 | 0x8)).toString(16);
                });
            return uuid;
        },
        _parseReportData: function (map) {
            var index,
                item,
                reportData = [];
            for (index = 0; index < map.length; index += 1) {
                item = map[index];
                reportData.push({"datumSequenceId": index,
                    "id": index,
                    "name": item.name,
                    "value": item.value
                    });
            }
            return reportData;
        },
        _setUserId: function (id) {
            if (!_.isEmpty(id)) {   //make sure its not empty
                this._userId = id;
            }
        },
        _resetTimer: function () {
            Logger.debug("WorkflowStepReport:_resetTimer");
            _.delay(this.postReport, this._postInterval, this);
        },
        _setPropertiesData: function (flowName) {
            var propertiesData = [],
                propertiesStat;
            if (!_.isUndefined(window.App.platform) && !_.isUndefined(window.App.osVersion)) {
                propertiesData = [{"datumSequenceId": "0", "id": "0", "name": "os.name", "value": window.App.platform}, {"datumSequenceId": "1", "id": "0", "name": "os.version", "value": window.App.osVersion}];
                // Create a new step model
                propertiesStat = new WorkflowStatModel({
                    "stepName": "Properties",
                    "displayName": "Properties",
                    "stepProcessInstanceId": "Properties",
                    "stepSequenceId": this.length,
                    "transitionName": "Pass",
                    "flowName": flowName,
                    "startTime": this._timeAsString(),
                    "stopTime": this._timeAsString()
                });
                propertiesStat.set("WorkflowReportData", propertiesData);
                propertiesStat.set('datumSequenceCounter', propertiesData.length);
                this.add(propertiesStat);
            }
        }

    });
    return WorkflowStepReport;
});