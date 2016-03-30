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
/** @lends L.larva.handler.Polyline.Rotate.prototype */
{
	initialize: function (path, options) {
		L.larva.handler.Polyline.Transform.prototype.initialize.call(this, path, L.larva.frame.RECT_STYLE.ROTATE, options);
	},

	addHooks: function () {
		this._frame = L.larva.frame.rect(this._path);
		this._frame.addTo(this.getMap());

		this._frame.setStyle(this._frameStyle);

		this._frame.on('handle:dragstart', this._onDragStart, this);
	},

	_angleOf: function (evt) {
		var position = L.larva.getOriginalEvent(evt),
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

	_onDragEndOffTheFly: function () {
		this._stopPreview();
		this._frame
			.off('drag', this._onDragOffTheFly, this)
			.off('dragend', this._onDragEndOffTheFly, this);

		if (this._params) {
			this._apply(L.larva.l10n.transformRotate, [this._params], [this._params]);
			this._frame.unfreezeDraggables();
		}
	},

	_onDragEndOnTheFly: function () {
		this._frame
			.off('drag', this._onDragOnTheFly, this)
			.off('dragend', this._onDragEndOnTheFly, this);

		if (this._params) {
			this._apply(L.larva.l10n.transformRotate, [this._params], [this._params], true);
			this._frame.unfreezeDraggables();
		}
	},

	_onDragOffTheFly: function (evt) {
		this._transformPreview(this._params = this._calculateParams(evt));
	},

	_onDragOnTheFly: function (evt) {
		this._transform(this._params = this._calculateParams(evt));
	},

	_onDragStart: function (evt) {
		if (evt.handle.getPosition() === L.larva.frame.RectHandle.MIDDLE_MIDDLE) {
			return;
		}

		delete this._params;

		var middleMiddle = this._frame.getHandle(L.larva.frame.RectHandle.MIDDLE_MIDDLE);

		var centerElement = this._centerElement = middleMiddle.getEl();

		var centerBounding = centerElement.getBoundingClientRect();

		var vector = this._vector = {
			i: evt.originalEvent.pageX - centerBounding.left - centerBounding.width / 2,
			j: evt.originalEvent.pageY - centerBounding.top - centerBounding.height / 2
		};

		vector.length = Math.sqrt(vector.i * vector.i + vector.j * vector.j);

		vector.i = vector.i / vector.length;
		vector.j = vector.j / vector.length;
		vector.length = 1;

		this.backupLatLngs();

		this._frame.freezeDraggables();

		if (this.options.onTheFly) {
			this._frame
				.on('drag', this._onDragOnTheFly, this)
				.on('dragend', this._onDragEndOnTheFly, this);
		} else {
			this._startPreview();
			this._frame
				.on('drag', this._onDragOffTheFly, this)
				.on('dragend', this._onDragEndOffTheFly, this);
		}
	},
	/**
	 * @param  {L.Point} original
	 * @param  {L.Point} transformed
	 * @param {Object} params
	 * @param {Object} params.angle
	 * @param {Number} params.angle.cos
	 * @param {Number} params.angle.sin
	 * @param {Number} params.dx
	 * @param {Number} params.dy
	 * @param {Number} params.dxI
	 * @param {Number} params.dyI
	 */
	_transformPoint: function (original, transformed, params) {
		transformed.x = original.x * params.angle.cos - original.y * params.angle.sin + params.dx;
		transformed.y = original.x * params.angle.sin + original.y * params.angle.cos + params.dy;
	},

	/**
	 * @see {@link L.larva.handler.Polyline.Rotate#_transformPoint _transformPoint}
	 * @param {L.Point} original
	 * @param {L.Point} transformed
	 * @param {Object} params
	 */
	_unTransformPoint: function (original, transformed, params) {
		transformed.x = original.x * params.angle.cos + original.y * params.angle.sin + params.dxI;
		transformed.y = 0 - original.x * params.angle.sin + original.y * params.angle.cos + params.dyI;
	}
});

L.Polyline.addInitHook(function () {
	this.larva.rotate = new L.larva.handler.Polyline.Rotate(this);
});