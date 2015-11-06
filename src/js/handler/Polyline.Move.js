/**
 * @requires Polyline.js
 * @requires ../frame/Path.js
 * @requires ../ext/L.Polyline.js
 * 
 * @type {[type]}
 */
L.larva.handler.Polyline.Move = L.larva.handler.Polyline.extend({

	addHooks: function() {
		this._frame = L.larva.pathFrame(this._path).addTo(this._path._map);
		this._draggable = this._frame.getDraggable();

		this._frame.hideHandle(L.larva.frame.Path.MIDDLE_MIDDLE);

		this._draggable.on({
			drag: this._onDrag,
			dragstart: this._onDragStart,
			dragend: this._onDragEnd,
		}, this);

		this._draggable.enable();
	},

	_onDrag: function () {
		var map = this._path._map;
		var offset = this._frame.getPosition().subtract(this._layerProjectedPoint);
		var projected, newLatLng;

		this._path.forEachLatLng(function (latlng) {

			projected = map.latLngToLayerPoint(latlng._original);
			newLatLng = map.layerPointToLatLng(projected.add(offset));
			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
		});

		this._path.setLatLngs(this._path.getLatLngs());
	},

	_onDragEnd: function () {

	},

	_onDragStart: function () {
		this._layerProjectedPoint = this._path._map.latLngToLayerPoint(this._path.getBounds().getNorthWest());
		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});
	}

});

L.Polyline.addInitHook(function () {

	if (!this.larva) {
		this.larva = {};
	}

	this.larva.move = new L.larva.handler.Polyline.Move(this);

});