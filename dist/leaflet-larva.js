(function () {
	L.larva = { version: '0.1.0' };
	L.larva.handler = {};
	/**
	 * @requires package.js
	 * 
	 * Base class for Path handlers
	 */
	L.larva.handler.Path = L.Handler.extend({
		includes: [L.Evented.prototype],
		initialize: function (path, options) {
			L.setOptions(this, options);
			this._path = path;
		}
	});
	/**
	 * @requires Path.js
	 */
	L.larva.handler.Polyline = L.larva.handler.Path.extend({ options: {} });
	L.larva.PathFrame = L.Layer.extend({
		options: { pane: 'llarva' },
		initialize: function (path) {
			this._path = path;
		},
		beforeAdd: function (map) {
			if (!map.getPane(this.options.pane)) {
				map.createPane(this.options.pane);
			}
		},
		getEvents: function () {
			return { zoom: this._onZoom };
		},
		getDraggable: function () {
			return this._draggable;
		},
		getPosition: function () {
			return L.DomUtil.getPosition(this._el);
		},
		onAdd: function () {
			var el = this._el = L.DomUtil.create('div', 'llarva-pathframe', this.getPane());
			L.DomEvent.on(el, 'mousedown', L.DomEvent.stop);
			this._draggable = new L.Draggable(el);
			this._onZoom();
		},
		_onZoom: function () {
			var bounds = this._path.getBounds();
			var southEastPoint = this._map.latLngToLayerPoint(bounds.getSouthEast()), northWestPoint = this._map.latLngToLayerPoint(bounds.getNorthWest());
			L.DomUtil.setPosition(this._el, northWestPoint);
			this._el.style.width = southEastPoint.x - northWestPoint.x + 'px';
			this._el.style.height = southEastPoint.y - northWestPoint.y + 'px';
			this.southEastPoint = southEastPoint;
			this.northWestPoint = northWestPoint;
		}
	});
	L.Polyline.include({
		forEachLatLng: function (fn, context) {
			var latlngs = this.getLatLngs();
			if (!latlngs.length) {
				return;
			}
			if (Array.isArray(latlngs[0])) {
				// nested array
				latlngs = latlngs.reduce(function (array, latlngs) {
					return array.concat(latlngs);
				}, []);
			}
			latlngs.forEach(fn, context);
		}
	});
	/**
	 * @requires Polyline.js
	 * @requires ../PathFrame.js
	 * @requires ../ext/L.Polyline.js
	 * 
	 * @type {[type]}
	 */
	L.larva.handler.Polyline.Move = L.larva.handler.Polyline.extend({
		addHooks: function () {
			this._frame = new L.larva.PathFrame(this._path).addTo(this._path._map);
			this._draggable = this._frame.getDraggable();
			this._draggable.on({
				drag: this._onDrag,
				dragstart: this._onDragStart,
				dragend: this._onDragEnd
			}, this);
			this._draggable.enable();
		},
		_onDrag: function () {
			var map = this._path._map;
			var offset = this._frame.getPosition().subtract(this._layerProjectedPoint);
			var projected, newLatLng;
			console.log(offset);
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
}());
//# sourceMappingURL=leaflet-larva.js.map
