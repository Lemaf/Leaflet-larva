/**
 * @requires Path.js
 */
L.larva.handler.Polyline = L.larva.handler.Path.extend({

	options: {
		noUpdate: []
	},

	transform: function () {

		var args = [null, null].concat(Array.prototype.slice.call(arguments, 0)),
		    newLatLng;

		var transformed = args[1] = L.point(0, 0);

		this._path.forEachLatLng(function (latlng) {

			args[0] = this._path._map.latLngToLayerPoint(latlng._original);

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