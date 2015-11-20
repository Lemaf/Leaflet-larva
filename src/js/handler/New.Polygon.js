/**
 * @requires  New.Polyline.js
 */
L.larva.handler.New.Polygon = L.larva.handler.New.Polyline.extend({

	options: {
		threshold: 3
	},

	createLayer: function () {
		return L.polygon([], this.options.layerOptions);
	}

});

L.larva.handler.newPolygon = function (map, options) {
	return new L.larva.handler.New.Polygon(map, options);
};