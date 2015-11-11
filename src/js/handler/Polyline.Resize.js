/**
 * @requires Polygon.js
 * @requires ../frame/Path.js
 * @requires ../ext/L.Polyline.js
 * @requires ../frame/Style.js
 */
L.larva.handler.Polyline.Resize = L.larva.handler.Polyline.extend({

	addHooks: function () {
		this._frame = L.larva.frame.path(this._path).addTo(this._path._map);

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd, this);

		delete this._origin;
	},

	_onMove: function (evt) {
		var position = evt.sourceEvent.touches ? evt.sourceEvent.touches[0] : evt.sourceEvent;


		var xscale = null, yscale = null;

		if (this._origin.screenX !== undefined) {
			xscale = (position.clientX - this._origin.screenX) / this._origin.width;
		}

		if (this._origin.screenY !== undefined) {
			yscale = (position.clientY - this._origin.screenY) / this._origin.height;
		}

		if (xscale === null && yscale === null) {
			return;
		}

		if (xscale !== null && yscale !== null) {
			if (evt.sourceEvent.ctrlKey) {
				var xyscale = Math.max(Math.abs(xscale), Math.abs(yscale));

				xscale = xscale >= 0 ? xyscale : -xyscale;
				yscale = yscale >= 0 ? xyscale : -xyscale;

				if (this._origin.invertX) {
					xscale = -xscale;
				}

				if (this._origin.invertY) {
					yscale = -yscale;
				}
			}
		}

		var projected, newLatLng;

		this._path.forEachLatLng(function (latlng) {
			projected = this._path._map.latLngToLayerPoint(latlng._original);

			if (xscale !== null) {
				if (this._origin.invertX) {
					projected.x = this._origin.x - projected.x;
				} else {
					projected.x = projected.x - this._origin.x;
				}

				projected.x = projected.x * xscale + this._origin.x;
			}


			if (yscale !== null) {

				if (this._origin.invertY) {
					projected.y = this._origin.y - projected.y;
				} else {
					projected.y = projected.y - this._origin.y;
				}

				projected.y = projected.y * yscale + this._origin.y;
			}

			newLatLng = this._path._map.layerPointToLatLng(projected);
			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
		}, this);

		this._path.updateBounds();
		this._frame.updateBounds();
		this._path.redraw();

	},

	_onStart: function (evt) {

		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});


		var bounding = this._frame.getFrameClientRect();

		var origin = this._origin = {
			height: bounding.height,
			width: bounding.width
		};

		var position = this._frame.getPosition();

		switch (evt.handle) {
			case L.larva.frame.Path.TOP_LEFT:
				origin.x = position.x + bounding.width;
				origin.y = position.y + bounding.height;
				origin.screenX = bounding.right;
				origin.screenY = bounding.bottom;
				origin.invertX = true;
				origin.invertY = true;
				break;

			case L.larva.frame.Path.TOP_MIDDLE:
				origin.y = position.y + bounding.height;
				origin.screenY = bounding.bottom;
				origin.invertY = true;
				break;

			case L.larva.frame.Path.TOP_RIGHT:
				origin.x = position.x;
				origin.y = position.y + bounding.height;
				origin.screenX = bounding.left;
				origin.screenY = bounding.bottom;
				origin.invertY = true;
				break;

			case L.larva.frame.Path.MIDDLE_LEFT:
				origin.x = position.x + bounding.width;
				origin.screenX = bounding.right;
				origin.invertX = true;
				break;

			case L.larva.frame.Path.MIDDLE_RIGHT:
				origin.x = position.x;
				origin.screenX = bounding.left;
				break;

			case L.larva.frame.Path.BOTTOM_LEFT:
				origin.x = position.x + bounding.width;
				origin.y = position.y;
				origin.screenX = bounding.right;
				origin.screenY = bounding.top;
				origin.invertX = true;
				break;

			case L.larva.frame.Path.BOTTOM_MIDDLE:
				origin.y = position.y;
				origin.screenY = bounding.top;
				break;

			case L.larva.frame.Path.BOTTOM_RIGHT:
				origin.x = position.x;
				origin.y = position.y;
				origin.screenY = bounding.top;
				origin.screenX = bounding.left;
				break;
		}

		this._frame
			.on('drag:move', this._onMove, this)
			.on('drag:end', this._onEnd, this);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.resize = new L.larva.handler.Polyline.Resize(this, L.larva.frame.Style.Resize);
});