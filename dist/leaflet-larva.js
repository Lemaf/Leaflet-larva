(function () {
	L.larva = {
		version: '0.1.0',
		getHeight: function (el) {
			return el.offsetHeight;
		},
		getWidth: function (el) {
			return el.offsetWidth;
		}
	};
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
	/**
	 * 
	 */
	L.larva.PathFrame = L.Layer.extend({
		options: { pane: 'llarvaPathframe' },
		initialize: function (path) {
			if (path._pathFrame && path._pathFrame instanceof L.larva.PathFrame) {
				return path._pathFrame;
			}
			path._pathFrame = this;
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
			this._elements = {
				tl: null,
				tm: null,
				tr: null,
				ml: null,
				mm: null,
				mr: null,
				bl: null,
				bm: null,
				br: null
			};
			for (var id in this._elements) {
				this._elements[id] = L.DomUtil.create('div', 'llarva-pathframe-' + id + ' ' + id, el);
			}
			this._draggable = new L.Draggable(el);
			this._updateHandles();
			this._onZoom();
		},
		_onZoom: function () {
			var bounds = this._path.getBounds();
			var southEastPoint = this._map.latLngToLayerPoint(bounds.getSouthEast()), northWestPoint = this._map.latLngToLayerPoint(bounds.getNorthWest());
			var computedStyle = getComputedStyle(this._el);
			L.DomUtil.setPosition(this._el, northWestPoint);
			var x = parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.borderRightWidth), y = parseInt(computedStyle.borderTopWidth) + parseInt(computedStyle.borderBottomWidth);
			this._el.style.width = southEastPoint.x - northWestPoint.x - x + 'px';
			this._el.style.height = southEastPoint.y - northWestPoint.y - y + 'px';
			this.southEastPoint = southEastPoint;
			this.northWestPoint = northWestPoint;
		},
		_updateHandles: function () {
			var el, computedStyle, right, bottom, left, top;
			var widthOf = L.larva.getWidth, heightOf = L.larva.getHeight;
			computedStyle = getComputedStyle(this._el);
			var borderWidth = {
				bottom: 'borderBottomWidth',
				left: 'borderLeftWidth',
				right: 'borderRightWidth',
				top: 'borderTopWidth'
			};
			for (var id in borderWidth) {
				borderWidth[id] = parseInt(computedStyle[borderWidth[id]]) / 2;
			}
			el = this._elements.br;
			right = -(widthOf(el) / 2) - borderWidth.right + 'px';
			bottom = -(heightOf(el) / 2) - borderWidth.bottom + 'px';
			L.extend(el.style, {
				right: right,
				bottom: bottom
			});
			el = this._elements.bm;
			left = -(widthOf(el) / 2) + 'px';
			bottom = -(heightOf(el) / 2) - borderWidth.bottom + 'px';
			L.extend(el.style, {
				left: '50%',
				'margin-left': left,
				bottom: bottom
			});
			el = this._elements.bl;
			left = -(widthOf(el) / 2) - borderWidth.left + 'px';
			bottom = -(heightOf(el) / 2) - borderWidth.bottom + 'px';
			L.extend(el.style, {
				left: left,
				bottom: bottom
			});
			el = this._elements.mm;
			left = -(widthOf(el) / 2) + 'px';
			top = -(heightOf(el) / 2) + 'px';
			L.extend(el.style, {
				top: '50%',
				left: '50%',
				'margin-left': left,
				'margin-top': top
			});
			el = this._elements.ml;
			top = -(heightOf(el) / 2) + 'px';
			left = -(widthOf(el) / 2) - borderWidth.left + 'px';
			L.extend(el.style, {
				top: '50%',
				'margin-top': top,
				left: left
			});
			el = this._elements.mr;
			right = -(widthOf(el) / 2) - borderWidth.right + 'px';
			top = -(heightOf(el) / 2) + 'px';
			L.extend(el.style, {
				right: right,
				top: '50%',
				'margin-top': top
			});
			el = this._elements.tr;
			right = -(widthOf(el) / 2) - borderWidth.right + 'px';
			top = -(heightOf(el) / 2) - borderWidth.top + 'px';
			L.extend(el.style, {
				right: right,
				top: top
			});
			el = this._elements.tm;
			top = -(heightOf(el) / 2) - borderWidth.top + 'px';
			left = -(widthOf(el) / 2) + 'px';
			L.extend(el.style, {
				left: '50%',
				'margin-left': left,
				top: top
			});
			el = this._elements.tl;
			top = -(heightOf(el) / 2) - borderWidth.top + 'px';
			left = -(widthOf(el) / 2) - borderWidth.left + 'px';
			L.extend(el.style, {
				left: left,
				top: top
			});
		}
	});
	L.larva.pathFrame = function pathframe(path) {
		return new L.larva.PathFrame(path);
	};
	if (!L.Polyline.prototype.forEachLatLng) {
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
	}
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
