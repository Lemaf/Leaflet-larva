/**
 * @requires package.js
 * 
 * Base class for Path handlers
 */
L.larva.handler.Path = L.Handler.extend({

	includes: [L.Evented.prototype],

	initialize: function (path, options) {
		L.setOptions(this, options);

		this._path = path;
	}

});

L.Path.addInitHook(function () {
	this.larva = {};
});