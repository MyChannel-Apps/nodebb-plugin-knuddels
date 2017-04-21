'use strict';
/* globals $, app, socket */

define('admin/plugins/knuddels', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('knuddels', $('.knuddels-settings'));

		$('#save').on('click', function() {
			Settings.save('knuddels', $('.knuddels-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'knuddels-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});