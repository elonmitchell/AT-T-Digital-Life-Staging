/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global $, jQuery, console*/
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'views/MenuItem',
    'async'
], function (Marionette, _, Logger, MenuItemView, async) {
    'use strict';
    return Marionette.CollectionView.extend({

        tagName: "ul",

        className: "main-menu",

        itemView: MenuItemView,

        curNavParent: null,

        homeAnimation: 'none',

        newMenu: true,

        initialize: function () {
            var self = this;
            self.topLevelCollection = self.collection.clone();
            // Allow interaction with the menu items initially
            self.preventAccess = false;
            window.App.vent.on("menu:clear", self.clearMenu, self);
        },

        onAfterItemAdded: function (view) {
            view.model.set('parentView', this);
        },

        appendHtml: function (collectionView, itemView, index) {
            itemView.assignNewlyCreated();

            // If we're given an index number, insert the new view in that slot
            if (index !== null && !_.isUndefined(index) && collectionView.$el.children().length > index) {
                $(itemView.el).insertBefore(collectionView.$el.children()[index]);
            } else {    // Otherwise just put it at the end of the list
                collectionView.$el.append(itemView.el);
            }

            // Strip the "parent" class by default; may be added back in later
            itemView.$el.removeClass('parent');

            if (window.App.cordova && !window.App.isOnline) {
                if (itemView.model.attributes.connectivityRequired) {
                    itemView.$el.addClass('disabled');
                }
            }
            // Add "active" class if necessary
            if (itemView.model.get('active')) {
                itemView.$el.addClass('active');
            } else {
                itemView.$el.removeClass('active');
            }

        },

        render: function () {
            var self = this,
                parentNavItem,
                navItemView,
                homeNavItemView,
                newNav,
                oldNavItems,
                newNavItems,
                itemsToSlideOut,
                itemsToMove,
                itemsToSlideIn,
                slideOut,
                move,
                slideIn,
                doSlideIn,
                i,
                item,
                cb,
                animationSpeed = 200,
                topParentId,
                currentTopParentIndex = -1,
                currentItemIndex = 0;

            Logger.debug("Menu : render called &&&&&&&&&&&&&&");

            this.isClosed = false;
            this.triggerBeforeRender();

            // Really hacky thing
            // Prevent accessing anything until X ms have passed
            self.preventAccess = true;

            Logger.log("Menu : preventAccess is TURNED ON **********");
            //window.setTimeout(function () {
            //	self.preventAccess = false;
            //}, 1000);

            // Add the item views all of the children of the selected nav item
            _.each(this.collection.where({parent: this.curNavParent}), function (item, index) {
                var ItemView = self.getItemView(item);
                self.addItemView(item, ItemView, index);
                self.$el.find('[data-navid="' + item.get('name') + '"]').addClass(item.get('type'));
                currentItemIndex += 1;
            });

            // If the current nav isn't the root, put the breadcrumb on top
            if (this.curNavParent !== null) {
                Logger.debug("Menu : render curNavParent is " + this.curNavParent);
                // Get the parent item of the current nav menu, which could be the active nav item
                // if we clicked on a button that has a submenu
                parentNavItem = this.collection.where({name: this.curNavParent})[0];
                // Walk up the tree, adding in each ancestor nav button
                while (parentNavItem) {
                    // Add the nav item
                    navItemView = self.getItemView(parentNavItem);
                    self.addItemView(parentNavItem, navItemView, 0);
                    currentItemIndex += 1;
                    // Give it the parent class
                    this.$el.find('[data-navid="' + parentNavItem.get('name') + '"]').addClass('parent');
                    self.$el.find('[data-navid="' + parentNavItem.get('name') + '"]').addClass(parentNavItem.get('type'));
                    // Continue walking
                    //Do not add the
                    if (parentNavItem.get('parent') === null) {
                        topParentId = parentNavItem.get('name');
                    }
                    parentNavItem = this.collection.where({name: parentNavItem.get('parent')})[0];
                }

                parentNavItem = this.collection.where({name: this.curNavParent})[0];
                // Add the item views of all the top domains
                _.each(self.collection.where({parent: null}), function (item, index) {
                    var currentItemFound = false, ItemView;
                    if (item.get('name') === topParentId) {
                        currentTopParentIndex = index;
                        _.each(self.collection.where({parent: topParentId}), function (item, index) {
                            if (item.get('name') !== self.curNavParent && parentNavItem.get('parent') !== null) {
                                ItemView = self.getItemView(item);
                                if (currentItemFound) {
                                    self.addItemView(item, ItemView, currentItemIndex);
                                } else {
                                    self.addItemView(item, ItemView, currentTopParentIndex + index + 1);
                                }
                                self.$el.find('[data-navid="' + item.get('name') + '"]').addClass(item.get('type'));
                                currentItemIndex += 1;
                            } else {
                                currentItemFound = true;
                            }
                        });
                    } else {
                        ItemView = self.getItemView(item);
                        if (currentTopParentIndex !== -1) {
                            self.addItemView(item, ItemView, currentItemIndex);
                        } else {
                            self.addItemView(item, ItemView, index);
                        }
                        self.$el.find('[data-navid="' + item.get('name') + '"]').addClass(item.get('type'));
                        currentItemIndex += 1;
                    }
                });
                // Add the "home" button
                //homeNavItemView = self.getItemView(self.collection.models[0]);
                //self.addItemView(self.collection.models[0], homeNavItemView, 0);
                //this.$el.find('[data-navid="home"]').addClass('parent');
            } else if (this.newMenu) { // If we're on "Home", light it up.
                Logger.debug("Menu : render curNavParent is null");
                this.$el.find('[data-navid="myInfo"]').addClass('active');
                this.newMenu = false;
            }

            // If the old nav was empty (i.e. this is the first time we're rendering), just replace it with this one
            if (this.$el.find('.old').length === 0) {
                Logger.debug("Menu : render .old not found");
                this.$el.find('.newly-created').removeClass('newly-created').addClass('old');
                self.preventAccess = false;
                Logger.log("Menu : preventAccess is TURNED OFF **********");
            } else {  // Otherwise compare the old to the new, and do some animations

                Logger.debug("Menu : render .old found");
                // Create a container to hold the new nav state
                newNav = $('<ul class="main-menu"></ul>');
                this.$el.find('.newly-created').appendTo(newNav);
                this.$el.addClass('old');

                // Get the list of old and new nav items
                oldNavItems = _.map(this.$el.children(), function (child) { return $(child).attr('data-navid'); });
                newNavItems = _.map(newNav.children(), function (child) { return $(child).attr('data-navid'); });

                // Ones that don't exist in the new nav will be sliding out
                itemsToSlideOut = _.difference(oldNavItems, newNavItems);
                // Ones that exist in both could be moving up or down
                itemsToMove = _.intersection(oldNavItems, newNavItems);
                // Ones that are new will be sliding in
                itemsToSlideIn = _.difference(newNavItems, oldNavItems);

                // Hide the new nav, then add it to the page.  We need it added to the DOM so that we can do positional
                // calculations on the nav item views.
                newNav.css({position: 'absolute', visibility: 'hidden'});
                $('.nav-items-region').append(newNav);

                // Function to move items that are in both the old and new nav state
                move = function (cb) {

                    // Function for moving an individual item
                    var moveItem = function (item, cb) {
                        var oldPosition, newPosition, itemEl;
                        oldPosition = $('.nav-items-region').find('li.old[data-navid="' + item + '"]').position();
                        newPosition = newNav.find('[data-navid="' + item + '"]').position();

                        if (oldPosition.top === newPosition.top) {
                            self.preventAccess = false;
                            Logger.log("Menu : preventAccess is TURNED OFF **********");
                            return cb();
                        }

                        // If they're different, animate the difference
                        if (oldPosition.top !== newPosition.top) {

                            itemEl = $('.nav-items-region').find('li.old[data-navid="' + item + '"]');

                            // Have to use inline styles here because the position is calculated
                            itemEl.css({
                                '-webkit-transition': '-webkit-transform ' + animationSpeed + 'ms ease-in-out',
                                '-webkit-transform': 'translate3d(0,' + (newPosition.top - oldPosition.top) + 'px,0)',
                                '-webkit-perspective': 1000
                            });

                            return cb();
                        }
                    };

                    // Move all items in parallel, wait for the animation to finish
                    // before continuning to the doSlideIn function
                    async.each(itemsToMove, moveItem, function (err) {
                        setTimeout(doSlideIn, animationSpeed);
                    });
                };

                // Function to slide out a single item; for use with setTimeout
                slideOut = function (itemId, cb) {
                    var item = $('.nav-items-region').find('li.old[data-navid="' + itemId + '"]');

                    // Add the class for transitioning left -250px
                    item.addClass('slideLeft');

                    // Wrap in a setTimeout to allow the animation to finish
                    setTimeout(function () {

                        // Remove tranisition class but first set the css position
                        // so it doesn't slide back into view
                        item.css({ left: '-250px' }).removeClass('slideLeft');

                        return cb();
                    }, animationSpeed);
                };

                // Function to slide in a single item; for use with setTimeout
                slideIn = function (itemId, cb) {
                    var item = $('.nav-items-region').find('li.old[data-navid="' + itemId + '"]');

                    // Add the class for transitioning right 250px
                    item.addClass('slideRight');

                    // Wrap in a setTimeout to allow the animation to finish
                    setTimeout(function () {

                        // Remove the leftPOS class so the element can slide out
                        // correctly when needed. Also remove the slideRight animation class
                        item.removeClass('leftPOS slideRight');

                        return cb();
                    }, animationSpeed);

                };

                // Function to slide in items -- the last step of the animation
                doSlideIn = function () {

                    // First, prepare the new (still hidden) nav block by moving all of the new nav items
                    // off screen
                    _.each(itemsToSlideIn, function (item) {
                        newNav.find('[data-navid="' + item + '"]').addClass('leftPOS');
                    });

                    // Now replace the old nav block with the new one
                    $('.nav-items-region .main-menu.old').replaceWith(newNav);
                    self.setElement(newNav);
                    self.$el.find('.newly-created').removeClass('newly-created').addClass('old');
                    newNav.css({position: 'relative', visibility: 'visible'});

                    // Allow 30ms for all the above to finish
                    setTimeout(function () {
                        async.each(itemsToSlideIn, slideIn, function () {});
                    }, 10);

                };

                // If we don't have any items to slide out, skip that step
                if (itemsToSlideOut.length === 0) {
                    move(function (err) {
                        self.preventAccess = false;
                        Logger.log("Menu : preventAccess is TURNED OFF **********");
                    });

                } else {  // Otherwise start sliding out the old nav items
                    // Slide out all elements in parallel
                    async.each(itemsToSlideOut, slideOut, function (err) {
                        Logger.debug("Menu : render Slide out ERROR");
                        move();
                        self.preventAccess = false;
                        Logger.log("Menu : preventAccess is TURNED OFF **********");
                    });
                }
            }

            this.triggerRendered();
            Logger.log("Menu : Leaving Render &&&&&&&&&&&&&&&");

            return this;
        },

        slideOutMenuItems: function () {},

        slideInMenuItems: function () {
            this.children.each(function (view) {
                view.slideIn();
            });
        },

        // Look throught the views for the selected View in the children object. Once we find
        // the view, proceed to remove the active class from any view after it. Since the views
        // are already in order this should remove the preceeding views correctly.
        markActiveViews: function (selectedView) {
            var foundView = false;
            this.children.each(function (child) {
                if (foundView) {
                    child.model.unset('active');
                    return;
                }

                if (selectedView.model.get('name') === child.model.get('name')) {
                    foundView = true;
                }
            });
        },

        // Overwrite Marionette closeChildren method to only remove the children who do not have a
        // true 'active' attribute on them.
        closeChildren: function () {
            // TODO: Place this here for now.
            // Could move it somewhere where it makes more sense
            this.children.each(function (child) {
                if (!child.model.get('active')) {
                    this.removeChildView(child);
                }
            }, this);
        },

        selectMenuItem: function (id) {
            var self = this, ItemView, menuNavItem, hashLocation;
            hashLocation = id.split("/");

            self.navigateToTheItem(hashLocation[0], function () {
                if (hashLocation[1]) {
                    self.navigateToTheItem(hashLocation[1], function () {
                        if (hashLocation[2]) {
                            self.navigateToTheItem(hashLocation[2]);
                        }
                    });
                }
            });

        },

        navigateToTheItem: function (id, callback) {
            var self = this, ItemView, menuNavItem;

            if (!self.preventAccess) {
                Logger.log("navigateToTheItem : preventAccess is Off id = " + id);
                menuNavItem = this.collection.where({name: id})[0];
                ItemView = self.children.findByModel(menuNavItem);
                ItemView.navigate();
                if (callback) {
                    setTimeout(callback, 600);
                }
            } else {
                Logger.log("navigateToTheItem : preventAccess is ON *****************");
                setTimeout(function () {
                    self.navigateToTheItem(id, callback);
                }, 20);
            }
        },

        clearMenu: function () {
            Logger.debug("MenuView : clear menu");
            this.$el.find(".service, .operation").animate({
                left: "-250px"
            }, 200, function () {
                $(this).remove();
            });
            this.$el.find(".parent, .active").removeClass("parent active");
        }

    });
});