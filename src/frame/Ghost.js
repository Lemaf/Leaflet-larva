/**
 * @requires ../ext/L.Polygon.js
 */

/**
 * @class
 *
 * @param {Object} kargs
 * @param {L.Map} kargs.map
 * @param {Object} kargs.options
 * @param {Array<Number>} kargs.options.colorFactor @see {@link L.larva.Style}
 * @param {Number} kargs.options.opacityFactor @see {@link L.larva.Style}
 * @param {L.larva.frame.VertexHandle} kargs.handle
 * @param {L.Path} kargs.path
 * @param {Object} kargs.position
 * @param {Number} kargs.position.x
 * @param {Number} kargs.position.y
 */
L.larva.frame.Ghost = L.Class.extend(
/** @lends L.larva.frame.Ghost.prototype */
{
	initialize: function (kargs) {
		if (kargs.options) {
			L.setOptions(this, kargs.options);
		}

		var handle = kargs.handle;

		var latlngs = [],
		    latlng = handle.getLatLng().clone(),
		    style = L.larva.style(kargs.path).multiply({
		    	color: this.options.colorFactor,
		    	opacity: this.options.opacityFactor
		    });

		if (handle.isPolygon) {
			latlngs.push((handle.prev ? handle.prev.getLatLng() : handle.last.getLatLng()).clone());
			latlngs.push(latlng);
			latlngs.push((handle.next ? handle.next.getLatLng() : handle.first.getLatLng()).clone());
		} else {
			if (handle.prev) {
				latlngs.push(handle.prev.getLatLng().clone());
			}
			latlngs.push(latlng);
			if (handle.next) {
				latlngs.push(handle.next.getLatLng().clone());
			}
		}

		this.layer = L.polyline(latlngs, L.extend({}, style.getStyle(), {
			noClip: true
		})).addTo(kargs.map);

		L.extend(this, {
			handle: handle,
			point: handle.getPoint().clone(),
			latlng: latlng,
			x: kargs.position.x,
			y: kargs.position.y
		});
	},

	/**
	 */
	destroy: function () {
		this.layer._map.removeLayer(this.layer);
	},

	/**
	 * @param  {Object} position
	 * @param  {Number} position.x
	 * @param  {Number} position.y
	 * @param  {L.Map} map
	 */
	update: function (position, map) {
		var dx = position.x - this.x,
		    dy = position.y - this.y;

		var newPoint = this.point.add(L.point(dx, dy));
		var newLatLng = map.layerPointToLatLng(newPoint);
		this.latlng.lat = newLatLng.lat;
		this.latlng.lng = newLatLng.lng;

		this.layer.updateBounds();
		this.layer.redraw();
		this.handle.update(map, newPoint);
	}
});

/**
 * @param  {Object} kargs
 * @return {L.larva.frame.Ghost}
 */
L.larva.frame.ghost = function (kargs) {
	return new L.larva.frame.Ghost(kargs);
};