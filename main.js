/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
(function () {
    'use strict';
    require.config({
        paths: {
            'jquery':                   'libs/jquery',
            'jqueryui':                 'libs/jqueryui',
            'jquerybreadcrumb':         'libs/jquery.jBreadCrumb',
            'underscore':               'libs/underscore',
            'backbone':                 'libs/backbone',
            'backbone.relational':      'libs/backbone.relational',
            'backbone.marionette':      'libs/backbone.marionette',
            'backbone.touch':           'libs/backbone.touch',
            'logger':                   'libs/ssclogger',
            'basecollection':           'libs/base.collection',
            'basemodel':                'libs/base.model',
            'environment':              'libs/environment',
            'spin':                     'libs/spin/spin',
            'text':                     'libs/require/text',
            'tpl':                      'libs/require/tpl',
            'i18n':                     'libs/require/i18n',
            'css':                      'libs/require/css',
            'sideNav':                  'libs/sideNav',
            'async':                    'libs/async',
            'cache':                    'utilities/cache',
            'styles':                   'styles'
        },
        shim: {
            'underscore': {
                exports: '_'
            },
            'backbone': {
                deps: ['underscore', 'jquery'],
                exports: 'Backbone'
            },
            'backbone.relational': {
                deps: ['backbone'],
                exports: 'Backbone'
            },
            'backbone.marionette': {
                deps: ['backbone'],
                exports: 'Marionette'
            },
            'jqueryui' : ['jquery'],
            'jquerybreadcrumb' : ['jquery']
        }
    });
    var theme = window.Util.getTheme(window.location.search.substring(1));
    require.config({
        map: {
            '*': {
                'sscTheme':               'styles' + theme,
                'alertsTheme':            'apps/alerts/styles' + theme,
                'myInfoTheme':            'apps/myInfo/styles' + theme,
                'offlineTheme':           'apps/offline/styles' + theme,
                'api_testTheme':          'apps/api_test/styles' + theme,
                'cache_testTheme':        'apps/cache_test/styles' + theme,
                'suspended_flowsTheme':   'apps/suspended_flows/styles' + theme,
                'wifi_telemetryTheme':    'apps/wifi_telemetry/styles' + theme,
                'loginTheme':             'modules/login/styles' + theme,
                'offlineflowTheme':       'modules/offlineflow/styles' + theme,
                'workflowTheme':          'modules/workflow/styles' + theme
            }
        }
    });
    require([
        'logger',
        'app'
    ], function (Logger, App) {
        Logger.info("Main : Start Application");
        window.App = App;
        Logger.debug("Main - Query String = " + window.location.search.substring(1));
        window.App.qParams = window.Util.parseQueryString(window.location.search.substring(1));
        // Set our global client ID
        window.App.sessionGUID = window.Util.generateUUID();
        window.location.hash = "";
        App.start();
    });
}());
