/**
 * @requires Polyline.js
 * @requires ../Undoable.js
 */

/**
 * @class Base class for every LatLng transformer
 *
 * @extends {L.larva.handler.Polyline}
 * @mixes L.larva.Undoable
 *
 * @param {L.Path} path Layer to transform
 * @param {L.larva.frame.Style} frameStyle, @see {L.larva.frame}
 * @param {Object} options
 *
 */
L.larva.handler.Polyline.Transform = L.larva.handler.Polyline.extend(
/** @lends L.larva.handler.Polyline.Transform.prototype */
{

	includes: [L.larva.Undoable],

	options: {
		onTheFly: false,
		noUpdate: []
	},

	initialize: function (path, frameStyle, options) {
		L.larva.handler.Polyline.prototype.initialize.call(this, path, options);
		this._frameStyle = frameStyle;
	},
	/**
	 * @protected
	 * @param  {String} desc
	 * @param  {Array.<*>} doArgs
	 * @param  {Array.<*>} undoArgs
	 */
	_apply: function (desc, doArgs, undoArgs) {

		this._path.forEachLatLng(function (latlng) {
			delete latlng._original;
		});

		this._do(desc, this._transform, doArgs, this._unTransform, undoArgs);
	},
	/**
	 * @protected
	 */
	_startPreview: function () {
		var bounds = this._path.getBounds();
		var southWest = bounds.getSouthWest().clone(),
		    northEast = bounds.getNorthEast().clone();

		if (this._preview) {
			this.getMap().removeLayer(this._preview.layer);
		}

		var preview = this._preview = {
			latlngs: [
				southWest,
				new L.LatLng(southWest.lat, northEast.lng),
				northEast,
				new L.LatLng(northEast.lat, southWest.lng)
			]
		};

		preview.latlngs.forEach(function (latlng) {
			latlng._original = latlng.clone();
		});

		preview.layer = L.polygon(preview.latlngs, this._path.options).addTo(this.getMap());
	},
	/**
	 * @protected
	 */
	_stopPreview: function () {
		if (this._preview) {
			this.getMap().removeLayer(this._preview.layer);
		}
	},
	/**
	 * @protected
	 * @param {...*} args
	 */
	_transform: function () {
		var transformed = L.point(0, 0),
		    original,
		    newLatLng;

		var args = [null, transformed];
		args.push.apply(args, arguments);

		this._path.forEachLatLng(function (latlng) {

			original = args[0] = L.larva.project(latlng._original || latlng);

			transformed.x = original.x;
			transformed.y = original.y;

			this._transformPoint.apply(this, args);

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
	 * @param {...*} args
	 */
	_transformPoint: function () {
		throw new Error('Unsupported Operation!');
	},
	/**
	 * @param {...*} args
	 */
	_transformPreview: function () {
		var preview = this._preview;

		if (!preview) {
			return;
		}

		var transformed = L.point(0, 0),
		    original,
		    newLatLng,
		    self = this;

		var args = [null, transformed];
		args.push.apply(args, arguments);

		function calc (latlng) {

			original = args[0] = L.larva.project(latlng._original);
			transformed.x = original.x;
			transformed.y = original.y;

			self._transformPoint.apply(self, args);

			newLatLng = L.larva.unproject(transformed);

			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
		}

		calc(preview.latlngs[0]);
		calc(preview.latlngs[1]);
		calc(preview.latlngs[2]);
		calc(preview.latlngs[3]);
		

		preview.layer.updateBounds();
		preview.layer.redraw();
	},

	_unTransform: function () {
		var transformed = L.point(0, 0),
		    original,
		    newLatLng;

		var args = [null, transformed];
		args.push.apply(args, arguments);

		this._path.forEachLatLng(function (latlng) {

			original = args[0] = L.larva.project(latlng._original || latlng);

			transformed.x = original.x;
			transformed.y = original.y;

			this._unTransformPoint.apply(this, args);

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
	 * @param {L.Point} original
	 * @param {L.Point} transformed
	 * @param {...*} args
	 */
	_unTransformPoint: function () {
		throw new Error('Unsupported Operation!');
	}
});