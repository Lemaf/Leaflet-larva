/**
 * @requires Polygon.js
 * @requires ../frame/Path.js
 * @requires ../frame/Style.js
 * @requires ../ext/L.Polyline.js
 */
L.larva.handler.Polyline.Resize = L.larva.handler.Polyline.extend({

	addHooks: function () {
		this._frame = L.larva.frame.path(this._path).addTo(this._path._map);

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	transformPoint: function (original, transformed, xscale, yscale) {

		if (xscale !== null) {
			transformed.x = this._origin.layerX + xscale * (original.x - this._origin.layerX);
		}

		if (yscale !== null) {
			transformed.y = this._origin.layerY + yscale * (original.y - this._origin.layerY);
		}
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd, this);

		delete this._origin;
	},

	_onMove: function (evt) {

		var event = evt.sourceEvent.touches ? evt.sourceEvent.touches[0] : evt.sourceEvent;

		var xscale = null, yscale = null;

		if (this._origin.x !== undefined) {
			xscale = (event.clientX - this._origin.x) / this._origin.width;
			if (this._origin.invertX) {
				xscale = -xscale;
			}
		}

		if (this._origin.y !== undefined) {
			yscale = (event.clientY - this._origin.y) / this._origin.height;
			if (this._origin.invertY) {
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

		var bounding = this._frame.getFrameClientRect(),
		    position = this._frame.getPosition();

		var origin = this._origin = {
			height: bounding.height,
			width: bounding.width,
		};

		switch (evt.handle) {
			case L.larva.frame.Path.TOP_LEFT:
				origin.x = bounding.right;
				origin.y = bounding.bottom;
				origin.invertX = origin.invertY = true;

				origin.layerX = position.x + bounding.width;
				origin.layerY = position.y + bounding.height;
				break;

			case L.larva.frame.Path.TOP_MIDDLE:
				origin.y = bounding.bottom;
				origin.invertY = true;

				origin.layerY = position.y + bounding.height;
				break;

			case L.larva.frame.Path.TOP_RIGHT:
				origin.x = bounding.left;
				origin.y = bounding.bottom;
				origin.invertY = true;

				origin.layerX = position.x;
				origin.layerY = position.y + bounding.height;
				break;

			case L.larva.frame.Path.MIDDLE_LEFT:
				origin.x = bounding.right;
				origin.invertX = true;

				origin.layerX = position.x + bounding.width;
				break;

			case L.larva.frame.Path.MIDDLE_RIGHT:
				origin.x = bounding.left;

				origin.layerX = position.x;
				break;

			case L.larva.frame.Path.BOTTOM_LEFT:
				origin.x = bounding.right;
				origin.y = bounding.top;
				origin.invertX = true;

				origin.layerX = position.x + bounding.width;
				origin.layerY = position.y;
				break;

			case L.larva.frame.Path.BOTTOM_MIDDLE:
				origin.y = bounding.top;

				origin.layerY = position.y;
				break;

			case L.larva.frame.Path.BOTTOM_RIGHT:
				origin.x = bounding.left;
				origin.y = bounding.top;

				origin.layerX = position.x;
				origin.layerY = position.y;
				break;

			default:
				return;
		}

		this.backupLatLngs();

		this._frame
			.on('drag:move', this._onMove, this)
			.on('drag:end', this._onEnd, this);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.resize = new L.larva.handler.Polyline.Resize(this, L.larva.frame.Style.Resize);
});