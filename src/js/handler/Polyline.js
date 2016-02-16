/**
 * @requires Path.js
 */

/**
 * @class Polyline Handler base class
 *
 * @extends {L.larva.handler.Path}
 */
L.larva.handler.Polyline = L.larva.handler.Path.extend(
/** @lends L.larva.handler.Polyline.prototype */
{
	/**
	 * Backup all latlngs
	 */
	backupLatLngs: function () {
		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});

		var bounds = this._path.getBounds();

		var latlng = bounds.getSouthWest();
		latlng._original = latlng.clone();

		latlng = bounds.getNorthEast();
		latlng._original = latlng.clone();
	},
	/**
	 * @protected
	 * @param  {L.Point} point
	 * @return {L.LatLng}
	 */
	_layerPointToLatLng: function (point) {
		return this.getMap().layerPointToLatLng(point);
	},
	/**
	 * @protected
	 * @param  {L.LatLng} latlng
	 * @return {L.Point}
	 */
	_latLngToLayerPoint: function (latlng) {
		return this.getMap().latLngToLayerPoint(latlng);
	}

});