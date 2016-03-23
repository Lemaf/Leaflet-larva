/**
 * @requires Handle.js
 */

/**
 * @class
 * @extends {L.larva.frame.Handle}
 *
 * @param {L.LatLng} latlng
 * @param {Object} [options]
 *
 * @see {@link L.larva.frame.Handle}
 */
L.larva.frame.VertexHandle = L.larva.frame.Handle.extend(
/** @lends L.larva.frame.HandleVertex.prototype */
{
	options: {
		css: 'llarva-frame-vertexhandle'
	},

	initialize: function (latlng, options) {
		L.larva.frame.Handle.prototype.initialize.call(this, options);
		this._latlng = latlng;
	},

	/**
	 * @returns {L.larva.frame.VertexHandle} this
	 */
	add: function () {
		L.larva.frame.Handle.prototype.add.call(this);
		this._halfSize = L.point(
			L.larva.getWidth(this._handleEl) / 2,
			L.larva.getHeight(this._handleEl) / 2
		);

		return this;
	},

	/**
	 * @return {L.LatLng}
	 */
	getLatLng: function () {
		return this._latlng;
	},

	/**
	 * @return {L.Point}
	 */
	getPoint: function () {
		return this._point;
	},

	/**
	 * @param  {L.Map} map
	 * @param  {L.Point} [point]
	 * @return {L.larva.frame.VertexHandle}
	 */
	update: function (map, point) {
		if (!point) {
			point = map.latLngToLayerPoint(this._latlng);
		}

		L.DomUtil.setPosition(this._handleEl, point.subtract(this._halfSize));
		this._point = point;
		return this;
	}
});

/**
 * @param  {L.LatLng} latlng
 * @param  {Object} options
 * @return {L.larva.frame.VertexHandle}
 */
L.larva.frame.vertexHandle = function (latlng, options) {
	if (!latlng._lhandle) {
		latlng._lhandle = new L.larva.frame.VertexHandle(latlng, options);
		latlng._lhandle.isNew = true;
	} else if (latlng._lhandle.isNew) {
		delete latlng._lhandle.isNew;
	}
	return latlng._lhandle;
};