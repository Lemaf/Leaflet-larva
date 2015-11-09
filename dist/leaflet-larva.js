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
		initialize: function (path, frameStyle, options) {
			L.setOptions(this, options);
			this._path = path;
			this._frameStyle = frameStyle;
		}
	});
	L.Path.addInitHook(function () {
		this.larva = {};
	});
	/**
	 * @requires Path.js
	 */
	L.larva.handler.Polyline = L.larva.handler.Path.extend({ options: {} });
	L.larva.frame = {};
	/**
	 * @requires package.js
	 */
	L.larva.frame.Path = L.Layer.extend({
		statics: {
			TOP_LEFT: 'tl',
			TOP_MIDDLE: 'tm',
			TOP_RIGHT: 'tl',
			MIDDLE_LEFT: 'ml',
			MIDDLE_MIDDLE: 'mm',
			MIDDLE_RIGHT: 'mr',
			BOTTOM_LEFT: 'bl',
			BOTTOM_MIDDLE: 'bm',
			BOTTOM_RIGHT: 'br'
		},
		options: { pane: 'llarvaPathframe' },
		initialize: function (path) {
			if (path._pathFrame && path._pathFrame instanceof L.larva.frame.Path) {
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
			return { zoom: this._updateFrame };
		},
		getDraggable: function () {
			return this._draggable;
		},
		getPosition: function () {
			return L.DomUtil.getPosition(this._el);
		},
		hideHandle: function () {
			for (var i = 0; i < arguments.length; i++) {
				if (this._handles[arguments[i]]) {
					this._handles[arguments[i]].style.display = 'none';
				}
			}
		},
		onAdd: function () {
			var el = this._el = L.DomUtil.create('div', 'llarva-pathframe', this.getPane());
			L.DomEvent.on(el, 'mousedown', L.DomEvent.stop);
			this._handles = {};
			[
				'tl',
				'tm',
				'tr',
				'ml',
				'mm',
				'mr',
				'bl',
				'bm',
				'br'
			].forEach(function (id) {
				this._handles[id] = L.DomUtil.create('div', 'llarva-pathframe-' + id, el);
				L.DomEvent.on(this._handles[id], 'mousedown click', L.DomEvent.stop);
			}, this);
			this._draggables = {};
			this._draggable = new L.Draggable(el);
			this._updateFrame();
			this._updateHandles();
		},
		onRemove: function () {
			var id;
			if (this._draggable) {
				this._draggable.disable();
			}
			for (id in this._draggables) {
				this._draggables[id].disable();
			}
			L.DomEvent.off(this._el, 'mousedown click', L.DomEvent.stop);
			for (id in this._handles) {
				L.DomEvent.off(this._handles[id], 'mousedown click', L.DomEvent.stop);
			}
			L.DomUtil.remove(this._el);
			L.DomUtil.empty(this._el);
			delete this._el;
		},
		setStyle: function (style) {
			var id, el, oldStyle = this._style;
			for (id in this._handles) {
				el = this._handles[id];
				el.style.display = 'block';
				if (this._draggables[id]) {
					this._draggables[id].disable();
					delete this._draggables[id];
				}
				if (oldStyle) {
					L.DomUtil.removeClass(el, oldStyle.className + '-' + id);
				}
				L.DomUtil.addClass(el, style.className + '-' + id);
				if (style[id]) {
					if (style[id].hide) {
						el.style.display = 'none';
					}
					if (style[id].draggable) {
						this._draggables[id] = new L.Draggable(el);
						this._draggables[id].enable();
						L.DomEvent.off(el, 'mousedown click', L.DomEvent.stop);
						this._updateDraggable(id);
					}
				}
			}
			if (oldStyle) {
				L.DomUtil.removeClass(this._el, oldStyle.className);
			}
			L.DomUtil.addClass(this._el, style.className);
			this._style = style;
		},
		_updateDraggable: function (id) {
			var el = this._handles[id];
			var left = el.offsetLeft, top = el.offsetTop;
			if (el.style.marginLeft) {
				left -= parseInt(el.style.marginLeft);
			}
			if (el.style.marginTop) {
				top -= parseInt(el.style.marginTop);
			}
			L.extend(el.style, {
				left: '0px',
				top: '0px'
			});
			L.DomUtil.setPosition(el, L.point(left, top));
		},
		_updateFrame: function () {
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
			el = this._handles.br;
			right = -(widthOf(el) / 2) - borderWidth.right + 'px';
			bottom = -(heightOf(el) / 2) - borderWidth.bottom + 'px';
			L.extend(el.style, {
				right: right,
				bottom: bottom
			});
			el = this._handles.bm;
			left = -(widthOf(el) / 2) + 'px';
			bottom = -(heightOf(el) / 2) - borderWidth.bottom + 'px';
			L.extend(el.style, {
				left: '50%',
				'margin-left': left,
				bottom: bottom
			});
			el = this._handles.bl;
			left = -(widthOf(el) / 2) - borderWidth.left + 'px';
			bottom = -(heightOf(el) / 2) - borderWidth.bottom + 'px';
			L.extend(el.style, {
				left: left,
				bottom: bottom
			});
			el = this._handles.mm;
			left = -(widthOf(el) / 2) + 'px';
			top = -(heightOf(el) / 2) + 'px';
			L.extend(el.style, {
				top: '50%',
				left: '50%',
				'margin-left': left,
				'margin-top': top
			});
			el = this._handles.ml;
			top = -(heightOf(el) / 2) + 'px';
			left = -(widthOf(el) / 2) - borderWidth.left + 'px';
			L.extend(el.style, {
				top: '50%',
				'margin-top': top,
				left: left
			});
			el = this._handles.mr;
			right = -(widthOf(el) / 2) - borderWidth.right + 'px';
			top = -(heightOf(el) / 2) + 'px';
			L.extend(el.style, {
				right: right,
				top: '50%',
				'margin-top': top
			});
			el = this._handles.tr;
			right = -(widthOf(el) / 2) - borderWidth.right + 'px';
			top = -(heightOf(el) / 2) - borderWidth.top + 'px';
			L.extend(el.style, {
				right: right,
				top: top
			});
			el = this._handles.tm;
			top = -(heightOf(el) / 2) - borderWidth.top + 'px';
			left = -(widthOf(el) / 2) + 'px';
			L.extend(el.style, {
				left: '50%',
				'margin-left': left,
				top: top
			});
			el = this._handles.tl;
			top = -(heightOf(el) / 2) - borderWidth.top + 'px';
			left = -(widthOf(el) / 2) - borderWidth.left + 'px';
			L.extend(el.style, {
				left: left,
				top: top
			});
		}
	});
	L.larva.pathFrame = function pathframe(path) {
		return new L.larva.frame.Path(path);
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
	 * @requires package.js
	 */
	L.larva.frame.Style = {};
	L.larva.frame.Style.Move = {
		className: 'llarva-pathframe-move',
		tl: { hide: true },
		tr: { hide: true },
		mm: { hide: true },
		bl: { hide: true },
		br: { hide: true }
	};
	L.larva.frame.Style.Resize = {
		className: 'llarva-pathframe-resize',
		mm: { hide: true }
	};
	L.larva.frame.Style.Rotate = {
		className: 'llarva-pathframe-rotate',
		mm: { draggable: true }
	};
	/**
	 * @requires Polyline.js
	 * @requires ../frame/Path.js
	 * @requires ../ext/L.Polyline.js
	 * @requires ../frame/Style.js
	 * 
	 * @type {[type]}
	 */
	L.larva.handler.Polyline.Move = L.larva.handler.Polyline.extend({
		addHooks: function () {
			this._frame = L.larva.pathFrame(this._path).addTo(this._path._map);
			this._frame.setStyle(this._frameStyle);	// this._draggable = this._frame.getDraggable();
                                           // this._draggable.on({
                                           // 	drag: this._onDrag,
                                           // 	dragstart: this._onDragStart,
                                           // 	dragend: this._onDragEnd,
                                           // }, this);
                                           // this._draggable.enable();
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
		this.larva.move = new L.larva.handler.Polyline.Move(this, L.larva.frame.Style.Move);
	});
}());
//# sourceMappingURL=leaflet-larva.js.map
