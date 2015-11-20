/**
 * @requires ../frame/Rect.js
 * @requires ../frame/RECT_STYLE.js
 * @requires ../ext/L.Polyline.js
 * 
 * @requires Polyline.Transform.js
 */
L.larva.handler.Polyline.Resize = L.larva.handler.Polyline.Transform.extend({

	addHooks: function () {
		this._frame = L.larva.frame.rect(this._path).addTo(this.getMap());

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	transformPoint: function (original, transformed, xscale, yscale) {

		if (xscale !== null) {
			transformed.x = this._reference.point.x + xscale * (original.x - this._reference.point.x);
		}

		if (yscale !== null) {
			transformed.y = this._reference.point.y + yscale * (original.y - this._reference.point.y);
		}
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd, this);

		delete this._reference;
	},

	_onMove: function (evt) {

		var event = L.larva.getSourceEvent(evt);

		var xscale = null, yscale = null;

		if (this._reference.screenX !== undefined) {
			xscale = (event.clientX - this._reference.screenX) / this._reference.width;
			if (this._reference.invertX) {
				xscale = -xscale;
			}
		}

		if (this._reference.screenY !== undefined) {
			yscale = (event.clientY - this._reference.screenY) / this._reference.height;
			if (this._reference.invertY) {
				yscale = -yscale;
			}
		}

		if (xscale !== null && yscale !== null && event.ctrlKey) {
			var xyscale = Math.max(Math.abs(xscale), Math.abs(yscale));

			xscale = xscale >= 0 ? xyscale : -xyscale;
			yscale = yscale >= 0 ? xyscale : -xyscale;
		}

		this.transform(xscale, yscale);
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

		this._frame
			.on('drag:move', this._onMove, this)
			.on('drag:end', this._onEnd, this);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.resize = new L.larva.handler.Polyline.Resize(this, L.larva.frame.RECT_STYLE.RESIZE);
});