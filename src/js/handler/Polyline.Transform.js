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
 */
L.larva.handler.Polyline.Transform = L.larva.handler.Polyline.extend(
/** @lends L.larva.handler.Polyline.Transform.prototype */
{

	includes: [L.larva.Undoable],

	options: {
		onTheFly: true,
		noUpdate: [],
		preview: {
			multiply: {
				fillOpacity: 0.5,
				fillColor: [1.5, 1.7, 0],
				opacity: 0.5,
				color: [1.5, 1.7, 0.1]
			}
		},
		previewTolerance: 5
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
	 * @param  {Boolean} [applied]
	 */
	_apply: function (desc, doArgs, undoArgs, applied) {

		this._path.forEachLatLng(function (latlng) {
			delete latlng._original;
		});

		this._do(desc, this._transform, doArgs, this._unTransform, undoArgs, !!applied);
	},
	/**
	 * @protected
	 * @param  {L.LatLng[]} latlngs
	 * @return {L.LatLng[]}
	 */
	_simplifyToPreview: function (latlngs) {
		var points = latlngs.map(function (latlng) {
			var point = this._latLngToLayerPoint(latlng);
			point._latlng = latlng;
			return point;
		}, this);

		points = L.LineUtil.simplify(points, this.options.previewTolerance);

		return points.map(function (point) {
			var latlng = point._latlng.clone();
			latlng._original = point._latlng;
			return latlng;
		}, this);
	},
	/**
	 * @protected
	 */
	_startPreview: function () {
		var previewLatLngs = [], polygon;

		if (this._preview) {
			this.getMap().removeLayer(this._preview.layer);
		}

		var preview = this._preview = {
			latlngs: previewLatLngs
		};

		var clazz;

		switch (this._path.getType()) {
			case L.Polyline.POLYLINE:
				this._path.forEachLine(function (latlngs) {
					previewLatLngs.push.apply(previewLatLngs, this._simplifyToPreview(latlngs));
				}, this);

				clazz = L.Polyline;
				break;

			case L.Polyline.MULTIPOLYLINE:
				this._path.forEachLine(function (latlngs) {
					previewLatLngs.push(this._simplifyToPreview(latlngs));
				}, this);

				clazz = L.Polyline;
				break;

			default:
				this._path.forEachPolygon(function (shell, holes) {
					polygon = [this._simplifyToPreview(shell)];
					polygon.push.apply(polygon, holes.map(this._simplifyToPreview, this));
					previewLatLngs.push(polygon);
				}, this);

				clazz = L.Polygon;
		}

		this.setMap(this.getMap());
		this.getMap().removeLayer(this._path);
		preview.layer = new clazz(preview.latlngs, L.larva.style(this._path, this.options.preview))
		                    	.addTo(this.getMap());
	},
	/**
	 * @protected
	 */
	_stopPreview: function () {
		if (this._preview) {
			this.getMap().removeLayer(this._preview.layer);
			this._path.addTo(this.getMap());
			this.setMap(null);
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

		// this._path.updateBounds();
		this._frame.updateBounds.apply(this._frame, [null].concat(this.options.noUpdate));
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

		preview.layer.forEachLatLng(function (latlng) {

			original = args[0] = L.larva.project(latlng._original);
			transformed.x = original.x;
			transformed.y = original.y;

			self._transformPoint.apply(self, args);

			newLatLng = L.larva.unproject(transformed);

			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
		});

		preview.layer.updateBounds();
		preview.layer.redraw();
		this._frame.updateBounds.apply(this._frame, [preview.layer.getBounds()].concat(this.options.noUpdate));
	},
	/**
	 * @param {...*} args
	 */
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

		this._frame.updateBounds.apply(this._frame, [null].concat(this.options.noUpdate));
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