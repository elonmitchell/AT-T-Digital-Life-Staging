/*
 * Copyright (c) 2013 Motive, Inc.
 * All rights reserved.
 *
 * Motive, Inc. Proprietary/Trade Secret ; Information
 * Not to be disclosed or used except in accordance with applicable agreements.
 */
/*global App
 */
define([
    'backbone.marionette',
    'underscore',
    'logger',
    'i18n!modules/workflow/nls/Messages',
    'tpl!modules/workflow/templates/WorkflowSelector.html'
], function (Marionette, _, Logger, i18n, Template) {
    'use strict';
    return Marionette.ItemView.extend({
        template: Template,
        templateHelpers: function () {
            var self = this;
            return {
                i18n : i18n,
                getBody: function () {
                    return self.model.get('body') || "";
                },
                getLabel: function () {
                    return self.model.get('label') || "";
                },
                getButton: function () {
                    return self.model.get('button') || "";
                },
                getSelectionType: function () {
                    return self.model.get('selectionType') || "single";
                }
            };
        },
        initialize: function (options) {
            var self = this;
            this.$el.on('click', '#button', _.bind(self.onPress, this));
            this.controller = options.controller;
        },
        onRender: function () {
            var self = this,
                selectionType = this.model.get('selectionType');
            this.$('#button').hide();
            this._setSelection();
            if (selectionType === "single") {
                this.$('input[type="radio"]').bind('click', function (e) {
                    self.$("#button").show();
                });
            } else if (selectionType === "multiple") {
                this.$(":checkbox").change(function (e) {
                    var items = self.$(":checkbox:checked");
                    if (items.length > 0) {
                        self.$("#button").show();
                    } else {
                        self.$("#button").hide();
                    }
                });
            } else if (selectionType === "dropdown") {
                if (this.$('#selection').has('[selected]')) {
                    this.$("#button").show();
                }
                this.$("#selection").change(function (e) {
                    self.$("#button").show();
                });
            } else {
                // Invalid selection type
                Logger.error("WorkflowSelector : onRender - Invalid selectionType (" + selectionType + ")");
            }
        },
		onPress: function (event) {
			Logger.info("Selector:onPress");
            var data = {},
                checks = [],
                selectionType = this.model.get('selectionType');
            if (selectionType === "dropdown") {
                data[this.model.get("selectedItemsVar")] = this.$('#selection').val();
            } else if (selectionType === "single") {
                data[this.model.get("selectedItemsVar")] = this.$("input[type='radio']:checked").val();
            } else if (selectionType === "multiple") {
                this.$("input[type=checkbox]:checked").each(function () {
                    checks.push(this.value);
                });
                data[this.model.get("selectedItemsVar")] = checks.join(',');
            }

            this.controller.signal(this.model.get("signal"), data);
            event.stopPropagation();
        },
        onBack: function (event) {
            this.controller.signal("back", {});
            event.stopPropagation();
        },
        _setSelection: function () {
            var self = this,
                selectionType = this.model.get('selectionType'),
                selectedItem = this.model.get('selectedItemVal'),
                selectedElem = null,
                selectedItems;
            if (selectionType !== "multiple" && selectionType !== "dropdown") {
                if (selectedItem !== "") {
                    selectedElem = this.$('input[type="radio"][value="' + selectedItem + '"]');
                }
                if (selectedElem === null || selectedElem.length === 0) {
                    this.$('input[type="radio"]')[0].checked = true;
                    this.$('#button').show();
                } else {
                    selectedElem[0].checked = true;
                    this.$('#button').show();
                }
            } else if (selectionType === "multiple") {
                if (selectedItem !== "") {
                    selectedItems = selectedItem.split(",");
                    _.forEach(selectedItems, function (value) {
                        selectedElem = self.$('input[type="checkbox"][value="' + value + '"]');
                        if (selectedElem && selectedElem.length > 0) {
                            selectedElem[0].checked = true;
                            self.$('#button').show();
                        }
                    });
                }
            } else if (selectionType === "dropdown") {
                if (selectedItem !== "") {
                    selectedItems = selectedItem.split(",");
                    _.forEach(selectedItems, function (value) {
                        selectedElem = self.$('option[value="' + value + '"]');
                        if (selectedElem && selectedElem.length > 0) {
                            selectedElem[0].selected = true;
                            self.$('#button').show();
                        }
                    });
                }
            }
        }
    });
});
