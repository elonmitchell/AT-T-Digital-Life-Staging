/**
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define(['underscore', 'logger'], function (_, Logger) {
    'use strict';
    return {
        initialise: function () {
            Logger.debug("CacheLib: Initialise");
            if (typeof window.localStorage !== undefined) {
                return this;
            } else {
                Logger.error("CacheLib: Local storage not available ");
                return undefined;
            }
        },
        setItem: function (key, value, expires) {
            Logger.debug("CacheLib: Caching item " + key);
            try {
                this.setCacheItem(key, value, expires);
            } catch (error) {
                this.removeExpiredData();
                try {
                    this.setCacheItem(key, value, expires);
                } catch (err) {
                    Logger.error("CacheLib: Cache Full Exception");
                    throw this.cacheFullException();
                }
            }

        },
        setCacheItem: function (key, value, expires) {
            window.localStorage.setItem(key, value);
            if (expires && expires !== -1) {
                var expireDate = new Date().getTime() + (expires * 1000);
                window.localStorage.setItem(key + '_expires',  expireDate);
            }
        },
        removeExpiredData: function () {
            Logger.info("CacheLib: Removing expired data");
            var key,
                self = this;
            _.each(window.localStorage, function (key) {
                if (self.checkItemStatus(key) === -1) {
                    self.removeItem(key);
                }
            });
        },
        checkItemStatus: function (key) {
            var itemExpiry, currentTime = new Date().getTime();
            itemExpiry = (window.localStorage.getItem(key + '_expires'));
            if (itemExpiry) {
                if (new Date(itemExpiry) < currentTime) {
                    return -1;      //item is expired
                }
            }
            return 0;           //item is still valid
        },
        getItem: function (key) {
            Logger.debug("CacheLib: Fetching item " + key);
            var item = window.localStorage.getItem(key);
            if (!_.isUndefined(item)) {
                if (this.checkItemStatus(key) === -1) {
                    this.removeItem(key);   //check if still valid
                    return null;
                }
                return item;
            }
            Logger.error("CacheLib: Item " + key + "does not exist");
            return null;
        },
        removeItem: function (key) {
            Logger.debug("CacheLib: Removing item " + key);
            if (window.localStorage.getItem(key)) {
                window.localStorage.removeItem(key);
                var isTemp = window.localStorage.getItem(key + '_expires');
                if (isTemp) {
                    window.localStorage.removeItem(key + '_expires');
                }
                return key;
            } else {
                Logger.error("CacheLib: Item " + key + "does not exist");
                return null;
            }
        },
        clear: function () {
            Logger.warn("CacheLib: Clearing cache");
            window.localStorage.clear();
        },
        setCacheTime: function () {
            Logger.debug("CacheLib: Setting cache time");
            return new Date();
        },
        cacheItems: function (cacheData) {
            var self = this,
                itemsCached = "success";
            Logger.debug("CacheLib: Caching workflow data");
            _.each(cacheData, function (item) {
                try {
                    if (!_.isUndefined(item.id) && !_.isUndefined(item.value)) {
                        self.setItem(item.id, item.value, item.expires);
                    } else {
                        itemsCached = "failure";
                    }
                } catch (ex) {
                    Logger.error("CacheLib: flow data caching error check format " + ex);
                    itemsCached = "failure";
                }
            });
            return itemsCached;
        },
        cacheFullException : function () {
            return "QUOTA_EXCEEDED_ERR";
        }
    };
});