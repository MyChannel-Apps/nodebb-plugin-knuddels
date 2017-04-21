"use strict";

var user = module.parent.require('./user'),
	meta = module.parent.require('./meta'),
	db = module.parent.require('./database'),
	winston = module.parent.require('winston'),
	async = module.parent.require('async'),
	crypto = require('crypto'),

	controllers = require('./lib/controllers'),
	plugin = {};

plugin.init = function(params, callback) {
	var router = params.router,
		hostMiddleware = params.middleware,
		hostControllers = params.controllers;

	router.get('/admin/plugins/knuddels', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/knuddels', controllers.renderAdminPage);

	meta.settings.get('knuddels', function(err, settings) {
		if (err) {
			winston.error('[plugin/knuddels] Could not retrieve plugin settings! Using defaults.');
			plugin.settings = {
				default: false,
				force: false
			};
			return;
		}

		plugin.settings = settings;
	});

	callback();
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/knuddels',
		icon: 'fa-picture',
		name: 'Knuddels'
	});

	callback(null, header);
};

plugin.list = function(data, callback) {
	user.getUserFields(data.uid, ['username'], function(err, userData) {
		data.pictures.push({
			type: 'knuddels',
			url: getProfilePicture(userData.username),
			text: 'Knuddels'
		});

		callback(null, data);
	});
};

plugin.get = function(data, callback) {
	if (data.type === 'knuddels') {
		user.getUserFields(data.uid, ['username'], function(err, userData) {
			data.picture = getProfilePicture(userData.username);
			callback(null, data);
		});
	} else {
		callback(null, data);
	}
};

plugin.updateUser = function(data, callback) {
	if (plugin.settings.default === 'on') {
		winston.verbose('[plugin/gravatar] Updating uid ' + data.user.uid + ' to use gravatar');
		data.user.picture = getProfilePicture(data.user.username);
		callback(null, data);
	} else {
		// No transformation
		callback(null, data);
	}
};

plugin.onForceEnabled = function(users, callback) {
	if (plugin.hasOwnProperty('settings') && plugin.settings.force === 'on') {
		async.map(users, function(userObj, next) {
			if (!userObj) {
				return next(null, userObj);
			}

			if (!userObj.email) {
				db.getObjectField('user:' + userObj.uid, 'email', function(err, email) {
					userObj.picture = getProfilePicture(userObj.username);
					next(null, userObj);
				});
			} else {
				userObj.picture = getProfilePicture(userObj.username);
				next(null, userObj);
			}
		}, callback);
	} else if (plugin.hasOwnProperty('settings') && plugin.settings.default === 'on') {
		async.map(users, function(userObj, next) {
			if (!userObj) {
				return next(null, userObj);
			}

			if (userObj.picture === '') {
				if (!userObj.email) {
					db.getObjectField('user:' + userObj.uid, 'email', function(err, email) {
						userObj.picture = getProfilePicture(userObj.username);
						next(null, userObj);
					});
				} else {
					userObj.picture = getProfilePicture(userObj.username);
					next(null, userObj);
				}
			} else {
				setImmediate(next, null, userObj);
			}
		}, callback);
	} else {
		// No transformation
		callback(null, users);
	}
}

function getProfilePicture(username) {
	var size = parseInt(meta.config.profileImageDimension, 10) || 128;
	return 'http://chat.knuddels.de/pics/fotos/knuddels.de?n=' + encodeURIComponent(username);
};

module.exports = plugin;