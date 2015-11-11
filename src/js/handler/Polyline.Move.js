/**
 * @requires Polyline.js
 * @requires ../frame/Path.js
 * @requires ../ext/L.Polyline.js
 * @requires ../frame/Style.js
 * 
 * @type {[type]}
 */
L.larva.handler.Polyline.Move = L.larva.handler.Polyline.extend({

	addHooks: function() {
		this._frame = L.larva.frame.path(this._path).addTo(this._path._map);

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd);
	},

	_onMove: function (evt) {
		var sourceEvent = evt.sourceEvent;
		var pos = sourceEvent.touches && sourceEvent.touches[0] ? sourceEvent.touches[0] : sourceEvent;

		var dx = 0, dy = 0;

		if (this._axis === undefined) {
			dx = pos.clientX - this._startPoint.x;
			dy = pos.clientY - this._startPoint.y;

			if (sourceEvent.ctrlKey) {
				var dxy = Math.min(Math.abs(dx), Math.abs(dy));

				dx = dx >= 0 ? dxy : -dxy;
				dy = dy >= 0 ? dxy : -dxy;
			}
		} else {
			if (this._axis === 'x') {
				dx = pos.clientX - this._startPoint.x;
			} else if (this._axis === 'y') {
				dy = pos.clientY - this._startPoint.y;
			}
		}

		if (dx === 0 && dy === 0) {
			return;
		}

		var vector = L.point(dx, dy), projected, newLatLng;

		this._path.forEachLatLng(function (latlng) {
			projected = this._path._map.latLngToLayerPoint(latlng._original);
			projected = projected.add(vector);
			newLatLng = this._path._map.layerPointToLatLng(projected);
			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
		}, this);

		this._path.updateBounds();
		this._frame.updateBounds();
		this._path.redraw();

	},

	_onStart: function (evt) {
		this._startNorthWest = this._path.getBounds().getNorthWest();
		var sourceEvent = evt.sourceEvent;
		var startPos = sourceEvent.touches && sourceEvent.touches[0] ? sourceEvent.touches[0]: sourceEvent;
		
		this._startPoint = L.point(startPos.clientX, startPos.clientY);

		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});

		switch (evt.id) {
			case L.larva.frame.Path.TOP_MIDDLE:
			case L.larva.frame.Path.BOTTOM_MIDDLE:
				this._axis = 'y';
				break;

			case L.larva.frame.Path.MIDDLE_LEFT:
			case L.larva.frame.Path.MIDDLE_RIGHT:
				this._axis = 'x';
				break;

			default:
				delete this._axis;
		}

		this._frame
			.on('drag:move', this._onMove, this)
			.on('drag:end', this._onEnd, this);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.move = new L.larva.handler.Polyline.Move(this, L.larva.frame.Style.Move);
});