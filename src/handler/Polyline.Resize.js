/**
 * @requires ../frame/Rect.js
 * @requires ../frame/RECT_STYLE.js
 * @requires ../ext/L.Polyline.js
 * 
 * @requires Polyline.Transform.js
 */

/**
 * @class Resize layer
 *
 * @extends {L.larva.handler.Polyline.Transform}
 * 
 */
L.larva.handler.Polyline.Resize = L.larva.handler.Polyline.Transform.extend(
/** @lends L.larva.handler.Polyline.Resize.prototype */
{

	addHooks: function () {
		this._frame = L.larva.frame.rect(this._path).addTo(this.getMap());

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	_onEndOffTheFly: function () {

		this._stopPreview();

		this._frame
			.off('drag:move', this._onMoveOffTheFly, this)
			.off('drag:end', this._onEndOffTheFly, this);

		delete this._reference;
		this._apply(L.larva.l10n.transformResize, [this._scale], [this._scale]);
	},

	_onEndOnTheFly: function () {
		this._frame
			.off('drag:move', this._onMoveOnTheFly, this)
			.off('drag:end', this._onEndOnTheFly, this);

		delete this._reference;
		this._apply(L.larva.l10n.transformResize, [this._scale], [this._scale], true);
	},

	_onMoveOffTheFly: function (evt) {
		this._transformPreview(this._scale = this._scaleOf(evt));
	},

	_onMoveOnTheFly: function (evt) {
		this._transform(this._scale = this._scaleOf(evt));
	},

	_onStart: function (evt) {

		if (!evt.handle || evt.handle === L.larva.frame.Rect.MIDDLE_MIDDLE) {
			return;
		}

		var bounding = this._frame.getFrameClientRect(),
		    position = this._frame.getPosition();

		var reference = this._reference = {
			height: bounding.height,
			width: bounding.width,
		};

		// x
		switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.BOTTOM_LEFT:
				reference.screenX = bounding.right;
				break;

			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.BOTTOM_MIDDLE:
				reference.screenX = bounding.left + reference.width / 2;
				break;

			case L.larva.frame.Rect.TOP_RIGHT:
			case L.larva.frame.Rect.MIDDLE_RIGHT:
			case L.larva.frame.Rect.BOTTOM_RIGHT:
				reference.screenX = bounding.left;
				break;
		}

		// y
		switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.TOP_RIGHT:
				reference.screenY = bounding.bottom;
				break;

			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.MIDDLE_RIGHT:
				reference.screenY = bounding.top + reference.height / 2;
				break;

			case L.larva.frame.Rect.BOTTOM_LEFT:
			case L.larva.frame.Rect.BOTTOM_MIDDLE:
			case L.larva.frame.Rect.BOTTOM_RIGHT:
				reference.screenY = bounding.top;
				break;
		}

		// invertX
		switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.BOTTOM_LEFT:
				reference.invertX = true;
		}

		// invertY
		switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.TOP_RIGHT:
				reference.invertY = true;
		}


		reference.point = this.layerPointToWorldPoint(
			reference.screenX - bounding.left + position.x,
			reference.screenY - bounding.top + position.y
		);

		switch (evt.handle) {
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.BOTTOM_MIDDLE:
				delete reference.screenX;
				break;

			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.MIDDLE_RIGHT:
				delete reference.screenY;
				break;
		}


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

	_scaleOf: function (evt) {
		var event = L.larva.getSourceEvent(evt);

		var x = null, y = null;

		if (this._reference.screenX !== undefined) {
			x = (event.clientX - this._reference.screenX) / this._reference.width;
			if (this._reference.invertX) {
				x = -x;
			}
		}

		if (this._reference.screenY !== undefined) {
			y = (event.clientY - this._reference.screenY) / this._reference.height;
			if (this._reference.invertY) {
				y = -y;
			}
		}

		if (x !== null && y !== null && event.ctrlKey) {
			var xyscale = Math.max(Math.abs(x), Math.abs(y));

			x = x >= 0 ? xyscale : -xyscale;
			y = y >= 0 ? xyscale : -xyscale;
		}

		return {x: x, y: y, ref: this._reference.point};
	},
	/**
	 * @param  {L.Point} original
	 * @param  {L.Point} transformed
	 * @param  {Number} [xscale=null]
	 * @param  {Number} [yscale=null]
	 */
	_transformPoint: function (original, transformed, scale) {

		if (scale.x !== null) {
			transformed.x = scale.ref.x + scale.x * (original.x - scale.ref.x);
		}

		if (scale.y !== null) {
			transformed.y = scale.ref.y + scale.y * (original.y - scale.ref.y);
		}
	},

	_unTransformPoint: function (original, transformed, scale) {

		if (scale.x !== null) {
			transformed.x = ((original.x - scale.ref.x) / scale.x) + scale.ref.x;
		}

		if (scale.y !== null) {
			transformed.y = ((original.y - scale.ref.y) / scale.y) + scale.ref.y;
		}

	}
});

L.Polyline.addInitHook(function () {
	this.larva.resize = new L.larva.handler.Polyline.Resize(this, L.larva.frame.RECT_STYLE.RESIZE);
});