/**
 * @requires Polyline.js
 */
L.larva.handler.Polyline.Transform = L.larva.handler.Polyline.extend({


	options: {
		noUpdate: []
	},

	initialize: function (path, frameStyle, options) {
		L.larva.handler.Polyline.prototype.initialize.call(this, path, options);

		this._frameStyle = frameStyle;
	},

	transform: function () {

		var transformed = L.point(0, 0),
		    original,
		    newLatLng;

		var args = [null, transformed].concat(Array.prototype.slice.call(arguments, 0));

		this._path.forEachLatLng(function (latlng) {

			original = args[0] = L.larva.project(latlng._original);

			transformed.x = original.x;
			transformed.y = original.y;

			this.transformPoint.apply(this, args);

			newLatLng = L.larva.unproject(transformed);
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