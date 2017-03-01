/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone',
    'jquery',
    'jqueryui',
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!nls/Messages',
    'collections/Menu',
    'views/Menu',
    'views/Header',
    'views/Loading',
    'sideNav',
    'tpl!templates/Dashboard.html',
    'environment'
], function (Backbone, $, jq, Marionette, _, Logger, i18n, MenuCollection, MenuView, HeaderView,
             LoadingView, sideNav, DashboardTemplate, Env) {
    'use strict';
    return Marionette.Layout.extend({

        _content: null,
        _timer: null,

        regions: {
            layout: '.toplevel-region',
            navbar: '.nav-items-region',
            header: '.header',
            content: '.content-region'
        },
        template: DashboardTemplate,

        // Values to add into template
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                network: 'Home Network',
                isAnonymous: function () {
                    return self.model.get('anonymous') === true;
                },
                isOffline: function () {
                    return window.App.isOnline === false;
                },
                isCSRMode: function () {
                    return window.App.configuration.get('csrMode') === "true";
                }
            };
        },

        events: {
            "click .logout": "logout",
            "click button.header-done": "onShrink",
            "click .nav-region": "onShrink",
            "click .logoutTxt": "onConnect"
        },

        logout: function () {
            Logger.debug("DashboardView : logout");
            window.App.vent.trigger('logout');
        },

        showSessionTimeoutDialog: function () {
            Logger.debug("DashboardView : showSessionTimeoutDialog");
            // Show dialog that session has timed out
            var dl = window.$("#dialog-session-timeout");
            if (_.isUndefined(dl) || dl.length === 0) {
                Logger.debug("DashboardView : showSessionTimeoutDialog - Can't find dialog, go to autoLogout");
                window.App.vent.trigger("dashboard:sessionTimeout:continue");
            } else if (this._dialogShowing !== true) {
                this._dialogShowing = true;
                dl.dialog({
                    dialogClass: "no-close",
                    closeOnEscape: false,
                    resizable: false,
                    height: 140,
                    modal: true,
                    buttons: [
                        {
                            text: i18n.get('sessionTimeoutBtn'),
                            click: function () {
                                this._dialogShowing = false;
                                window.$("#dialog-session-timeout").dialog("destroy");
                                window.App.vent.trigger("dashboard:sessionTimeout:continue");
                            }
                        }
                    ]
                });
            }
        },

        initialize: function () {
            var lazyLayout,
                timeout;

            _.bindAll(this, 'logout', 'repopulate', 'updatePageRegionLayout', 'onShrink', 'shrinkPanel', 'display', 'hide');
            Logger.log("DashboardView : initialize");

            // Complain if model is undefined
            if (_.isUndefined(this.model)) {
                Logger.warn("DashboardView : Model is undefined");
                throw new Error('DashboardView didn\'t receive a model.');
            }

            // Instantiate
            this.menu = new MenuCollection();

            // Bind to changes in the domains as they're fetched via the EventCollection
            this._expanded = false;
            if (this.model.get('cacheTime')) {
                this.cacheInfo = " as of " + this.model.get('cacheTime');
            }
            // When the domains are ready, render the menu
            // NOTE: this can be fired more than once!
            this.model.get('domains').on('ready', this.repopulate);

            window.App.vent.on('dashboard:shrink', this.shrinkPanel);
            window.App.vent.on("dashboard:hideConnectButton", this.hideConnectButton);

            // Set up window resize event handler.
            lazyLayout = _.debounce(this.updatePageRegionLayout, 300);
            $(window).resize(function () {
                Logger.debug('resize called......');
                lazyLayout(true);
            });

            // Setup Loading View
            this.loadingView = new LoadingView();

            // Initialization timeout
            timeout = window.App.configuration.get('initializationTimeout');
            if (timeout === undefined) {
                timeout = 30000;
            }
            this._timer = window.setTimeout(this._onTimeout, timeout);

            //for offline styles
            if (window.App.cordova && !window.App.isOnline) {
                this.$el.addClass("offline");
            }
        },
        _onTimeout: function () {
            Logger.error("DashboardView : _onTimeout - Timed out before the view was closed");
            window.App.vent.trigger("initialization:timeout", i18n.get('initTimeoutMsg'));
        },
        // Render the menu with repopulated data
        // NOTE: this can be fired more than once!
        repopulate: function () {

            Logger.log("Domains ready");
            this.ready = true;

            // Kill our timer
            window.clearTimeout(this._timer);
            this._timer = null;

            // If this is not the first time, special circumstances need to be considered
            if (this.menuView) {
                var todo = true;
                // If the app is eventually going to use bookmarkable state (e.g. like the motivation demo)
                // Domain/service/operation/device changes from the EventCollection should be handled here
                // Requires a custom rendering of the menu
            } else {

                // TODO: hide loading spinner

                // Rebuild menu collection using domains and static content
                this.menu.repopulate(this.model);

                // Instantiate menu view
                this.menuView = new MenuView({
                    collection: this.menu
                });

                // Render main content section
                // Default to accountview
                this.headerView = new HeaderView({
                    model: new Backbone.Model({
                        title: this.headerTitle,
                        icon: this.headerIcon,
                        cacheInfo: ""
                    })
                });

                this.render();

                Logger.log("DashboardView : repopulate : Trigger");
                window.App.vent.trigger('dashboard:menu-loaded');
            }
        },
        onRender: function () {
            Logger.log("DashboardView : render");

            if (_.isUndefined(this.model)) {
                Logger.warn("DashboardView : Model is undefined");
                return;
            }

            // Only render subviews when this view is ready
            if (this.ready) {

                // Render section header
                this.header.show(this.headerView);

                // Render the navbar
                this.navbar.show(this.menuView);

                // Size the content region to the proper width
                this.updatePageRegionLayout(false);
                window.App.vent.trigger('dashboard:ready');
            }

            return this;
        },

        // Set the page region width by subtracting the window width from the nav width
        updatePageRegionLayout: function (updates) {
            Logger.debug('$(window).width() = ' + $(window).width());
            //check if menu interaction state has changed on orientation change
            this.navEnabled = this.$('.menu-toggle').css('display') === "block";

            if (!this.navEnabled) {
                Logger.debug('updates = *** ' + updates);

                if (updates !== false) {
                    Logger.debug('updates false = *** ');
                    this.$('.page-region').css("left", "245px");
                    this.$('.page-region').css({
                        '-webkit-transition': 'all 100ms ease-out',
                        '-webkit-transform': 'translate3d(0px,0,0)',
                        '-webkit-perspective': 1000
                    });
                    this.initMenuControl = null;  //reset sideNav call
                }
                //$('.nav-region').show();
                //$('.nav').show();
                this.$('.page-region').width($(window).width() - this.$('.nav-region').width());
            } else {
                Logger.debug('resetting page region size');
                //rebind the menu events
                if (updates === true && (_.isUndefined(this.initMenuControl) || this.initMenuControl === null)) {
                    sideNav();
                    this.initMenuControl = true;
                }
                //reset the page width
                this.$('.page-region').width($(window).width());
                this.$('.page-region').css("left", "0px");
            }
            this.$('.page-region').height($(window).height());
            this.$('.content-wrapper').height($(window).height() - 45);
            window.App.vent.trigger('dashboard:resize');
        },

        // Emit an event here so we can have listeners in other
        // views, ex: menuItemView
        onShrink: function () {
            window.App.vent.trigger('dashboard:shrink');
        },

        shrinkPanel: function () {
            if (!this._expanded) {
                return;
            }
            this._expanded = false;
            var duration = 300;

            // Use hardware-accelerated animations, if available
            this.$('.page-region').css({
                '-webkit-transition': 'all ' + duration + 'ms ease-out',
                '-webkit-transform': 'translate3d(0,0,0)',
                '-webkit-perspective': 1000
            });

            this.updatePageRegionLayout(false);
        },

        // Display a new view in the main dashboard
        // Animation argument is optional--
        // one of:
        //      -> 'slide' (dashboard slides out and back in)

        //		-> 'none' (no animation)
        //      -> null (use default ['slide'])
        display: function (options) {

            //reset the content-region background
            this.$('.page-region .content-region').css('background', '');
            //determine if user can interact with the menu
            this.navEnabled = this.$('.hamburger-icon').css('display') === "block";

            if (options.icon) {
                this.headerView.model.set('icon', options.icon);
            }
            if (options.title) {
                this.headerView.model.set('title', options.title);
            }
            if (this.cacheInfo) {
                this.headerView.model.set('cacheInfo', this.cacheInfo);
            }
            if (!options.animation) {
                options.animation = 'slide';
            }

            this.header.show(this.headerView);
            // Check if node options is passed in and update Page Region Size
            var node = options.node || false,
                duration,
                left;

            //if (node) {
            //this.headerView.$('button.header-done').show();
            //	this._expanded = true;
            // Emit an Event to disable click in Menu
            //	window.App.vent.trigger('dashboard:expand');
            //}
            //change the background of content region when login is displayed
            if (options.view.$el.is("div#Login")) {
                Logger.log("showing login, fill background");
                this.$('.page-region .content-region').css('background', $('body').css("background"));
            }
            this.content.show(options.view);

            this.updatePageRegionLayout(false);
            window.App.vent.trigger('region:showing');


            // Perform animation
            if (options.animation === 'slide') {

                duration = options.duration || 300;

                // If view is a leaf node subtract 155px from the left position
                //if ($(window).width() >= 481) {
                //	left = node ? -155 : 0;
                //} else {
                left = 0;
                //}

                // Use hardware-accelerated animations, if available
                this.$('.page-region').css({
                    '-webkit-transition': '-webkit-transform ' + duration + 'ms ease-out',
                    '-webkit-transform': 'translate3d(' + left + 'px,0,0)',
                    '-webkit-perspective': 1000
                });

            }

            // Call sideNav() for managing nav open/close only if interaction is allowed
            // multiple calls required to rebind events for menu interaction
            if (!Env.isDesktopBrowser() && this.navEnabled && (_.isUndefined(this.initMenuControl) || this.initMenuControl === null)) {
                sideNav();
                this.initMenuControl = true;   // keep track of sideNav calls
            }
        },

        // Hide the old view
        hide: function (options) {
            this.navEnabled = this.$('.menu-toggle').css('display') === "block";
            if (!options) {
                options = {};
            }
            if (!options.animation) {
                options.animation = 'slide';
            }

            if (options.animation === 'slide') {

                // Use hardware-accelerated animations
                var duration = options.duration || 300;

                if (!this.navEnabled) {

                    this.$('.page-region').css({
                        '-webkit-transition': '-webkit-transform ' + duration + 'ms ease-out',
                        '-webkit-transform': 'translate3d(100%,0,0)',
                        '-webkit-perspective': 1000
                    });
                } else {

                    this.$('.page-region').css({
                        '-webkit-transition': '-webkit-transform ' + duration + 'ms ease-out',
                        '-webkit-transform': 'translate3d(245px,0,0)',
                        '-webkit-perspective': 1000
                    });
                }

            }
        },
        selectMenuItem: function (id) {
            this.menuView.selectMenuItem(id);
        },
        onConnect: function () {
            window.App.router.navigate("connectivityFlow", {trigger: true, replace: true});
        },
        hideConnectButton: function () {
            window.App.content.$el.find('.logoutTxt').fadeOut(200);
        },
        onShow: function () {
            // Show Loading If Not Ready
            if (!this.ready) {
                this.layout.show(this.loadingView);
            }
        }
    });
});