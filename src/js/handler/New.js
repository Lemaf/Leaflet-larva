/**
 * @requires package.js
 */

/**
 * @class Base type to creators
 * @param {L.Map} map
 * @param {Object} options
 * 
 * @extends L.Handler
 * @mixes L.Evented
 */
L.larva.handler.New = L.Handler.extend(
/** @lends L.larva.handler.New.prototype */
{
	includes: [L.Evented.prototype],

	options: {
		allowFireOnMap: true
	},

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		if (options) {
			L.setOptions(this, options);
		}
	},

	/**
	 * Fire a event on map
	 * @param  {String} eventName
	 * @param  {Object} eventObject
	 */
	fireOnMap: function (eventName, eventObject) {
		if (this.options.allowFireOnMap) {
			this._map.fire(eventName, eventObject);
		}
	},

	/**
	 * Project a (lat, lng) to a layer point
	 * @param  {number} lat
	 * @param  {number} lng
	 * @return {L.Point}
	 */
	project: function (a, b) {
		if (b !== undefined) {
			return this._map.latLngToLayerPoint(L.latLng(a, b));
		} else {
			return this._map.latLngToLayerPoint(a);
		}
	}

});