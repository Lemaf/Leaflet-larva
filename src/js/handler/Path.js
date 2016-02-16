/**
 * @requires package.js
 */

/**
 * @class Base class for layers handlers
 * 
 * @extends L.Handler
 * @mixes L.Evented
 *
 * @param {L.Path} path layer to handle
 * @param {Object} options
 */
L.larva.handler.Path = L.Handler.extend(
/** @lends L.larva.handler.Path.prototype */
{

	includes: [L.Evented.prototype],

	initialize: function (path, options) {
		L.setOptions(this, options);

		this._path = path;
	},

	/**
	 * @return {L.Map}
	 */
	getMap: function () {
		return this._path._map || this._map;
	},

	/**
	 * @param  {Number} x
	 * @param  {Number} y
	 * @return {L.Point} 
	 */
	layerPointToWorldPoint: function (a, b) {
		return L.larva.project(this.unproject(a, b));
	},

	/**
	 * @param {L.Map} map
	 */
	setMap: function (map) {
		if (map) {
			this._map = map;
		} else {
			delete this._map;
		}
	},

	/**
	 * @param  {Number} x layer x
	 * @param  {Number} y layer y
	 * @return {L.LatLng}
	 */
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