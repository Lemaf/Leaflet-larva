/**
 * @requires Handle.js
 */


/**
 * @class
 *
 * @extends {L.larva.frame.Handle}
 *
 * @param {L.LatLng} latlng
 * @param {HTMLElement} handlePane
 * @param {HTMLElement} [shadowPane]
 * @param {Object} [options]
 */
L.larva.frame.VertexHandle = L.larva.frame.Handle.extend(
/** @lends L.larva.frame.VertexHandle.prototype */
{
	options: {
		cssClass: 'llarva-verticesframe-handle',
		shaodowCssClass: 'llarva-verticesframe-handle-shadow',
	},

	initialize: function (latlng, handlePane, shadowPane, options) {
		this._latlng = latlng;
		latlng._handle = this;
		L.larva.frame.Handle.prototype.initialize.call(this, handlePane, shadowPane, options);
	},

	getLatLng: function () {
		return this._latlng;
	},

	/**
	 * @param  {L.Map} map
	 * @param  {L.Point} [point]
	 */
	update: function (map, point) {

		if (!point) {
			point = map.latLngToLayerPoint(this._latlng);
		}

		if (!this._handle.offsetParent) {
			this._handlePane.appendChild(this._handle);
		}

		if (this._shadow && !this._shadow.offsetParent) {
			this._shadowPane.appendChild(this._shadow);
		}

		this.point = point.clone();

		point._subtract({
			x: L.larva.getWidth(this._handle) / 2,
			y: L.larva.getHeight(this._handle) / 2
		});

		L.DomUtil.setPosition(this._handle, point);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, point);
		}

	}
});

/**
 * @param  {L.LatLng} latlng
 * @param  {Object} [options]
 * @return {L.larva.frame.VertexHandle}
 */
L.larva.frame.vertexHandle = function (latlng, handlePane, shadowPane, options) {
	return new L.larva.frame.VertexHandle(latlng, handlePane, shadowPane, options);
};