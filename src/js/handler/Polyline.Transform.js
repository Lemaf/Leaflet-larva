/**
 * @requires Polyline.js
 */

/**
 * @class Base class for every LatLng transformer
 *
 * @extends {L.larva.handler.Polyline}
 *
 * @param {L.Path} path Layer to transform
 * @param {L.larva.frame.Style} frameStyle, @see {L.larva.frame}
 * @param {Object} options
 */
L.larva.handler.Polyline.Transform = L.larva.handler.Polyline.extend(
/** @lends L.larva.handler.Polyline.Transform.prototype */
{
	options: {
		noUpdate: []
	},

	initialize: function (path, frameStyle, options) {
		L.larva.handler.Polyline.prototype.initialize.call(this, path, options);

		this._frameStyle = frameStyle;
	},

	/**
	 * Transform each layer point
	 * @param {...Object}
	 */
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

	/**
	 * @abstract
	 * @param {L.Point} original Original point
	 * @param {L.Point} transformed Point transformed
	 * @param {...Object}
	 */
	transformPoint: function () {
		throw new Error('Unsupported Operation!');
	}
});