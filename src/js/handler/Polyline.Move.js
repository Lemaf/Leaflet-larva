/**
 * @requires Polyline.js
 * @requires ../frame/Path.js
 * @requires ../frame/Style.js
 * @requires ../ext/L.Polyline.js
 * 
 * @type {[type]}
 */
L.larva.handler.Polyline.Move = L.larva.handler.Polyline.extend({

	addHooks: function() {
		this._frame = L.larva.frame.path(this._path).addTo(this._path._map);
		this._frame.on('drag:start', this._onStart, this);
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd);
	},

	_onMove: function (evt) {
		var event = evt.sourceEvent.touches ? evt.sourceEvent.touches : evt.sourceEvent;
		var dx = event.clientX - this._startPosition.x,
		    dy = event.clientY - this._startPosition.y;

		if (event.ctrlKey && event.altKey) {
			var dxy = Math.min(Math.abs(dx), Math.abs(dy));

			dx = dx >= 0 ? dxy : -dxy;
			dy = dy >= 0 ? dxy : -dxy;
		} else if (event.ctrlKey) {
			dy = null;
		} else if (event.altKey) {
			dx = null;
		}

		var projected, newLatLng;

		this._path.forEachLatLng(function (latlng) {
			projected = this._path._map.latLngToLayerPoint(latlng._original);

			if (dx) {
				projected.x += dx;
			}

			if (dy) {
				projected.y += dy;
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
		if (!evt.handle) {
			this._path.forEachLatLng(function (latlng) {
				latlng._original = latlng.clone();
			});

			var event = evt.sourceEvent.touches ? 
			                    evt.sourceEvent.touches[0] : evt.sourceEvent;

			this._startPosition = {
				x: event.clientX,
				y: event.clientY
			};

			this._frame
				.on('drag:move', this._onMove, this)
				.on('drag:end', this._onEnd, this);
		}

	}

});

L.Polyline.addInitHook(function () {
	this.larva.move = new L.larva.handler.Polyline.Move(this, L.larva.frame.Style.Move);
});