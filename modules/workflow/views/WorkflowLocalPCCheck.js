/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App*/
/*global $, jQuery*/
var theCmd;

define([
    'backbone.marionette',
    'logger',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowLocalPCCheck.html'
], function (Marionette, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        maVersion: "",
        appleScript: "",
        templateHelpers: function () {
            var self = this;
            return {
                i18n: i18n,
                getVendorId: function () {
                    return self.model.get('vendorId') || "";
                },
                setEndpointId: function (epid) {
                    var event = {};
                    event.epid = epid;
                    self.onNext(event);
                },
                getMAVersion: function () {
                    return self.maVersion;
                },
                getAppleScript: function () {
                    return self.appleScript;
                },
                getBody: function () {
                    return self.model.get('body') || "";
                },
                logDebug: function (msg) {
                    Logger.debug("WorkflowLocalPCCheck : " + msg);
                },
                logError: function (msg) {
                    Logger.error("WorkflowLocalPCCheck : " + msg);
                }
            };
        },
        initialize: function (options) {
            Logger.info("LocalPCCheck : initialize");

			if (-1 !== navigator.userAgent.toLowerCase().indexOf("macbrowser")) {
                var embedNode,
                    appleScriptPlugin,
                    theScript,
                    scriptPath;

				try {
					//instantiate the AppleScript plugin
					embedNode = document.createElement("embed");
					embedNode.setAttribute("name", "AppleScriptRunner");
					embedNode.setAttribute("id", "AppleScriptRunner");
					embedNode.setAttribute("type", "data/x-wnAppleScriptRunner");
					document.body.appendChild(embedNode);
					appleScriptPlugin = document.getElementById("AppleScriptRunner");

					//extract ma version from path
					theScript = "set AppleScript\'s text item delimiters to \"\"\n";
					theScript += 'set thePath to POSIX path of (path to me)\n';
					theScript += 'set ASTID to AppleScript\'s text item delimiters\n';
					theScript += 'set AppleScript\'s text item delimiters to "\/"\n';
					theScript += 'set version to text item 5 of text items in thePath\n';
					theScript += 'set AppleScript\'s text item delimiters to ASTID\n';
					theScript += 'return version';
					this.maVersion = appleScriptPlugin.runAppleScript(theScript);

					//build up path to npMotiveBypass script that will be used in the template
					scriptPath = "/Library/Application Support/";
					scriptPath += "$VendorID$";
					scriptPath += "/";
					scriptPath += this.maVersion;
					scriptPath += "/";
					scriptPath += "resources/npMotiveBypass.applescript";
					theCmd = 'do shell script \"osascript \'' + scriptPath + '\' ' + '$VendorID$' + '\"';
					this.appleScript = theCmd;
				} catch (e) {
					Logger.error("exception in initialize - " + e);
					this.maVersion = "";
					this.appleScript = "";
				}
			}

            this.controller = options.controller;
            this.modify = false;
        },
        onRender: function () {
            Logger.info("LocalPCCheck : onRender");
        },
        onNext: function (event) {
            Logger.info("LocalPCCheck : onNext");

            var data = {};

            data[this.model.get("holder")] = event.epid;
            data.signalValue = "next";

            Logger.info("Submitting Values - EndpointId :" + data[this.model.get("holder")]);
            this.controller.signal(this.model.get("signal"), data);
        }
    });
});
