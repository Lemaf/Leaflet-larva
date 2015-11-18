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

	unproject: function (a, b) {
		if (b !== undefined) {
			return this._path._map.layerPointToLatLng(L.point(a, b));
		} else {
			return this._path._map.layerPointToLatLng(a);
		}
	}

});

L.Path.addInitHook(function () {
	this.larva = {};
});