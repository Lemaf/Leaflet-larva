/**
 * @requires  New.Polyline.js
 */

/**
 * @class Polygon creator
 * @extends {L.larva.handler.New.Polyline}
 */
L.larva.handler.New.Polygon = L.larva.handler.New.Polyline.extend(
	/** @lends L.larva.handler.New.Polygon.prototype */
{

	options: {
		threshold: 2
	},

	/**
	 * @return {L.Polygon} Creates blank layer
	 */
	createLayer: function () {
		return L.polygon([], this.options.layerOptions);
	}

});

/**
 * @memberOf L.larva.handler.New.Polygon
 * @param  {L.Map} map
 * @param  {Object} options
 * @return {L.larva.handler.New.Polygon}
 */
L.larva.handler.newPolygon = function (map, options) {
	return new L.larva.handler.New.Polygon(map, options);
};