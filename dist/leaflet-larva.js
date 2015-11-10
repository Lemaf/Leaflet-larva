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
	/**
	 * @requires Polyline.js
	 */
	L.larva.handler.Polygon = L.larva.handler.Polyline.extend({});
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
	if (!L.Polyline.prototype.updateBounds) {
		L.Polyline.include({
			updateBounds: function () {
				var bounds = this._bounds = new L.LatLngBounds();
				this.forEachLatLng(function (latlng) {
					bounds.extend(latlng);
				});
			}
		});
	}
	L.larva.frame = {};
	/**
	 * @requires package.js
	 */
	L.larva.frame.Path = L.Layer.extend({
		statics: {
			TOP_LEFT: 'tl',
			TOP_MIDDLE: 'tm',
			TOP_RIGHT: 'tr',
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
		getFrameClientRect: function () {
			return this._el.getBoundingClientRect();
		},
		getHandle: function (id) {
			return this._handles[id];
		},
		getPosition: function (id) {
			if (id) {
				return L.DomUtil.getPosition(this._handles[id]);
			} else {
				return L.DomUtil.getPosition(this._el);
			}
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
			L.DomEvent.on(el, 'mousedown', this._onStart, this);
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
				this._handles[id] = L.DomUtil.create('div', 'llarva-' + id, el);
				this._handles[id]._id = id;
				L.DomEvent.on(this._handles[id], L.Draggable.START.join(' '), this._onStart, this);
			}, this);
			this._draggable = new L.Draggable(el);
			this._draggables = {};
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
				// if (oldStyle) {
				// 	L.DomUtil.removeClass(el, oldStyle.className + '-' + id);
				// }
				// L.DomUtil.addClass(el, style.className + '-' + id);
				if (style[id]) {
					if (style[id].hide) {
						el.style.display = 'none';
					}
					if (style[id].draggable) {
						this._draggables[id] = new L.Draggable(el);
						this._draggables[id].enable();
						L.DomEvent.off(el, 'mousedown click', L.DomEvent.stop);
					}
				}
			}
			if (oldStyle) {
				L.DomUtil.removeClass(this._el, oldStyle.className);
			}
			L.DomUtil.addClass(this._el, style.className);
			this._style = style;
			this._updateHandles();
			for (id in this._draggables) {
				this._updateDraggable(id);
			}
		},
		updateBounds: function () {
			this._updateFrame();
		},
		_onStart: function (evt) {
			L.DomEvent.stop(evt);
			this.fire('drag:start', {
				sourceEvent: evt,
				id: evt.target._id
			});
			L.DomEvent.on(document, L.Draggable.MOVE[evt.type], this._onMove, this).on(document, L.Draggable.END[evt.type], this._onEnd, this);
			L.DomUtil.addClass(document.body, 'leaflet-dragging');
		},
		_onMove: function (evt) {
			L.DomEvent.stop(evt);
			this.fire('drag:move', { sourceEvent: evt });
		},
		_onEnd: function (evt) {
			L.DomEvent.stop(evt);
			for (var id in L.Draggable.MOVE) {
				L.DomEvent.off(document, L.Draggable.MOVE[id], this._onMove, this).off(document, L.Draggable.END[id], this._onEnd, this);
			}
			L.DomUtil.removeClass(document.body, 'leaflet-dragging');
			this.fire('drag:end', { sourceEvent: evt });
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
	L.larva.frame.path = function pathframe(path) {
		return new L.larva.frame.Path(path);
	};
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
		tm: { hide: true },
		ml: { hide: true },
		mr: { hide: true },
		bm: { hide: true },
		mm: { draggable: true }
	};
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
			this._frame.off('drag:move', this._onMove, this).off('drag:end', this._onEnd, this);
		},
		_onMove: function (evt) {
			var position = evt.sourceEvent.touches ? evt.sourceEvent.touches[0] : evt.sourceEvent;
			var centerBounding = this._centerElement.getBoundingClientRect();
			var cx = centerBounding.left + centerBounding.width / 2, cy = centerBounding.top + centerBounding.height / 2;
			var i = position.clientX - cx, j = position.clientY - cy;
			var crossProduct = this._vector.i * j + this._vector.j * i;
			var sin = crossProduct / Math.sqrt(i * i + j * j);
			var cos = Math.sqrt(1 - sin * sin);
			var deg = Math.acos(cos) * 180 / Math.PI;
			console.log(deg);
			var frameBounding = this._frame.getFrameClientRect(), framePosition = this._frame.getPosition();
			cx = cx - frameBounding.left + framePosition.x;
			cy = cy - frameBounding.top + framePosition.y;
			var dx = cx * (1 - cos) + cy * sin, dy = cy * (1 - cos) - cx * sin;
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
			var centerBounding = centerElement.getBoundingClientRect(), targetBounding = evt.sourceEvent.target.getBoundingClientRect();
			var vector = this._vector = {
				i: targetBounding.left + targetBounding.width / 2 - (centerBounding.left - centerBounding.width / 2),
				j: targetBounding.top + targetBounding.height / 2 - (centerBounding.top - centerBounding.height / 2)
			};
			vector.length = Math.sqrt(vector.i * vector.i + vector.j * vector.j);
			vector.i = vector.i / vector.length;
			vector.j = vector.j / vector.length;
			this._path.forEachLatLng(function (latlng) {
				latlng._original = latlng.clone();
			});
			this._frame.on('drag:move', this._onMove, this).on('drag:end', this._onEnd, this);
		}
	});
	L.Polyline.addInitHook(function () {
		this.larva.rotate = new L.larva.handler.Polyline.Rotate(this, L.larva.frame.Style.Rotate);
	});
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
			this._frame = L.larva.frame.path(this._path).addTo(this._path._map);
			this._frame.setStyle(this._frameStyle);
			this._frame.on('drag:start', this._onDragStart, this);
			this._frame.on('drag:move', this._onDragMove, this);
			this._frame.on('drag:end', this._onDragEnd, this);
		},
		_onDragEnd: function () {
		},
		_onDragMove: function (evt) {
			var mouseEvt = evt.sourceEvent;
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
			var mouseEvt = evt.sourceEvent;
			var startPos = mouseEvt.touches && mouseEvt.touches[0] ? mouseEvt.touches[0] : mouseEvt;
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
			this._frame.on('drag:start', this._onDragStart, this);
			this._frame.on('drag:move', this._onDragMove, this);
			this._frame.on('drag:end', this._onDragEnd, this);
		},
		_onDragEnd: function () {
		},
		_onDragMove: function (evt) {
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
					yscale = xscale = Math.max(Math.abs(xscale), Math.abs(yscale));
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
		_onDragStart: function (evt) {
			this._path.forEachLatLng(function (latlng) {
				latlng._original = latlng.clone();
			});
			var bounding = this._frame.getFrameClientRect();
			var origin = this._origin = {
				height: bounding.height,
				width: bounding.width
			};
			var position = this._frame.getPosition();
			switch (evt.id) {
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
		}
	});
	L.Polyline.addInitHook(function () {
		this.larva.resize = new L.larva.handler.Polyline.Resize(this, L.larva.frame.Style.Resize);
	});
}());
//# sourceMappingURL=leaflet-larva.js.map
