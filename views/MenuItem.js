/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global $, jQuery, console*/
define([
    'backbone',
	'backbone.marionette',
	'underscore',
	'logger',
	'i18n!nls/Messages',
	'tpl!templates/MenuItem.html'
], function (Backbone, Marionette, _, Logger, i18n, Template) {
	'use strict';
	return Marionette.ItemView.extend({

		template: Template,

		tagName: 'li',

		className: 'nav-item',

		preventNavigate : false,

		templateHelpers: function () {
			var self = this;
			return {
				i18n: i18n,
				hasParent: function () {
				    if (self.model) {
					    if (self.model.get('parent') !== null) {
                            return true;
				        }
                    }
                    return false;
				},
				imageUrl: function () {
                    var iconName = self.model.get("name");
                    return i18n.get(iconName + "ImageUrl", "images/nav/icon_newitem.png");
                }
			};
		},

		initialize: function () {
			var self = this;
//			_.bindAll(this);
			this._enableClick = true;

			// Listen For Events to enable/disable click
			window.App.vent.on('dashboard:expand', function () { self._enableClick = false; });
            window.App.vent.on('dashboard:shrink', function () { self._enableClick = true; });
		},

		onRender: function () {
		    var self = this;

            this.$el.parent().on('click', '.nav-item', _.bind(self.clicknavigate, this));
            //do not trap touchstart to enable default scrolling
            //this.$el.on('touchstart', 'a', _.bind(self.touchnavigate, this));

			this.$el.attr('data-navid', this.model.get("name"));
		    if (this.model.get('authenticationRequired') === true) {
                Logger.debug("Showing lock icon");
                this.$(".lock-icon").show();
            } else {
                this.$(".lock-icon").hide();
            }
        },

		events: {
		    'click'      : 'clicknavigate'
			//'touchstart' : 'touchnavigate'           //do not trap touch events incase user is trying to scroll
		},

		clicknavigate: function (e) {
		    Logger.log("MenuItemView : clicknavigate **********");
		    e.stopPropagation();
            e.preventDefault();
            window.App.vent.trigger("alerts:close");
            window.App.vent.trigger("suspendedFlows:close");
            if (!this.$el.hasClass('disabled')) {        //only navigate if item does not require connectivity
                this.navigate();
            }
		},

		/**touchnavigate: function (e) {
            Logger.log("MenuItemView : touchnavigate ^^^^^^^^");
            e.stopPropagation();
            e.preventDefault();
            this.navigate();
        },*/

		// Label the DOM element as newly created
		assignNewlyCreated: function () {
			this.$el.addClass('newly-created');
		},

		// Slide out the item.
		slideOut: function () {
			// this.$el.addClass('out');
			this.$el.animate({
				left: -245
			}, 200);
		},

		// Slide in the item.
		slideIn: function () {
			// this.$el.removeClass('out');
			// this.$el.addClass('in');
			this.$el.animate({
				left: 0
			}, 200);
		},

		navigate : function () {

            var menuView,
                activeNav,
                name,
                parent;

            Logger.log("MenuItemView : navigate ********** ++++");

            if (this.preventNavigate) {
                Logger.log("MenuItemView : preventNavigate is ON, ignore the tap");
                return;
            }
            this.preventNavigate = true;

			// Don't navigate if menu access is disabled
			menuView = this.model.get('parentView');
			if (menuView.preventAccess) {
                Logger.log("MenuItemView : preventAccess is ON, DO NOTHING");
                this.preventNavigate = false;
                return;
			}

			// Don't navigate if click is disabled
			if (this._enableClick === false) {
			    this.preventNavigate = false;
			    window.App.vent.trigger('dashboard:shrink');
                return;
            }

            // Update the URL hash
			// (this is so this gets triggered by a touch event instead of a click)
            /**if ($(window).width() < 481) {
                if (this.model.get('name') === "myInfo") {
                    Logger.log("MenuItemView : navigate called for Home");
                    window.location.hash = this.model.get('hash') + "/" + menuView.homeAnimation;
                    if (menuView.homeAnimation === "none") {
                        menuView.homeAnimation = "slide";
                    }
                } else {
                    menuView.homeAnimation = "none";
                    window.location.hash = this.model.get('hash');
                }
            } else { */
            Logger.log("MenuItemView : window.location.hash = " + window.location.hash);
            Logger.log("MenuItemView : this.model.get('hash') = " + this.model.get('hash'));
            if (window.location.hash === this.model.get('hash')) {
                Logger.log("MenuItemView : Calling loadUrl()");
                Backbone.history.loadUrl();
            } else {
                window.location.hash = this.model.get('hash');
            }

            //}

			// Get the currently active nav item
			activeNav = menuView.collection.where({active: true})[0];
			// Turn it off
			if (activeNav) {
				activeNav.set('active', false);
			}
			// Turn the new nav item on
            this.model.set('active', true);

			name = this.model.get('name');
			if (menuView.collection.where({parent: name}).length > 0) {
				parent = name;
			} else {
				parent = this.model.get('parent');
			}
			if (parent !== menuView.curNavParent) {
				menuView.curNavParent = parent;
			}

            window.setTimeout(function () {
                menuView.render();
                this.preventNavigate = false;
            }, 1);
		},

		// The menu removes all selected classes
		selectItem: function () {
			$('.main-menu li').removeClass('selected');
            this.$el.removeClass('child');
			this.$el.addClass('selected');
		}
	});
});