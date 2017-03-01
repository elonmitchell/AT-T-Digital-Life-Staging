/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App,window,jQuery,$*/
define([
    'jqueryui',
    'backbone',
    'underscore',
    'backbone.marionette',
    'logger',
    'environment',
    'modules/login/views/Login',
    'modules/login/models/Login',
    'views/Dashboard',
    'collections/Events',
    'collections/WorkflowStepReport',
    'models/Account',
    'models/DebugLog',
    'models/Domain',
    'models/Service',
    'models/Operation',
    'views/Error',
    'modules/workflow/workflow',
    'i18n!nls/Messages'
], function (Dialog, Backbone, _, Marionette, Logger, Env, LoginView, LoginModel, DashboardView, EventCollection, StepReport, AccountModel, DebugLogModel, DomainModel, ServiceModel, OperationModel, ErrorView, Workflow, i18n) {
    'use strict';

    var animationDuration = 400;
    return Marionette.Controller.extend({
        _content: null,

        // Bootstrap the application
        initialize: function () {
            Logger.debug("AppController : initialize");

            // Bind global app events
            this._bindGlobalEvents();

            this._setupDebugLogger();
            this._setupReporting();
            this._setupLoginConfiguration();

            // Get the breadcrumb options
            this.breacCrumbCfg = {
                enable: false,
                maxCrumbs: parseInt(App.configuration.get('maxBreadCrumbs'), 10),
                compress: (App.configuration.get('compressBreadCrumbs') === "true"),
                reverse: (App.configuration.get('reverseBreadCrumbs') === "true")
            };

            //fix for iphone viewport
            if (navigator.userAgent.match(/iPad/i) === null && App.cordova) {
                // Let mobile viewport scroll to focused inputs
                var curViewport = $('meta[name="viewport"]').attr('content');
                $('meta[name="viewport"]').attr('content', curViewport.concat(", height=device-height"));
            }

            //Setup global settings for Ajax Error Handling
            this._configureGlobalAjaxHandler(this);

        },
        _setupDebugLogger: function () {
            // Create the debug logger. We need to start logging here
            // to capture the init sequence
            if (_.isUndefined(this.debugLogger)) {
                this.debugLogger = new DebugLogModel();
            }
            this.debugLogger.initDebugLogging();
            if (!_.isUndefined(window.App.qParams) &&
                    window.App.qParams.debug === "true") {
                this._startDebugLogging();
            }
        },
        _setupLoginConfiguration: function () {

            // Create the login model
            this.loginModel = new LoginModel();
            // Register for login and logout events on the login model
            this.loginModel.on("not_authenticated", this.onUnauthenticated, this);
            this.loginModel.on("logout", this.onLogout, this);
            this.loginModel.on("authenticated", this.onLogin, this);

            this.loginModel.set({
                loginPath: App.configuration.get('loginPath'),
                logoutPath: App.configuration.get('logoutPath'),
                validatePath: App.configuration.get('validatePath'),
                anonymousPath: App.configuration.get('anonymousPath'),
                protocol: App.configuration.get('protocol'),
                hostname: App.configuration.get('hostname'),
                port: App.configuration.get('port'),
                csrMode: (App.configuration.get('csrMode') === "true"),
                csrPort: App.configuration.get('csrPort'),
                xhrOptions: ((App.configuration.get('noCredentials') === "true") ? {} : {
                    withCredentials: true
                }),
                delay: 1000,
                username: App.configuration.get("username"),
                password: App.configuration.get("password"),
                allowGuestLogin: (App.configuration.get('allowGuestLogin') === "true")
            });

            if (!_.isUndefined(App.cafid)) {
                // Turn off allowGuestLogin, this is a safety
                // precaution in case it wasn't set properly
                // in Configuration.json
                App.configuration.set('allowGuestLogin', 'false');
                this.loginModel.set({
                    anonymousNotAllowed: true,
                    allowGuestLogin: false
                });
                // Set our registration properites
                this.loginModel.set('initParams', {
                    cafId: App.cafid,
                    macAddress: App.macAddress || "",
                    manufacturer: App.manufacturer || "",
                    friendlyName: App.name,
                    platform: App.platform,
                    clientVersion: App.configuration.get("version"),
                    osVersion: App.osVersion
                });
            }

        },
        _setupReporting: function () {
            // Create the reporting framework
            this.reporting = new StepReport(null, {
                postInterval: App.configuration.get('reportPostInterval'),
                xhrOptions: ((App.configuration.get('noCredentials') === "true") ? {} : {
                    withCredentials: true
                })
            });
        },
        _configureGlobalAjaxHandler: function (self) {

            // Global Ajax Error handler
            self.maxRetryAttempts = parseInt(App.configuration.get('requestRetryAttempts'), 10);
            self.requestRetryInterval = parseInt(App.configuration.get('requestRetryInterval'), 10);

            window.$(document).ajaxError(function (event, request, settings, errorText) {
                // TODO: Figure out why the PUTs are returning errors
                if (request.status === 200 && request.statusText === 'OK') {
                    // No error, no data returned from PUT
                    return;
                }
                Logger.error("AppController : Ajax Error detected - statusCode=" + request.status + " Error=" + errorText);
                if (settings.suppressErrors) {
                    return;
                }
                if (request.status === 401) {
                    Logger.debug("AppController : caught 401 ");
                    self.onSessionTimeout();
                } else if (request.status !== 404 && request.status !== 403) {
                    if (_.isUndefined(settings.retryCount)) {
                        settings.retryCount = 0;
                    }
                    if (settings.retryCount < self.maxRetryAttempts) {
                        Logger.debug("AppController : retryCount=" + settings.retryCount + " attempting request again");
                        settings.retryCount += 1;
                        window.setTimeout(function () {
                            Logger.debug("AppController : retrying request again");
                            window.$.ajax(settings);
                        }, self.requestRetryInterval);
                    } else {
                        // We can't perform our operation so show an error page
                        Logger.error("AppController : Showing error page");
                        var errorView = new ErrorView({errorMessage: i18n.get('errorMsg'), requestError: request.statusText});
                        App.vent.trigger('dashboard:showView', errorView, 'images/warning.png', i18n.get('errorTitle'));
                    }
                }
            });

            // Determine the request timeout
            var timeout = App.configuration.get('requestTimeout');
            if (!_.isUndefined(timeout)) {
                timeout = parseInt(timeout, 10);
            } else {
                timeout = 45000;
            }
            // Set request timeout
            $.ajaxSetup({
                timeout: timeout
            });
        },
        _bindGlobalEvents: function () {
            App.vent.on("logout", this.logout, this);
            App.vent.on("authenticationRequired", this.authenticationRequired, this);
            App.vent.on("events:authError", this.onSessionTimeout, this);
            App.vent.on("dashboard:showView", this._showDashboardView, this);
            App.vent.on("dashboard:sessionTimeout:continue", this.onAutoLogout, this);
            App.vent.on("workflow:error", this._processWorkflowError, this);
            App.vent.on("workflow:step:suspended", this._processWorkflowSuspend, this);
            App.vent.on("dashboard:menu-loaded", this._appLoadComplete, this);
            App.vent.on("domains:loaded", this.offlineLoadComplete, this);
            App.vent.on("initialization:timeout", this._processInitTimeout, this);
            App.vent.on('offline', this.launchOffline, this);
        },
        // this function is called when the menus are loaded and app is ready to display content
        _appLoadComplete: function () {
            // Check to see if we have an operation to run
            if (!_.isUndefined(App.qParams.goto)) {
                if (App.configuration.get('csrMode') === "true") {
                    // domain%2Fservice%2Foperation
                    App.router.navigate(App.qParams.goto, {
                        trigger: true,
                        replace: true
                    });
                } else {
                    this.dashboardView.selectMenuItem(App.qParams.goto);
                }
            } else {
                App.vent.trigger("AppController:appLoadComplete");
            }
        },
        _showDashboardView: function (view, icon, title) {
            if (!_.isNull(this.dashboardView) && !_.isUndefined(this.dashboardView)) {
                // Slide away dashboard content while app loads
                this.dashboardView.hide({
                    duration: animationDuration
                });

                this.dashboardView.display({
                    duration: animationDuration,
                    view: view,
                    icon: icon,
                    title: title
                });
            }
        },
        logout: function () {
            Logger.debug("AppController : logout");
            if (this.loginModel !== null) {
                this.loginModel.logout();
            } else {
                Logger.error("AppController : Login model does not exist");
            }
        },
        onLogout: function () {
            Logger.debug("AppController : onLogout");
            // Clean up (mainly stop the events)
            this._destroySession();

            // Navigate home page causing a validate to occur
            App.router.navigate("", {trigger: true, replace: true});
        },
        onSessionTimeout: function () {
            if (!_.isUndefined(this.dashboardView) &&
                    this.loginModel.get('state') === 'AUTHENTICATION_SUCCESS') {
                Logger.debug("AppController : onSessionTimeout - Showing session timeout dialog.");
                // Show session timeout dialog
                this.dashboardView.showSessionTimeoutDialog();
            } else {
                Logger.debug("AppController : onSessionTimeout - Dashboard not created yet, showing login page");
                this.onAutoLogout();
            }
        },
        onAutoLogout: function () {
            Logger.debug("AppController : onAutoLogout");
            // Reset anonymous flag in Login model so that we show the
            // correct login view
            if (!_.isUndefined(this.loginModel) && this.loginModel !== null) {
                this.loginModel.set("anonymous", false);
            }

            // Clean up (mainly stop the events)
            this._destroySession();
            // Navigate to the login view
            // We call directly showLogin because when the session time out occurs
            // we may already displaying the login view (to switch from
            // anonymous to authenticated user). In this case we should refresh
            // the login view and I have not found a backbony way to do it.
            //App.router.navigate("login", {trigger: true, replace: true});
            this.showLogin();
        },
        onUnauthenticated: function () {
            Logger.debug("AppController : onUnauthenticated");

            // Navigate to the login view
            App.router.navigate("login", {
                trigger: true,
                replace: true
            });
        },
        onLogin: function () {
            Logger.debug("AppController : onLogin");

            // Make sure we are clean before starting up
            this._destroySession();


            // Set the subscriber Id in the reporting framework
            if (_.isUndefined(App.cafid)) {
                this.reporting._setUserId(this.loginModel.get("subscriberId"));
            } else {
                App.stopConnectionCheck();
            }

            //start reporting
            this.reporting.startReporting();

            // Start the event fetching
            if (_.isNull(this.eventCollection) || _.isUndefined(this.eventCollection)) {
                this.eventCollection = new EventCollection();
            }
            this.eventCollection.start(this.loginModel.get("sessionId"));

            if (!_.isUndefined(this.dashboardView) || !_.isNull(this.dashboardView)) {
                this.dashboardView = null;
            }

            // Setup the Account Model with the proper data
            this.accountModel = new AccountModel();
            this.accountModel.set('subscriberId', this.loginModel.get("subscriberId"));
            // Set the anonymous property on the account
            this.accountModel.set("anonymous", false);
            if (this.loginModel.get("anonymous") === true) {
                this.accountModel.set("anonymous", true);
            }

            this._initDashboard();

            var data = {};

            if (_.isUndefined(App.qParams.skipInitFlow)) {
                // Listen for our workflowComplete signifying the initialization flow
                // has ran
                App.vent.on("workflowComplete", this._onAccountChange, this);
            } else if (!_.isUndefined(App.qParams.workflow)) {
                if (!_.isUndefined(App.qParams.wfParams)) {
                    data = JSON.parse(App.qParams.wfParams);
                }
                this.dashboardView.repopulate();

                _.defer(function (self) {
                    self.launchWorkflowOperation({
                        operation: new OperationModel({
                            operationName: App.qParams.workflow,
                            type: 'workflow'
                        }),
                        icon: 'images/nav/icon_wifi.png',
                        title: App.qParams.workflow,
                        data: data
                    });
                }, this);
            } else {
                Logger.error('AppController:onLogin - skipInitFlow specified but no workflow ran!');
            }
        },
        _startDebugLogging: function () {
            var level = 4,
                postInterval = 60000,
                maxLogSize = 5120;
            if (!_.isUndefined(window.App.qParams) &&
                    window.App.qParams.debug === "true") {
                // Read configuration from Configuration.json
                level = parseInt(App.configuration.get('logLevel'), 10);
                maxLogSize = parseInt(App.configuration.get('maxLogSize'), 10);
                postInterval = parseInt(App.configuration.get('logPostInterval'), 10);
                if (App.configuration.get('logAjax') === "true") {
                    window.$(document).ajaxSend(function (event, jqxhr, settings) {
                        Logger.debug("ajaxSend handler for " + settings.url);
                    });
                    window.$(document).ajaxComplete(function (event, xhr, settings) {
                        Logger.debug("ajaxComplete handler for " + settings.url);
                    });
                }
            } else {
                if (!_.isUndefined(this.accountModel.attributes.attributes.logLevel)) {
                    level = parseInt(this.accountModel.attributes.attributes.logLevel, 10);
                }
                if (!_.isUndefined(this.accountModel.attributes.attributes.maxLogSize)) {
                    maxLogSize = parseInt(this.accountModel.attributes.attributes.maxLogSize, 10);
                }
                if (!_.isUndefined(this.accountModel.attributes.attributes.logPostInterval)) {
                    postInterval = parseInt(this.accountModel.attributes.attributes.logPostInterval, 10);
                }
                if (this.accountModel.attributes.attributes.logAjax === "true") {
                    window.$(document).ajaxSend(function (event, jqxhr, settings) {
                        Logger.debug("ajaxSend handler for " + settings.url);
                    });
                    window.$(document).ajaxComplete(function (event, xhr, settings) {
                        Logger.debug("ajaxComplete handler for " + settings.url);
                    });
                }
            }
            if (_.isUndefined(this.debugLogger)) {
                this.debugLogger = new DebugLogModel();
            }
            if (!_.isUndefined(this.loginModel)) {
                this.debugLogger.set({subscriberId: this.loginModel.get('subscriberId')});
            }

            this.debugLogger.start(level, postInterval, maxLogSize);
            Logger.info("AppControlller: _startDebugLogging - Starting the debug logger");
        },
        _stopDebugLogging: function () {
            // Flush the log to the server
            // Turn off debug logging
            // Delete debug log model
            if (!_.isUndefined(this.debugLogger) && !_.isNull(this.debugLogger)) {
                Logger.info("AppControlller: _stopDebugLogging - Stopping the debug logger");
                this.debugLogger.stop();
            }
        },
        _destroySession: function () {
            if (this.loginModel.has('debugLog')) {
                this._stopDebugLogging();
            }
            // Stop event collection
            if (!_.isUndefined(this.eventCollection) && !_.isNull(this.eventCollection)) {
                this.eventCollection.stop();
                this.eventCollection = null;
            }

            // Stop Reporting
            this.reporting.stopReporting();

            // Trigger destroy session event so other modules
            // can clean up
            App.vent.trigger('application:destroy:session');
            if (!_.isUndefined(window.App.workflowManager)) {
                window.App.workflowManager.removeAllControllers();
            }

            //listen for connection change on mobile
            if (!_.isUndefined(App.cordova)) {
                App.startConnectionCheck();
            }

            // If the account model exists destroy
            if (!_.isUndefined(this.accountModel) && this.accountModel !== null) {
                // Loop through and unregister all models from the
                // Backbone.Relational store. This is so we get all
                // models registered in the events correctly.
                var domains = this.accountModel.get('domains'),
                    devices = this.accountModel.get('devices'),
                    name,
                    moduleName;
                if (!_.isUndefined(domains) && !_.isNull(domains)) {
                    // loop through and remove the domains so the Apps get
                    // removed also. If we call reset only, the Apps don't
                    // get removed and this causes issues when switching
                    // users
                    domains.forEach(function (domain) {
                        // Remove the domain app and domain
                        name = domain.get('name');
                        moduleName = domain.attributes.attributes.moduleName;
                        if (!_.isUndefined(moduleName) && !_.isNull(moduleName)) {
                            Logger.debug("Unload moduleName attributes ======== " + moduleName);
                            name = moduleName;
                        }

                        require.undef('apps/' + name + '/' + name);
                    });
                }
                this.accountModel.get('domains').reset();
                this.accountModel.get('devices').reset();
                this.accountModel.clear({silent: true});
                this.accountModel = null;
                Backbone.Relational.store.reset();
                App.vent.off();
                this._bindGlobalEvents();
            }
        },
        _onAccountChange: function (self) {
            Logger.debug("AppController : Account Changed: " + JSON.stringify(this.accountModel));
            App.vent.off("workflowComplete", this._onAccountChange, this);
            var domains,
                model = this.accountModel,
                errorView;

            // Check to see if debug logging is requested. If it is, setup and
            // start logging
            if ((!_.isUndefined(this.accountModel.attributes.attributes) &&
                this.accountModel.attributes.attributes.debugLog === "true") ||
                    ((!_.isUndefined(window.App.qParams) &&
                    window.App.qParams.debug === "true"))) {
                this._stopDebugLogging(); // Reset in case debugLog query param was used
                this._startDebugLogging();
            } else if (_.isUndefined(window.App.qParams) || _.isUndefined(window.App.qParams.debug)) {
                this._stopDebugLogging();
            }

            // If the accountModel object comes back with an error set in it's attributes,
            // display the communications error.
            if (!_.isUndefined(this.accountModel.attributes.attributes) && this.accountModel.attributes.attributes.InitializationError) {
                Logger.error("AppController - _onAccountChange: Showing error page");
                errorView = new ErrorView({errorMessage: i18n.get('errorInitMessage'), requestError: i18n.get('errorInitError')});
                App.content.show(errorView);
            } else {
                // If we have already fetched the domains,
                // start loading since we will not get the reset event
                domains = model.get("domains");
                if (domains.length !== 0) {
                    this._loadDomainApps(domains);
                } else {
                    domains.on("reset", this._loadDomainApps, this);
                }
            }
        },
        // Load the services for a domain
        _loadServices: function (domain, success) {
            var name = domain.get('name'),
                services,
                incompatibleServices = [],
                length = 0,
                self = this;

            // Fetch the services for the domain
            services = domain.get('services');

            if (services) {
                services.fetch({
                    success: function servicesFetched() {
                        Logger.debug("Domain Services Loaded for " + name + " services.length = " + services.length);

                        // Remove services that are not mobile compatible
                        services.each(function (service) {
                            if (!_.isUndefined(service.attributes.attributes) && self.isDeviceIncompatible(service)) {
                                incompatibleServices.push(service);
                            } else {
                                self._parseAttributeProperties(service);
                            }
                        });
                        services.remove(incompatibleServices);

                        if (services.length === 0) {
                            success();
                        }

                        services.forEach(function (service) {
                            length = services.length;
                            service.type = "service";

                            var operations = service.get('operations'),
                                incompatibleOperations = [];
                            if (operations && operations.url) {
                                Logger.debug("Loading operations for service: ", service);
                                operations.fetch({
                                    success: function (model, response, options) {
                                        length -= 1;
                                        Logger.debug("AppController : Fetched operations for " + service.get('name'));
                                        operations.each(function (operation) {
                                            if (!_.isUndefined(operation.attributes.attributes) && self.isDeviceIncompatible(operation)) {
                                                incompatibleOperations.push(operation);
                                            } else {
                                                self._parseAttributeProperties(operation);
                                            }
                                        });
                                        operations.remove(incompatibleOperations);

                                        // Set operation type attribute and parent
                                        operations.each(function (operation) {
                                            operation.type = "operation";
                                        });
                                        if (length === 0) {
                                            success();
                                        }
                                    },
                                    error: function (model, response, options) {
                                        length -= 1;
                                        Logger.error("AppController : Failed to get operations for " + service.get('name'));
                                        if (length === 0) {
                                            success();
                                        }
                                    }
                                });
                            }
                        });
                    },
                    error: function () {
                        Logger.warn("Domain Services Failed to Load");
                        success();
                    }
                });
            }
        },
        // Load the domain app logic code
        // as well as the domain itself, and its services and operations
        _loadDomainApp: function (domain, success, error) {
            var  moduleName = domain.attributes.attributes.moduleName, name = domain.get('name'), self = this;
            if (!_.isUndefined(moduleName) && !_.isNull(moduleName)) {
                Logger.debug("moduleName attributes ======== " + moduleName);
                name = moduleName;
            }
            require(
                ['apps/' + name + '/' + name],

                function (DomainApp) {
                    Logger.debug("AppController : Loading Domain App: " + name);
                    // Need to check DomainApp parameter is valid. On IE8, require
                    // is calling the load success function when it fails to load the app
                    if (_.isUndefined(DomainApp)) {
                        Logger.error("Failed to load domain application " + name);
                        // Load services for domain
                        self._loadServices(
                            domain,
                            function () {
                                success();
                            }
                        );
                    } else {
                        DomainApp.off("initialize:before");
                        DomainApp.on("initialize:before", function fetchServices(options) {
                            Logger.debug("Application Initialized");
                            // Set domain type attribute
                            domain.type = "domain";
                            // Load services for domain
                            Logger.debug("Loading Services for the domain " + name);
                            // Fetch the services for the domain
                            self._loadServices(
                                domain,
                                function () {
                                    success();
                                }
                            );
                        });
                        // Initialize the Marionnete app
                        DomainApp.start({
                            model: domain
                        });
                    }
                },
                // App couldn't be loaded
                function appFailedToLoad(err) {
                    Logger.error("Failed to launch domain application " + name + ": " + err);
                    // Load services for domain
                    self._loadServices(
                        domain,
                        function () {
                            success();
                        }
                    );
                }
            );
        },
        _unloadDomainApp: function (domain, success, error) {
            var moduleName = domain.attributes.attributes.moduleName, name = domain.get('name');
            if (!_.isUndefined(moduleName) && !_.isNull(moduleName)) {
                Logger.debug("unloadingDomainApp moduleName attributes ======== " + moduleName);
                name = moduleName;
            }
            Logger.info("Unloading domain App " + name);
            require.undef('apps/' + name + '/' + name);
        },
        _loadDomainApps: function (domains) {
            Logger.debug("AppController : _loadDomainApps");
            var self = this,
                length = 0;

            domains.off("reset", self._loadDomainApps, self);

            // Remove domains that are not mobile compatible
            this.incompatibleDomains = [];
            domains.each(function (domain) {
                if (!_.isUndefined(domain.attributes.attributes) && self.isDeviceIncompatible(domain)) {
                    self.incompatibleDomains.push(domain);
                } else {
                    self._parseAttributeProperties(domain);
                }
            });
            if (this.incompatibleDomains.length > 0) {
                domains.remove(this.incompatibleDomains);
            }

            length = domains.length;
            domains.on("add", self._loadDomainApp, self);
            domains.on("remove", self._unloadDomainApp, self);

            if (length === 0) {
                this.appLoadComplete();
            }

            domains.forEach(function (domain) {
                self._loadDomainApp(
                    domain,
                    function () {
                        Logger.debug("Domain app (" + domain.id + ") was loaded.");
                        length = length - 1;
                        if (length === 0) {
                            self.appLoadComplete();
                        }
                    },
                    function (err) {
                        Logger.debug("Domain app (" + domain.id + ") was NOT loaded.");
                        length = length - 1;
                        if (length === 0) {
                            self.appLoadComplete();
                        }
                    }
                );
            });
        },
        _parseAttributeProperties: function (model) {
            if (model.attributes.attributes) {
                if (model.attributes.attributes.operationParameters && !_.isEmpty(model.attributes.attributes.operationParameters) &&
                        _.isString(model.attributes.attributes.operationParameters)) {
                    try {
                        model.attributes.attributes.operationParameters = JSON.parse(model.attributes.attributes.operationParameters);
                    } catch (ex) {
                        Logger.error("AppController:_parseAttributeProperties - parse error for operationParameters - " + ex);
                    }
                }
                if (model.attributes.attributes.mobileInclude && !_.isEmpty(model.attributes.attributes.mobileInclude) &&
                        _.isString(model.attributes.attributes.mobileInclude)) {
                    try {
                        model.attributes.attributes.mobileInclude = JSON.parse(model.attributes.attributes.mobileInclude);
                    } catch (ex1) {
                        Logger.error("AppController:_parseAttributeProperties - parse error for mobileInclude - " + ex1);
                    }
                }
                if (model.attributes.attributes.mobileExclude && !_.isEmpty(model.attributes.attributes.mobileExclude) &&
                        _.isString(model.attributes.attributes.mobileExclude)) {
                    try {
                        model.attributes.attributes.mobileExclude = JSON.parse(model.attributes.attributes.mobileExclude);
                    } catch (ex2) {
                        Logger.error("AppController:_parseAttributeProperties - parse error for mobileExclude - " + ex2);
                    }
                }
            }
        },
        // Domain apps have finished (re)loading
        appLoadComplete: function () {
            Logger.debug("AppController : appLoadComplete");
            Logger.debug("********************************************");
            var cacheInfo,
                domains,
                currentTime,
                month,
                day,
                minutes,
                errorView;
            if (!_.isUndefined(App.cache)) {
                currentTime = App.cache.setCacheTime();
                month = currentTime.getUTCMonth() + 1;
                day = currentTime.getUTCDate();
                minutes = currentTime.getUTCMinutes();
                cacheInfo = (month < 10 ? '0' : '') + month + "/" + (day < 10 ? '0' : '') + day + "/" +
                    currentTime.getUTCFullYear() + " " + currentTime.getUTCHours() + ":" + (minutes < 10 ? '0' + minutes : minutes);
                Logger.debug('adding cache time ' + cacheInfo);
                this.accountModel.set("cacheTime", cacheInfo);
                Logger.info("AppController - caching data ");
                App.cache.setItem('ssc.core.accountModel', JSON.stringify(this.accountModel.toJSON()));
            }
            domains = this.accountModel.get('domains');

            // If the accountModel object comes back with an error set in it's attributes,
            // display the communications error.We check here to make sure we catch any
            // error in the initialization flow
            if (!_.isUndefined(this.accountModel.attributes.attributes) &&
                    this.accountModel.attributes.attributes.InitializationError) {
                Logger.error("AppController appLoadComplete : Showing error page");
                errorView = new ErrorView({errorMessage: i18n.get('errorInitMessage'), requestError: i18n.get('errorInitError')});
                App.content.show(errorView);
            } else {
                // Make sure we have removed our incompatible domains
                // For some reason, the removal in _loadDomainApps get
                // overwritten and the domains reappear
                if (this.incompatibleDomains.length > 0) {
                    domains.remove(this.incompatibleDomains, {silent: true});
                }
                if (App.configuration.get('enableSuspendResume') === "true" &&
                        this.accountModel.get("anonymous") !== true) {
                    App.vent.trigger("suspendedFlows:fetch");
                }
                domains.trigger('ready');
            }
        },
        // offline is done loading
        offlineLoadComplete: function (accountModel) {
            Logger.debug("AppController : offlineLoadComplete");
            this.accountModel = accountModel;
            this.accountModel.set("anonymous", false);
            var domains = this.accountModel.get('domains');
            this._initDashboard();
            domains.trigger('ready');    //populate the menu
        },
        // Determine user's logged in/out status
        validateLogin: function () {
            Logger.debug("AppController : validateLogin");
            this.loginModel.validate();
        },
        checkConnectivity: function () {
            Logger.debug("AppController : checking status");
            if (App.cordova && !App.isOnline) {
                this.launchOffline();
            } else {
                App.router.navigate("validateLogin", {trigger: true, replace: true});
            }

        },
        launchOffline: function () {
            var self = this;

            Logger.debug("AppController : Loading Domain App: offline");

            require(
                ["apps/offline/offline"],

                function (OfflineApp) {
                    Logger.debug("AppController : Loading Offline App");

                    OfflineApp.off("initialize:before");
                    OfflineApp.on("initialize:before", function () {
                        Logger.debug("AppController : starting offline app");
                        if (!_.isUndefined(self.dashboardView) || !_.isNull(self.dashboardView)) {
                            self.dashboardView = null;
                        }
                    });
                    OfflineApp.on("start", function () {
                        OfflineApp.router.navigate("offline", {trigger: true, replace: true});
                    });
                    // Initialize the Marionnete app
                    OfflineApp.start({
                        stepReport: self.reporting,
                        dashboardView: self.dashboardView
                    });
                },
                // App couldn't be loaded
                function appFailedToLoad(err) {
                    Logger.error("AppController : Failed to launch offline application : " + err);
                }
            );
        },
        authenticationRequired: function () {
            Logger.debug("AppController: authenticationRequired - Redirecting to Login.");

            // Suspend the event fetching
            if (!_.isUndefined(this.eventCollection) && !_.isNull(this.eventCollection)) {
                this.eventCollection.suspend();
            }

            // Navigate to the login view
            _.defer(function () {
                App.router.navigate("login", {trigger: true, replace: true});
            });
        },
        // Display the login experience
        showLogin: function () {
            Logger.debug("AppController : showLogin");

            // Create and show the login view
            var self = this,
                view = new LoginView({
                    model: this.loginModel,
                    usernameRegex: App.configuration.get('usernameRegex'),
                    passwordRegex: App.configuration.get('passwordRegex')
                });

            if (!_.isUndefined(this.accountModel) && !_.isNull(this.accountModel) &&
                    this.accountModel.get("anonymous") === true) {

                // Slide away dashboard content while app loads
                self.dashboardView.hide({
                    duration: animationDuration
                });

                window.setTimeout(function () {
                    self.dashboardView.display({
                        duration: animationDuration,
                        view: view,
                        title: i18n.get("authTitle")
                    });
                }, animationDuration);
            } else {
                App.content.show(view);
                if (!Env.isDesktopBrowser()) {
                    try {
                        /* Hide the splashscreen */
                        Logger.info("Hide Splash Screen showLogin");
                        navigator.splashscreen.hide();
                    } catch (e) {
                        Logger.warn("Cannot hide splashscreen");
                    }
                }
            }

            //view.focusOnUsername();


        },

        _initDashboard: function () {
            Logger.debug("AppController : _initDashboard");
            // Create and show the dashboard view
            this.dashboardView = new DashboardView({
                model: this.accountModel
            });
            App.content.show(this.dashboardView);
        },

        launchDomainService: function (domain, service) {
            Logger.debug("AppController : launchDomainService");
        },
        // Launch a service operation workflow
        launchServiceOperation: function (domain, service, operation) {
            Logger.debug("AppController : Launch Service Operation");

            var domains,
                currentDomain,
                services,
                currentService,
                operations,
                currentOperation,
                parsedParameters,
                headerTitle,
                resumeFlow = false,
                workflowData = {anonymous: this.accountModel.get('anonymous') === true ? "true" : "false"},
                self = this;

            domains = self.accountModel.get("domains");
            currentDomain = domains.get(decodeURI(domain));

            services = currentDomain.get("services");
            currentService = services.get(decodeURI(service));

            operations = currentService.get("operations");
            currentOperation = operations.get(decodeURI(operation));

            // Check for authentication required and if we are
            // anonymous, prompt for login
            if (currentOperation.attributes.attributes.authenticationRequired === "yes" &&
                    this.accountModel.get("anonymous") === true) {
                Logger.debug("launchServiceOperation: Unauthenticated user and authentication required. Going to login.");
                this.authenticationRequired();
            } else {
                // Set isCSRFlow property
                workflowData.isCSRFlow = App.configuration.get('csrMode') === "true";
                this.breacCrumbCfg.enable = false;

                // Set Workflow operationParameters
                if (!_.isUndefined(currentOperation.attributes.attributes.operationParameters)) {
                    try {
                        parsedParameters = JSON.parse(currentOperation.attributes.attributes.operationParameters);
                    } catch (e) {
                        Logger.warn("App Controller : Cannot JSON Parse operationParameters ");
                    }
                    if (parsedParameters) {
                        _.extend(workflowData, parsedParameters);
                    }
                }

                // Add resume data if present
                if (!_.isUndefined(currentOperation.attributes.attributes)) {
                    if (!_.isUndefined(currentOperation.attributes.attributes.executionId)) {
                        workflowData.executionId = currentOperation.attributes.attributes.executionId;
                        resumeFlow = true;
                    }
                    if (!_.isUndefined(currentOperation.attributes.attributes.executionEnvironmentId)) {
                        workflowData.executionEnvironmentId = currentOperation.attributes.attributes.executionEnvironmentId;
                    }  //TODO: Check for the correct platform combination
                    if (!_.isUndefined(currentOperation.attributes.attributes.stepTrail)) {
                        if ((currentOperation.attributes.attributes.stepTrail === "desktop") ||
                                (currentOperation.attributes.attributes.stepTrail === "all")) {
                            this.breacCrumbCfg.enable = true;
                        }
                    }
                }
                // different title for mobile and tablet
                // TODO: better user agent detection.
                if ($(window).width() <= 480) {
                    headerTitle = currentService.get('name');
                    //currentDomain.get('name');
                } else {
                    headerTitle = currentService.get('name') + ' - ' + currentOperation.get('name');
                }
                this.launchWorkflowOperation({
                    operation: currentOperation,
                    icon: currentDomain.get('imageUrl') || 'images/nav/icon_newitem.png',
                    title: headerTitle,
                    data: workflowData
                });

                if (resumeFlow) {
                    App.vent.trigger("suspendedFlows:remove", currentOperation);
                }
            }
        },
        // Launch an operation
        launchWorkflowOperation: function (options) {
            Logger.debug("AppController : Launch Service Operation");

            var self = this,
                wfData = {"operationType": "get", "anonymous": this.accountModel.get('anonymous') === true ? "true" : "false"};

            if (options.data !== undefined) {
                wfData = options.data;
                wfData.operationType = "get";
            }
            if (!_.isUndefined(App.platform)) {
                wfData.platform = App.platform;
                wfData.manufacturer = App.manufacturer || "";
                wfData.model = App.model || "";
            }

            // Slide away dashboard content while app loads
            self.dashboardView.hide({
                duration: animationDuration
            });

            window.setTimeout(function () {

                if (options.operation && options.operation.get("type") === "workflow") {

                    self.workflowController = Workflow.create({
                        baseURL: App.getURLRoot(),
                        name: options.operation.get("operationName"),
                        subscriberId: self.accountModel.get("subscriberId"),
                        enableSuspendResume: App.configuration.get('enableSuspendResume') === "true",
                        breadCrumbCfg: self.breacCrumbCfg,
                        data: wfData
                    });

                    self.workflowController.on('done', self._processDoneStep, self);
                    self.workflowController.on('error', self._processErrorStep, self);

                    self.workflowController.start();

                    // Display device page
                    self.dashboardView.display({
                        node: true,
                        view: self.workflowController.getView(),
                        duration: animationDuration,
                        icon: options.icon,
                        title: options.title
                    });
                } else {
                    Logger.error("Operation : Operation type " + options.operation.get("type") + " not supported");
                }

            }, animationDuration);
        },
        _processDoneStep: function () {
            // Trigger event to resize leaf node in dashboard view
            App.vent.trigger('dashboard:shrink');
        },
        _processErrorStep: function () {
            Logger.error("AppController:_processErrorStep - Error during workflow execution.");
            // Trigger event to resize leaf node in dashboard view
            App.vent.trigger('dashboard:shrink');

            this.workflowController.stop();
            this.workflowController = null;
            var errorView = new ErrorView({errorMessage: i18n.get('workflowErrorStepMsg'), requestError: ''});
            App.vent.trigger('dashboard:showView', errorView, 'images/nav/icon_wifi.png', i18n.get('errorTitle'));
        },
        _processWorkflowError: function (error) {
            Logger.info("AppController: Process Workflow Error");

            this.workflowController = null;
            var errorView = new ErrorView({errorMessage: i18n.get('workflowErrorMsg'), requestError: error});
            App.vent.trigger('dashboard:showView', errorView, 'images/nav/icon_wifi.png', i18n.get('errorTitle'));
        },
        _processWorkflowSuspend: function (step) {
            Logger.debug("AppController: Process Workflow Suspended");
            var self = this;
            step.set('handled', true);
            _.defer(function () {
                self.workflowController = null;
                App.vent.trigger("suspendedFlows:fetch", step);
            });
            // Go to Home Screen
            App.vent.trigger("AppController:appLoadComplete");
            this.dashboardView.selectMenuItem('myInfo');
        },
        _processInitTimeout: function (error) {
            Logger.debug("AppController: Process Initialization Timeout");
            var errorView = new ErrorView({errorMessage: i18n.get('workflowErrorMsg'), requestError: error});
            App.content.show(errorView);
        },
        isDeviceIncompatible: function (definition) {
            var filterIncompatible = false;
            this._parseAttributeProperties(definition);
            if (_.isUndefined(definition.attributes.attributes.mobileAppOnly) ||
                    _.isEmpty(definition.attributes.attributes)) {
                // This definition doesn't have any attributes or is an alert so assume compatability
                return false;
            }
            // If on fixed portal, check if we are compatible
            if (Env.isDesktopBrowser()) {
                if (definition.attributes.attributes.enablePortal === 'mobile' ||
                        definition.attributes.attributes.enablePortal === 'none' ||
                        definition.attributes.attributes.mobileAppOnly.toLowerCase() === "yes") {
                    return true;
                }
                // We are on a desktop, so return whether it is for mobileAppOnly
                return false;
            }
            // If on mobile portal, check if we are compatible
            if (_.isUndefined(window.App.cafid)) {
                if (definition.attributes.attributes.enablePortal === 'fixed' ||
                        definition.attributes.attributes.enablePortal === 'none') {
                    return true;
                }
                return definition.attributes.attributes.mobileCompatible === "no";
            }
            if (definition.attributes.attributes.mobileInclude && !_.isEmpty(definition.attributes.attributes.mobileInclude) && !_.isUndefined(App.cafid)) {
                filterIncompatible = this.includeDeviceFilter(definition.attributes.attributes.mobileInclude);
            } else if (definition.attributes.attributes.mobileExclude && !_.isEmpty(definition.attributes.attributes.mobileExclude) && !_.isUndefined(App.cafid)) {
                filterIncompatible = this.excludeDeviceFilter(definition.attributes.attributes.mobileExclude);
            }
            return (definition.attributes.attributes.mobileCompatible === "no" ||
                ((_.isUndefined(App.cafid) && (definition.attributes.attributes.mobileAppOnly === "yes")) || (!_.isUndefined(App.cafid) && filterIncompatible ? filterIncompatible : false)));
        },
        includeDeviceFilter: function (filter) {
            var notCompatible = false,
                index,
                platforms,
                models,
                manufacturers;

            if (!_.isUndefined(filter.platform)) {
                platforms = filter.platform.split(",");
                for (index = 0; index < platforms.length; index += 1) {
                    if (!_.isUndefined(window.App.platform)) {
                        if (window.App.platform.toLowerCase() === platforms[index].toLowerCase()) {
                            notCompatible = notCompatible && false;
                            break;
                        } else {
                            notCompatible = notCompatible || true;
                        }
                    }
                }

            }
            if (!_.isUndefined(filter.model)) {
                models = filter.model.split(",");
                for (index = 0; index < models.length; index += 1) {
                    if (!_.isUndefined(window.App.modelName)) {
                        if (window.App.modelName.toLowerCase() === models[index].toLowerCase()) {
                            notCompatible = notCompatible && false;
                            break;
                        } else {
                            notCompatible = notCompatible || true;
                        }
                    }
                }
            }
            if (!_.isUndefined(filter.manufacturer)) {
                manufacturers = filter.manufacturer.split(",");
                for (index = 0; index < manufacturers.length; index += 1) {
                    if (!_.isUndefined(window.App.manufacturer)) {
                        if (window.App.manufacturer.toLowerCase() === manufacturers[index].toLowerCase()) {
                            notCompatible = notCompatible && false;
                            break;
                        } else {
                            notCompatible = notCompatible || true;
                        }
                    }
                }
            }
            return notCompatible;
        },
        excludeDeviceFilter: function (filter) {
            var notCompatible = false,
                index,
                platforms,
                models,
                manufacturers;

            if (!_.isUndefined(filter.platform)) {
                platforms = filter.platform.split(",");
                for (index = 0; index < platforms.length; index += 1) {
                    if (!_.isUndefined(window.App.platform)) {
                        if (window.App.platform.toLowerCase() === platforms[index].toLowerCase()) {
                            notCompatible = notCompatible || true;
                            break;
                        } else {
                            notCompatible = notCompatible && false;
                        }
                    }
                }

            }
            if (!_.isUndefined(filter.model)) {
                models = filter.model.split(",");
                for (index = 0; index < models.length; index += 1) {
                    if (!_.isUndefined(window.App.modelName)) {
                        if (window.App.modelName.toLowerCase() === models[index].toLowerCase()) {
                            notCompatible = notCompatible || true;
                            break;
                        } else {
                            notCompatible = notCompatible && false;
                        }
                    }
                }
            }
            if (!_.isUndefined(filter.manufacturer)) {
                manufacturers = filter.manufacturer.split(",");
                for (index = 0; index < manufacturers.length; index += 1) {
                    if (!_.isUndefined(window.App.manufacturer)) {
                        if (window.App.manufacturer.toLowerCase() === manufacturers[index].toLowerCase()) {
                            notCompatible = notCompatible || true;
                            break;
                        } else {
                            notCompatible = notCompatible && false;
                        }
                    }
                }
            }
            return notCompatible;
        }
    });
});
