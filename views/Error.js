/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App*/
define([
    'backbone.marionette',
    'logger',
    'i18n!nls/Messages',
    'tpl!templates/Error.html'
], function (Marionette, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getErrorMessage: function () {
                    return self.errorMessage || "";
                },
                getRequestError: function () {
                    return self.requestError || "";
                }
            };
        },
        initialize: function (options) {
            this.errorMessage = options.errorMessage;
            this.requestError = options.requestError;
        }
    });
});
