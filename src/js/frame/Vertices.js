/**
 * @requires package.js
 *
 * @requires ../ext/L.Polygon.js
 * @requires ../Style.js
 */

/**
 * @class
 *
 * Frame for handle point by point editor
 * 
 */
L.larva.frame.Vertices = L.Layer.extend(
/** @lends L.larva.frame.Vertices.prototype */
{
	options: {
		colorFactor: [0.8, 1.3, 0.8],
		handleClassName: 'llarva-vertex',
		opacityFactor: 0.8,
		sqrEditResistance: 4,
		pane: 'llarva-frame',
		tolerance: 10,
		simplifyZoom: -1,
	},

	initialize: function (path, options) {
		this._path = path;

		if (options) {
			L.setOptions(this, options);
		}
	},

	beforeAdd: function (map) {
		if (!map.getPane(this.options.pane)) {
			map.createPane(this.options.pane);
		}
	},

	getEvents: function () {
		return {
			moveend: this._onMoveEnd,
			zoomend: this._onZoomEnd
		};
	},

	onAdd: function (map) {
		this._map = map;
	},

	_onMoveEnd: function () {

	},

	_onZoomEnd: function () {

	}
});

L.larva.frame.vertices = function (map, options) {
	return new L.larva.frame.Vertices(map, options);
};