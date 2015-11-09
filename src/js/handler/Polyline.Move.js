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

		this._frame.on('drag:start', this._onDragStart, this);
		this._frame.on('drag:move', this._onDragMove, this);
		this._frame.on('drag:end', this._onDragEnd, this);
	},

	_onDragEnd: function () {
	},

	_onDragMove: function (evt) {
		var mouseEvt = evt.mouseEvent;
		var pos = mouseEvt.touches && mouseEvt.touches[0] ? mouseEvt.touches[0] : mouseEvt;

		var dx = 0, dy = 0;

		if (this._axis === undefined) {
			dx = pos.clientX - this._startPoint.x;
			dy = pos.clientY - this._startPoint.y;
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

	_onDragStart: function (evt) {
		this._startNorthWest = this._path.getBounds().getNorthWest();
		var mouseEvt = evt.mouseEvent;
		var startPos = mouseEvt.touches && mouseEvt.touches[0] ? mouseEvt.touches[0]: mouseEvt;
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
	}

});

L.Polyline.addInitHook(function () {
	this.larva.move = new L.larva.handler.Polyline.Move(this, L.larva.frame.Style.Move);
});