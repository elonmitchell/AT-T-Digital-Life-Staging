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
    'basemodel',
    'underscore',
    'logger'
], function (Backbone, BaseModel, _, Logger) {
    'use strict';
    /**
     * DebugLog class
     * DebugLog class to capture and POST client logs to the
     * server
     * @class DebugLog
     * @extends Backbone.RelationalModel
     * @constructor
     * @return DebugLog object
     */
    var DebugLog = BaseModel.extend({
        name: 'debuglog',
        _isActive: false,
        _logLevel: 4,
        _maxLogSize: 5120,
        _postInterval: 60000,
        url: function () {
            return App.getURLRoot() + "/clientlog";
        },
        initDebugLogging: function () {
            Logger.turnOnDebugLogging(this._logLevel);
            this._isActive = false;
        },
        start: function (level, postInterval, maxLogSize) {
            if (!_.isUndefined(level) && (level > 0 && level < 5)) {
                this._logLevel = level;
            }
            if (!_.isUndefined(postInterval) && postInterval > 0) {
                this._postInterval = postInterval;
            }
            if (!_.isUndefined(maxLogSize) && maxLogSize > 0) {
                this._maxLogSize = maxLogSize;
            }

            Logger.turnOnDebugLogging(this._logLevel, this._maxLogLevel);
            this._isActive = true;
            // Start timer
            _.delay(this._postLogToServer, this._postInterval, this);
        },
        stop: function () {
            // Get the remaining log data and send it
            this._postLogToServer();
            // Signal we are no longer active
            this._isActive = false;
            Logger.turnOffDebugLogging();
        },
        _postLogToServer: function (self) {
            if (!_.isUndefined(self)) {
                if (self._isActive) {
                    var logData = self.get('logData') + Logger.getDebugLogData();
                    self.set('logData', logData);
                    self.save(null, {
                        success: function (model, response, options) {
                            Logger.info("DebugLog: Log successfully POSTed to server");
                            self.set('logData', "");
                        },
                        error: function (model, response, options) {
                            Logger.error("DebugLog : Failed to POST log to server");
                        }
                    });
                    // Reset timer
                    _.delay(self._postLogToServer, self._postInterval, self);
                }
            }
        },
        defaults: {
            'subscriberId': null,
            'logData': ""
        }
    });
    return DebugLog;
});
