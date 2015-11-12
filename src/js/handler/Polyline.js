/**
 * @requires Path.js
 */
L.larva.handler.Polyline = L.larva.handler.Path.extend({

	options: {
		noUpdate: []
	},

	backupLatLngs: function () {
		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});
	},

	transform: function () {

		var transformed = L.point(0, 0),
		    original,
		    newLatLng;

		var args = [null, transformed].concat(Array.prototype.slice.call(arguments, 0));

		this._path.forEachLatLng(function (latlng) {

			original = args[0] = this._path._map.latLngToLayerPoint(latlng._original);

			transformed.x = original.x;
			transformed.y = original.y;

			this.transformPoint.apply(this, args);

			newLatLng = this._path._map.layerPointToLatLng(transformed);
			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;

		}, this);

		this._path.updateBounds();

		this._frame.updateBounds.apply(this._frame, this.options.noUpdate);
		this._path.redraw();
	},

	transformPoint: function () {
		throw new Error('Unsupported Operation!');
	}

});