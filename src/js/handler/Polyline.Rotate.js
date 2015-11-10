/**
 * @requires Polygon.js
 * @requires ../ext/L.Polyline.js
 * @requires ../frame/Path.js
 * @requires ../frame/Style.js
 */

L.larva.handler.Polyline.Rotate = L.larva.handler.Polyline.extend({

	addHooks: function () {
		this._frame = new L.larva.frame.Path(this._path);
		this._frame.addTo(this._path._map);

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd, this);
	},

	_onMove: function (evt) {
		var position = evt.sourceEvent.touches ? evt.sourceEvent.touches[0] : evt.sourceEvent;

		var centerBounding = this._centerElement.getBoundingClientRect();

		var cx = (centerBounding.left + centerBounding.width / 2),
		    cy = (centerBounding.top + centerBounding.height / 2);


		var i = position.clientX - cx,
		    j = position.clientY - cy;

		var crossProduct = this._vector.i * j + this._vector.j * i;

		var sin = crossProduct / Math.sqrt(i * i + j * j);
		var cos = Math.sqrt(1 - (sin * sin));

		var deg = Math.acos(cos) * 180 / Math.PI;

		console.log(deg);

		var frameBounding = this._frame.getFrameClientRect(),
		    framePosition = this._frame.getPosition();

		cx =  (cx - frameBounding.left) + framePosition.x;
		cy = (cy - frameBounding.top) + framePosition.y;


		var dx = cx * (1 - cos) + cy * sin,
		    dy = cy * (1 - cos) - cx * sin;

		var projected, newLatLng;

		this._path.forEachLatLng(function (latlng) {
			projected = this._path._map.latLngToLayerPoint(latlng._original);

			projected.x = projected.x * cos - projected.y * sin + dx;
			projected.y = projected.x * sin + projected.y * cos + dy;

			newLatLng = this._path._map.layerPointToLatLng(projected);
			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
		}, this);

		this._path.updateBounds();
		//this._frame.updateBounds();
		this._path.redraw();
	},

	_onStart: function (evt) {
		if (!evt.id || evt.id === L.larva.frame.Path.MIDDLE_MIDDLE) {
			return;
		}

		var centerElement = this._centerElement = this._frame.getHandle(L.larva.frame.Path.MIDDLE_MIDDLE);

		var centerBounding = centerElement.getBoundingClientRect(),
		    targetBounding = evt.sourceEvent.target.getBoundingClientRect();

		var vector = this._vector = {
			i: (targetBounding.left + targetBounding.width / 2) - (centerBounding.left - centerBounding.width / 2),
			j: (targetBounding.top + targetBounding.height / 2) - (centerBounding.top - centerBounding.height / 2)
		};

		vector.length = Math.sqrt(vector.i * vector.i + vector.j * vector.j);

		vector.i = vector.i / vector.length;
		vector.j = vector.j / vector.length;

		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});

		this._frame
			.on('drag:move', this._onMove, this)
			.on('drag:end', this._onEnd, this);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.rotate = new L.larva.handler.Polyline.Rotate(this, L.larva.frame.Style.Rotate);
});