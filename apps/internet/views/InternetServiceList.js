/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
define([
    'backbone.marionette',
    'apps/internet/views/InternetServiceOperationList'
], function (Marionette, InternetServiceOperationList) {
    'use strict';
    return Marionette.CollectionView.extend({
        itemView: InternetServiceOperationList
    });
});