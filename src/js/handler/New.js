/**
 * @requires package.js
 */

L.larva.handler.New = L.Handler.extend({

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

	project: function (a, b) {
		if (b !== undefined) {
			return this._map.latLngToLayerPoint(L.latLng(a, b));
		} else {
			return this._map.latLngToLayerPoint(a);
		}

	},

	fireOnMap: function (eventName, eventObject) {
		if (this.options.allowFireOnMap) {
			this._map.fire(eventName, eventObject);
		}
	}

});