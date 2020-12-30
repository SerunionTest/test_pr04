/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"pr0104/pr0104/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});