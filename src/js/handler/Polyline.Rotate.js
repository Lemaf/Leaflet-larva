/**
 * @requires ../frame/Rect.js
 * @requires ../frame/RECT_STYLE.js
 * @requires ../ext/L.Polyline.js
 * 
 * @requires Polyline.Transform.js
 */

/**
 * @class Rotate polygon
 *
 * @extends {L.larva.handler.Polyline.Transform}
 */
L.larva.handler.Polyline.Rotate = L.larva.handler.Polyline.Transform.extend(
/** @lends L.larva.handler.Polyline.Transform.prototype */
{

	options: {
		noUpdate: [L.larva.frame.Rect.MIDDLE_MIDDLE]
	},

	addHooks: function () {
		this._frame = L.larva.frame.rect(this._path);
		this._frame.addTo(this.getMap());

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	_angleOf: function (evt) {
		var position = L.larva.getSourceEvent(evt),
		    center = this._getCenterElement();

		var i = position.clientX - center.x,
		    j = position.clientY - center.y;

		var length = Math.sqrt(i * i + j * j);

		// cross product
		var sin = (this._vector.i * j - this._vector.j * i) / length;

		// scalar product
		var cos = (this._vector.i * i + this._vector.j * j) / length;

		var frameBounding = this._frame.getFrameClientRect(),
		    framePosition = this._frame.getPosition();

		center.x = (center.x - frameBounding.left) + framePosition.x;
		center.y = (center.y - frameBounding.top) + framePosition.y;

		return {
			sin: sin, cos: cos, center: center
		};
	},

	_calculateParams: function (evt) {
		var angle = this._angleOf(evt);

		var worldCenterPoint = this.layerPointToWorldPoint(angle.center.x, angle.center.y);

		return {
			dx: worldCenterPoint.x * (1 - angle.cos) + worldCenterPoint.y * angle.sin,
			dy: worldCenterPoint.y * (1 - angle.cos) - worldCenterPoint.x * angle.sin,
			dxI: worldCenterPoint.x * (1 - angle.cos) - worldCenterPoint.y * angle.sin,
			dyI: worldCenterPoint.y * (1 - angle.cos) + worldCenterPoint.x * angle.sin,
			angle: angle
		};
	},

	_getCenterElement: function () {
		var centerBounding = this._centerElement.getBoundingClientRect();

		return new L.Point(
			centerBounding.left + centerBounding.width / 2,
			centerBounding.top + centerBounding.height / 2
		);
	},

	_onEndOffTheFly: function () {
		this._stopPreview();
		this._frame
			.off('drag:move', this._onMoveOffTheFly, this)
			.off('drag:end', this._onEndOffTheFly, this);

		this._apply(L.larva.l10n.transformRotate, [this._params], [this._params]);
	},

	_onEndOnTheFly: function () {
		this._frame
			.off('drag:move', this._onMoveOnTheFly, this)
			.off('drag:end', this._onEndOnTheFly, this);

		this._apply(L.larva.l10n.transformRotate, [this._params], [this._params]);
	},

	_onMoveOffTheFly: function (evt) {
		this._transformPreview(this._params = this._calculateParams(evt));
	},

	_onMoveOnTheFly: function (evt) {
		this._transform(this._params = this._calculateParams(evt));
	},

	_onStart: function (evt) {
		if (!evt.handle || evt.handle === L.larva.frame.Rect.MIDDLE_MIDDLE) {
			return;
		}

		var centerElement = this._centerElement = this._frame.getHandle(L.larva.frame.Rect.MIDDLE_MIDDLE);

		var centerBounding = centerElement.getBoundingClientRect();

		var vector = this._vector = {
			i: evt.sourceEvent.pageX - (centerBounding.left + centerBounding.width / 2),
			j: evt.sourceEvent.pageY - (centerBounding.top + centerBounding.height / 2)
		};

		vector.length = Math.sqrt(vector.i * vector.i + vector.j * vector.j);

		vector.i = vector.i / vector.length;
		vector.j = vector.j / vector.length;
		vector.length = 1;

		this.backupLatLngs();

		if (this.options.onTheFly) {
			this._frame
				.on('drag:move', this._onMoveOnTheFly, this)
				.on('drag:end', this._onEndOnTheFly, this);
		} else {
			this._startPreview();
			this._frame
				.on('drag:move', this._onMoveOffTheFly, this)
				.on('drag:end', this._onEndOffTheFly, this);
		}
	},
	/**
	 * @param  {L.Point} original
	 * @param  {L.Point} transformed
	 * @param  {Number} sin
	 * @param  {Number} cos
	 * @param  {Number} dx
	 * @param  {Number} dy
	 */
	_transformPoint: function (original, transformed, params) {
		transformed.x = original.x * params.angle.cos - original.y * params.angle.sin + params.dx;
		transformed.y = original.x * params.angle.sin + original.y * params.angle.cos + params.dy;
	},

	_unTransformPoint: function (original, transformed, params) {
		transformed.x = original.x * params.angle.cos + original.y * params.angle.sin + params.dxI;
		transformed.y = 0 - original.x * params.angle.sin + original.y * params.angle.cos + params.dyI;
	}
});

L.Polyline.addInitHook(function () {
	this.larva.rotate = new L.larva.handler.Polyline.Rotate(this, L.larva.frame.RECT_STYLE.ROTATE);
});