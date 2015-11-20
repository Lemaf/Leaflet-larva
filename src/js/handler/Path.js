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
	},
 
	getMap: function () {
		return this._path._map;
	},

	layerPointToWorldPoint: function (a, b) {
		return L.larva.project(this.unproject(a, b));
	},

	unproject: function (a, b) {
		if (b !== undefined) {
			return this.getMap().layerPointToLatLng(L.point(a, b));
		} else {
			return this.getMap().layerPointToLatLng(a);
		}
	}

});

L.Path.addInitHook(function () {
	this.larva = {};
});