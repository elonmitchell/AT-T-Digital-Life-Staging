/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone',
    'backbone.marionette',
    'underscore',
    'jquery',
    'logger'
], function (Backbone, Marionette, _, $, Logger) {
    'use strict';

    return Backbone.Marionette.Region.extend({

        initialize: function () {
            var self = this, calculateWidth = _.debounce(function () {
                self.width = $('.page-region').width();
            }, 300);
            $(window).resize(calculateWidth);
        },

        show: function (view) {
            this.ensureEl();
            view.render();

            this.close(function () {
                if (this.currentView && this.currentView !== view) {
                    return;
                }
                this.currentView = view;

                this.open(view, function () {
                    if (view.onShow) {
                        view.onShow();
                    }
                    view.trigger("show");
                    if (this.onShow) {
                        this.onShow(view);
                    }
                    this.trigger("view:show", view);
                });
            });
        },

        close: function (cb) {
            var view = this.currentView, self = this, width = this.width || $('.page-region').width();
            delete this.currentView;

            if (!view) {
                if (cb) {
                    cb.call(this);
                }
                return;
            }

            view.$el.css('-webkit-transition', 'all 0.3s ease-in-out');
            view.$el.css('-webkit-transform', 'translate3d(' + -width + 'px, 0, 0)');

            /**
             * Fire Close after 1 sec to allow CSS animation
             * to complete before closing the view.
             */

            setTimeout(function () {
                if (view.close) {
                    view.close();
                }
                self.trigger("view:closed", view);
                if (cb) {
                    cb.call(self);
                }
            }, 100);
        },

        open: function (view, cb) {
            var self = this, width = this.width || $('.page-region').width();

            // Don't animate a view unless specified
            if (!view.animate) {
                this.$el.html(view.$el);
                cb.call(this);
                return;
            }

            view.$el.css('position', 'relative');
            view.$el.css('left', width + 'px');

            this.$el.html(view.$el);

            view.$el.css('-webkit-transition', 'all .3s ease-in-out');
            view.$el.css('-webkit-transform', 'translate3d(0, 0, 0)');

            setTimeout(function () {
                view.$el.css('left', 0);
                if (cb) {
                    cb.call(self);
                }
            }, 100);
        }
    });
});
