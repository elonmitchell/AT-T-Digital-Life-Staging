/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'jquery',
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!nls/Messages',
    'tpl!templates/Loading.html',
    'spin'
], function ($, Marionette, _, Logger, i18n, Template, Spinner) {
    'use strict';
    return Marionette.ItemView.extend({
        className: "loading-container",
        template: Template,
        templateHelpers: function () {
            return {
                i18n: i18n
            };
        },
        _spinnerOptions: {
            lines: 9, // The number of lines to draw
            length: 0, // The length of each line
            width: 18, // The line thickness
            radius: 32, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            speed: 0.9, // Rounds per second
            trail: 68, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: true, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            color: '#555',
            top: "50px", // Top position relative to parent in px
            left: "50px" // Left position relative to parent in px
        },
        initialize: function () {
            this.spinner = new Spinner(this._spinnerOptions);
        },
        onShow: function () {
            this.spinner.spin(this.$el.find("#loading-spinner")[0]);
            this.verticallyCenterSpinner();
        },
        verticallyCenterSpinner: function () {
            var adjustment = parseInt(($(window).height() - this.$el.height()) / 2, 10);
            this.$el.css("margin-top", adjustment);
        }
    });
});