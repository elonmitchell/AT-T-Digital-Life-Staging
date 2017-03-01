/*
 * Copyright (c) 2014 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone'
], function (Backbone) {
    'use strict';
    /**
     * WorkflowStat class
     * This is the WorkflowStat model class
     * @class WorkflowStat
     * @extends Backbone.Model
     * @constructor
     * @return WorkflowStat object
     */
    var WorkflowStat = Backbone.Model.extend({
        defaults: {
            datumSequenceCounter: 0,
            displayName: "",
            startTime: "",
            stepName: "",
            stepProcessInstanceId: "",
            stepSequenceId: 0,
            stopTime: "",
            transitionName: "",
            flowName: ""
        }
    });
    return WorkflowStat;
});