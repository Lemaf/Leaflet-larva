(function () {
	L.larva = {
		version: '0.1.1',
		CTRL_KEY: 17,
		NOP: function () {
		},
		/**
		* @param  {Event} event
		* @return {Number}
		*/
		getEventKeyCode: function (event) {
			return event.keyCode || event.key;
		},
		/**
		* @param  {HTMLElement} el
		* @return {Number}
		*/
		getHeight: function (el) {
			return el.offsetHeight;
		},
		/**
		* @param  {L.Event} evt
		* @return {Event}
		*/
		getSourceEvent: function (evt) {
			if (evt.sourceEvent) {
				evt = evt.sourceEvent;
			}
			return !evt.touches ? evt : evt.touches[0];
		},
		/**
		* @param  {HTMLElement} el
		* @return {Number}
		*/
		getWidth: function (el) {
			return el.offsetWidth;
		},
		/**
		* @param  {L.LatLng[]}  latlngs
		* @return {Boolean}
		*/
		isFlat: function (latlngs) {
			if (Array.isArray(latlngs)) {
				if (latlngs[0] instanceof L.LatLng) {
					return true;
				}
			}
			return false;
		},
		project: function (latlng) {
			var point = L.Projection.Mercator.project(latlng);
			point.y = 0 - point.y;
			return point;
		},
		unproject: function (point) {
			point = point.clone();
			point.y = 0 - point.y;
			return L.Projection.Mercator.unproject(point);
		}
	};
	/**
	 * @namespace L.larva.frame
	 */
	L.larva.frame = {};
	/**
	 * @requires package.js
	 *
	 */
	/**
	 * @class 
	 * Rectangle frame, create a frame to layer edition with handlers
	 * 
	 * @extends L.Layer
	 *
	 * @param {L.Path} path
	 * @param {Object} [options]
	 * @param {String} options.pane Where in leaflet pane
	 */
	L.larva.frame.Rect = L.Layer.extend(/** @lends L.larva.frame.Rect.prototype */
	{
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
		options: { pane: 'llarva-frame' },
		initialize: function (path) {
			this._path = path;
		},
		beforeAdd: function (map) {
			if (!map.getPane(this.options.pane)) {
				map.createPane(this.options.pane);
			}
		},
		/**
		* Returns Computed CSS Style of an handler
		* @param  {String} id
		* @return {CSSStyleDeclaration}
		*/
		getComputedStyle: function (id) {
			if (id) {
				if (this._handles[id]) {
					return getComputedStyle(this._handles[id]);
				}
			} else {
				return getComputedStyle(this._el);
			}
		},
		getEvents: function () {
			return { zoom: this._onMapZoom };
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
			L.DomEvent.on(el, L.Draggable.START.join(' '), this._onStart, this);
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
			this._updateFrame(false);
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
		setElementStyle: function (styles, element) {
			if (!element) {
				L.extend(this._el.style, styles);
			} else {
				element = this._handles[element];
				if (element) {
					L.extend(element.style, styles);
				}
			}
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
			this._updateFrame(false, Array.prototype.slice.call(arguments, 0));
		},
		_onEnd: function (evt) {
			L.DomEvent.stop(evt);
			for (var id in L.Draggable.MOVE) {
				L.DomEvent.off(document, L.Draggable.MOVE[id], this._onMove, this).off(document, L.Draggable.END[id], this._onEnd, this);
			}
			L.DomUtil.removeClass(document.body, 'leaflet-dragging');
			this.fire('drag:end', { sourceEvent: evt });
		},
		_onMapZoom: function () {
			this._updateFrame(true);
		},
		_onMove: function (evt) {
			L.DomEvent.stop(evt);
			this.fire('drag:move', { sourceEvent: evt });
		},
		_onStart: function (evt) {
			L.DomEvent.stop(evt);
			this.fire('drag:start', {
				sourceEvent: evt,
				handle: evt.target._id
			});
			L.DomEvent.on(document, L.Draggable.MOVE[evt.type], this._onMove, this).on(document, L.Draggable.END[evt.type], this._onEnd, this);
			L.DomUtil.addClass(document.body, 'leaflet-dragging');
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
		_updateFrame: function (zoomChanged, maintainHandles) {
			var id, currentPosition = L.DomUtil.getPosition(this._el), handle, handlePosition;
			var bounds = this._path.getBounds();
			var southEastPoint = this._map.latLngToLayerPoint(bounds.getSouthEast()), northWestPoint = this._map.latLngToLayerPoint(bounds.getNorthWest());
			var computedStyle = getComputedStyle(this._el);
			if (maintainHandles && currentPosition && maintainHandles.length) {
				for (var i = 0; i < maintainHandles.length; i++) {
					handle = this._handles[maintainHandles[i]];
					if (handle && (handlePosition = L.DomUtil.getPosition(handle))) {
						handlePosition = handlePosition.add(currentPosition);
						L.DomUtil.setPosition(handle, handlePosition.subtract(northWestPoint));
					}
				}
			}
			L.DomUtil.setPosition(this._el, northWestPoint);
			var x = parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.borderRightWidth), y = parseInt(computedStyle.borderTopWidth) + parseInt(computedStyle.borderBottomWidth);
			var oldWidth, oldHeight;
			if (zoomChanged) {
				oldWidth = L.larva.getWidth(this._el);
				oldHeight = L.larva.getHeight(this._el);
			}
			this._el.style.width = southEastPoint.x - northWestPoint.x - x + 'px';
			this._el.style.height = southEastPoint.y - northWestPoint.y - y + 'px';
			if (zoomChanged) {
				for (id in this._handles) {
					handle = this._handles[id];
					handlePosition = L.DomUtil.getPosition(handle);
					if (handlePosition) {
						L.DomUtil.setPosition(handle, handlePosition.scaleBy(L.point(L.larva.getWidth(this._el) / oldWidth, L.larva.getHeight(this._el) / oldHeight)));
					}
				}
			}
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
	L.larva.frame.rect = function (path) {
		if (path && path._rectFrame) {
			return path._rectFrame;
		}
		return path._rectFrame = new L.larva.frame.Rect(path);
	};
	/**
	 * @requires package.js
	 */
	/**
	 * 
	 * **L.larva.frame.RECT_STYLE.RESIZE**
	 *
	 * *Resizable* frame properties
	 *
	 * **L.larva.frame.RECT_STYLE.ROTATE**
	 *
	 * *Rotateable* frame properties
	 * 
	 */
	L.larva.frame.RECT_STYLE = {};
	L.larva.frame.RECT_STYLE.RESIZE = {
		className: 'llarva-pathframe-resize',
		mm: { hide: true }
	};
	L.larva.frame.RECT_STYLE.ROTATE = {
		className: 'llarva-pathframe-rotate',
		tm: { hide: true },
		ml: { hide: true },
		mr: { hide: true },
		bm: { hide: true },
		mm: { draggable: true }
	};
	/**
	 * @external "L.Polyline"
	 */
	if (!L.Polyline.prototype.forEachLatLng) {
		L.Polyline.include({
			/**
			 * @memberOf external:"L.Polyline"
			 * @instance
			 * @param  {Function} fn ({L.LatLng}, {L.LatLng[]})
			 * @param  {Any}   context
			 */
			forEachLatLng: function (fn, context) {
				var i = 0, j, latlngs = this.getLatLngs();
				if (L.larva.isFlat(latlngs)) {
					for (; i < latlngs.length; i++) {
						fn.call(context, latlngs[i], latlngs);
					}
				} else {
					for (; i < latlngs.length; i++) {
						for (j = 0; j < latlngs[i].length; j++) {
							fn.call(context, latlngs[i][j], latlngs[i]);
						}
					}
				}
			}
		});
	}
	if (!L.Polyline.prototype.updateBounds) {
		L.Polyline.include({
			/**
			 * @memberOf external:"L.Polyline"
			 * @instance
			 */
			updateBounds: function () {
				var bounds = this._bounds = new L.LatLngBounds();
				this.forEachLatLng(function (latlng) {
					bounds.extend(latlng);
				});
			}
		});
	}
	if (!L.Polyline.prototype.getType) {
		L.extend(L.Polyline, {
			POLYLINE: 1,
			MULTIPOLYLINE: 2
		});
		L.Polyline.include({
			/**
			 * @memberOf external:"L.Polyline"
			 * @instance
			 * @returns {Number}
			 *
			 * Value | Type
			 * ------|-----
			 * 1 | Polyline
			 * 2 | MultiPolyline
			 */
			getType: function () {
				return Array.isArray(this._latlngs[0]) ? L.Polyline.MULTIPOLYLINE : L.Polyline.POLYLINE;
			}
		});
	}
	L.Polyline.include({
		/**
		* @memberOf external:"L.Polyline"
		* @instance
		* @param  {Function} fn
		* @param  {Any}   context
		*/
		forEachLine: function (fn, context) {
			switch (this.getType()) {
			case L.Polyline.POLYLINE:
			case L.Polyline.MULTIPOLYLINE:
				if (!Array.isArray(this._latlngs[0])) {
					fn.call(context, this._latlngs);
				} else {
					for (var i = 0; i < this._latlngs.length; i++) {
						fn.call(context, this._latlngs[i]);
					}
				}
				break;
			default:
				throw new Error('Invalid geometry type!');
			}
		}
	});
	/**
	 * All larva handlers
	 * 
	 * @namespace L.larva.handler
	 */
	L.larva.handler = {};
	/**
	 * @requires package.js
	 */
	/**
	 * @class Base class for layers handlers
	 * 
	 * @extends L.Handler
	 * @mixes L.Evented
	 *
	 * @param {L.Path} path layer to handle
	 * @param {Object} options
	 */
	L.larva.handler.Path = L.Handler.extend(/** @lends L.larva.handler.Path.prototype */
	{
		includes: [L.Evented.prototype],
		initialize: function (path, options) {
			L.setOptions(this, options);
			this._path = path;
		},
		/**
		* @return {L.Map}
		*/
		getMap: function () {
			return this._path._map;
		},
		/**
		* @param  {Number} x
		* @param  {Number} y
		* @return {L.Point} 
		*/
		layerPointToWorldPoint: function (a, b) {
			return L.larva.project(this.unproject(a, b));
		},
		/**
		* @param  {Number} x layer x
		* @param  {Number} y layer y
		* @return {L.LatLng}
		*/
		unproject: function (a, b) {
			if (b !== undefined) {
				return this.getMap().layerPointToLatLng(L.point(a, b));
			} else {
				return this.getMap().layerPointToLatLng(a);
			}
		}
	});
	L.Path.addInitHook(function () {
		this.larva = {};
	});
	/**
	 * @requires Path.js
	 */
	/**
	 * @class Polyline Handler base class
	 *
	 * @extends {L.larva.handler.Path}
	 */
	L.larva.handler.Polyline = L.larva.handler.Path.extend(/** @lends L.larva.handler.Polyline.prototype */
	{
		/**
		* Backup all latlngs
		*/
		backupLatLngs: function () {
			this._path.forEachLatLng(function (latlng) {
				latlng._original = latlng.clone();
			});
		}
	});
	/**
	 * @requires Polyline.js
	 */
	/**
	 * @class Base class for every LatLng transformer
	 *
	 * @extends {L.larva.handler.Polyline}
	 *
	 * @param {L.Path} path Layer to transform
	 * @param {L.larva.frame.Style} frameStyle, @see {L.larva.frame}
	 * @param {Object} options
	 */
	L.larva.handler.Polyline.Transform = L.larva.handler.Polyline.extend(/** @lends L.larva.handler.Polyline.Transform.prototype */
	{
		options: { noUpdate: [] },
		initialize: function (path, frameStyle, options) {
			L.larva.handler.Polyline.prototype.initialize.call(this, path, options);
			this._frameStyle = frameStyle;
		},
		/**
		* Transform each layer point
		* @param {...Object}
		*/
		transform: function () {
			var transformed = L.point(0, 0), original, newLatLng;
			var args = [
				null,
				transformed
			].concat(Array.prototype.slice.call(arguments, 0));
			this._path.forEachLatLng(function (latlng) {
				original = args[0] = L.larva.project(latlng._original);
				transformed.x = original.x;
				transformed.y = original.y;
				this.transformPoint.apply(this, args);
				newLatLng = L.larva.unproject(transformed);
				latlng.lat = newLatLng.lat;
				latlng.lng = newLatLng.lng;
			}, this);
			this._path.updateBounds();
			this._frame.updateBounds.apply(this._frame, this.options.noUpdate);
			this._path.redraw();
		},
		/**
		* @abstract
		* @param {L.Point} original Original point
		* @param {L.Point} transformed Point transformed
		* @param {...Object}
		*/
		transformPoint: function () {
			throw new Error('Unsupported Operation!');
		}
	});
	/**
	 * @requires ../frame/Rect.js
	 * @requires ../frame/RECT_STYLE.js
	 * @requires ../ext/L.Polyline.js
	 * 
	 * @requires Polyline.Transform.js
	 */
	/**
	 * @class Rotate polygon
	 *
	 * @extends {L.larva.handler.Polyline.Transform}
	 */
	L.larva.handler.Polyline.Rotate = L.larva.handler.Polyline.Transform.extend(/** @lends L.larva.handler.Polyline.Transform.prototype */
	{
		options: { noUpdate: [L.larva.frame.Rect.MIDDLE_MIDDLE] },
		addHooks: function () {
			this._frame = L.larva.frame.rect(this._path);
			this._frame.addTo(this.getMap());
			this._frame.setStyle(this._frameStyle);
			this._frame.on('drag:start', this._onStart, this);
		},
		/**
		* @param  {L.Point} original
		* @param  {L.Point} transformed
		* @param  {Number} sin
		* @param  {Number} cos
		* @param  {Number} dx
		* @param  {Number} dy
		*/
		transformPoint: function (original, transformed, sin, cos, dx, dy) {
			transformed.x = original.x * cos - original.y * sin + dx;
			transformed.y = original.x * sin + original.y * cos + dy;
		},
		_onEnd: function () {
			this._frame.off('drag:move', this._onMove, this).off('drag:end', this._onEnd, this);
		},
		_onMove: function (evt) {
			var position = L.larva.getSourceEvent(evt);
			var centerBounding = this._centerElement.getBoundingClientRect();
			var cx = centerBounding.left + centerBounding.width / 2, cy = centerBounding.top + centerBounding.height / 2;
			var i = position.clientX - cx, j = position.clientY - cy;
			var length = Math.sqrt(i * i + j * j);
			// cross product
			var sin = (this._vector.i * j - this._vector.j * i) / length;
			// scalar product
			var cos = (this._vector.i * i + this._vector.j * j) / length;
			var frameBounding = this._frame.getFrameClientRect(), framePosition = this._frame.getPosition();
			cx = cx - frameBounding.left + framePosition.x;
			cy = cy - frameBounding.top + framePosition.y;
			var worldCenterPoint = this.layerPointToWorldPoint(cx, cy);
			var dx = worldCenterPoint.x * (1 - cos) + worldCenterPoint.y * sin;
			var dy = worldCenterPoint.y * (1 - cos) - worldCenterPoint.x * sin;
			this.transform(sin, cos, dx, dy);
		},
		_onStart: function (evt) {
			if (!evt.handle || evt.handle === L.larva.frame.Rect.MIDDLE_MIDDLE) {
				return;
			}
			var centerElement = this._centerElement = this._frame.getHandle(L.larva.frame.Rect.MIDDLE_MIDDLE);
			var centerBounding = centerElement.getBoundingClientRect(), targetBounding = evt.sourceEvent.target.getBoundingClientRect();
			var vector = this._vector = {
				i: targetBounding.left + targetBounding.width / 2 - (centerBounding.left - centerBounding.width / 2),
				j: targetBounding.top + targetBounding.height / 2 - (centerBounding.top - centerBounding.height / 2)
			};
			vector.length = Math.sqrt(vector.i * vector.i + vector.j * vector.j);
			vector.i = vector.i / vector.length;
			vector.j = vector.j / vector.length;
			vector.length = 1;
			this.backupLatLngs();
			this._frame.on('drag:move', this._onMove, this).on('drag:end', this._onEnd, this);
		}
	});
	L.Polyline.addInitHook(function () {
		this.larva.rotate = new L.larva.handler.Polyline.Rotate(this, L.larva.frame.RECT_STYLE.ROTATE);
	});
	/**
	 * @requires ../frame/Rect.js
	 * @requires ../frame/RECT_STYLE.js
	 * @requires ../ext/L.Polyline.js
	 * 
	 * @requires Polyline.Transform.js
	 */
	/**
	 * @class Move layer
	 *
	 * @extends {L.larva.handler.Polyline.Transform}
	 */
	L.larva.handler.Polyline.Move = L.larva.handler.Polyline.Transform.extend(/** @lends L.larva.handler.Polyline.Move.prototype */
	{
		addHooks: function () {
			this._frame = L.larva.frame.rect(this._path).addTo(this.getMap());
			this._frame.on('drag:start', this._onStart, this);
			this._previousCursor = this._frame.getComputedStyle().cursor;
			this._frame.setElementStyle({ cursor: 'move' });
		},
		/**
		* @param  {L.Point} original
		* @param  {L.Point} transformed
		* @param  {Number} dx
		* @param  {Number} dy
		*/
		transformPoint: function (original, transformed, dx, dy) {
			if (dx) {
				transformed.x = original.x + dx;
			}
			if (dy) {
				transformed.y = original.y + dy;
			}
		},
		_getEventWorldPoint: function (event) {
			var bounding = this._frame.getFrameClientRect(), position = this._frame.getPosition();
			return L.larva.project(this.unproject(event.clientX - bounding.left + position.x, event.clientY - bounding.top + position.y));
		},
		_onEnd: function () {
			this._frame.off('drag:move', this._onMove, this).off('drag:end', this._onEnd);
		},
		_onMove: function (evt) {
			var event = L.larva.getSourceEvent(evt);
			var worldPoint = this._getEventWorldPoint(event);
			var dx = worldPoint.x - this._startPosition.x, dy = worldPoint.y - this._startPosition.y;
			if (event.ctrlKey && event.altKey) {
				var dxy = Math.min(Math.abs(dx), Math.abs(dy));
				dx = dx >= 0 ? dxy : -dxy;
				dy = dy >= 0 ? dxy : -dxy;
			} else if (event.altKey) {
				dy = null;
			} else if (event.ctrlKey) {
				dx = null;
			}
			this.transform(dx, dy);
		},
		_onStart: function (evt) {
			if (!evt.handle) {
				this.backupLatLngs();
				this._startPosition = this._getEventWorldPoint(L.larva.getSourceEvent(evt));
				this._frame.on('drag:move', this._onMove, this).on('drag:end', this._onEnd, this);
			}
		}
	});
	L.Polyline.addInitHook(function () {
		this.larva.move = new L.larva.handler.Polyline.Move(this);
	});
	/**
	 * @requires ../frame/Rect.js
	 * @requires ../frame/RECT_STYLE.js
	 * @requires ../ext/L.Polyline.js
	 * 
	 * @requires Polyline.Transform.js
	 */
	/**
	 * @class Resize layer
	 *
	 * @extends {L.larva.handler.Polyline.Transform}
	 * 
	 */
	L.larva.handler.Polyline.Resize = L.larva.handler.Polyline.Transform.extend(/** @lends L.larva.handler.Polyline.Resize.prototype */
	{
		addHooks: function () {
			this._frame = L.larva.frame.rect(this._path).addTo(this.getMap());
			this._frame.setStyle(this._frameStyle);
			this._frame.on('drag:start', this._onStart, this);
		},
		/**
		* @param  {L.Point} original
		* @param  {L.Point} transformed
		* @param  {Number} [xscale=null]
		* @param  {Number} [yscale=null]
		*/
		transformPoint: function (original, transformed, xscale, yscale) {
			if (xscale !== null) {
				transformed.x = this._reference.point.x + xscale * (original.x - this._reference.point.x);
			}
			if (yscale !== null) {
				transformed.y = this._reference.point.y + yscale * (original.y - this._reference.point.y);
			}
		},
		_onEnd: function () {
			this._frame.off('drag:move', this._onMove, this).off('drag:end', this._onEnd, this);
			delete this._reference;
		},
		_onMove: function (evt) {
			var event = L.larva.getSourceEvent(evt);
			var xscale = null, yscale = null;
			if (this._reference.screenX !== undefined) {
				xscale = (event.clientX - this._reference.screenX) / this._reference.width;
				if (this._reference.invertX) {
					xscale = -xscale;
				}
			}
			if (this._reference.screenY !== undefined) {
				yscale = (event.clientY - this._reference.screenY) / this._reference.height;
				if (this._reference.invertY) {
					yscale = -yscale;
				}
			}
			if (xscale !== null && yscale !== null && event.ctrlKey) {
				var xyscale = Math.max(Math.abs(xscale), Math.abs(yscale));
				xscale = xscale >= 0 ? xyscale : -xyscale;
				yscale = yscale >= 0 ? xyscale : -xyscale;
			}
			this.transform(xscale, yscale);
		},
		_onStart: function (evt) {
			if (!evt.handle || evt.handle === L.larva.frame.Rect.MIDDLE_MIDDLE) {
				return;
			}
			var bounding = this._frame.getFrameClientRect(), position = this._frame.getPosition();
			var reference = this._reference = {
				height: bounding.height,
				width: bounding.width
			};
			// x
			switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.BOTTOM_LEFT:
				reference.screenX = bounding.right;
				break;
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.BOTTOM_MIDDLE:
				reference.screenX = bounding.left + reference.width / 2;
				break;
			case L.larva.frame.Rect.TOP_RIGHT:
			case L.larva.frame.Rect.MIDDLE_RIGHT:
			case L.larva.frame.Rect.BOTTOM_RIGHT:
				reference.screenX = bounding.left;
				break;
			}
			// y
			switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.TOP_RIGHT:
				reference.screenY = bounding.bottom;
				break;
			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.MIDDLE_RIGHT:
				reference.screenY = bounding.top + reference.height / 2;
				break;
			case L.larva.frame.Rect.BOTTOM_LEFT:
			case L.larva.frame.Rect.BOTTOM_MIDDLE:
			case L.larva.frame.Rect.BOTTOM_RIGHT:
				reference.screenY = bounding.top;
				break;
			}
			// invertX
			switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.BOTTOM_LEFT:
				reference.invertX = true;
			}
			// invertY
			switch (evt.handle) {
			case L.larva.frame.Rect.TOP_LEFT:
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.TOP_RIGHT:
				reference.invertY = true;
			}
			reference.point = this.layerPointToWorldPoint(reference.screenX - bounding.left + position.x, reference.screenY - bounding.top + position.y);
			switch (evt.handle) {
			case L.larva.frame.Rect.TOP_MIDDLE:
			case L.larva.frame.Rect.BOTTOM_MIDDLE:
				delete reference.screenX;
				break;
			case L.larva.frame.Rect.MIDDLE_LEFT:
			case L.larva.frame.Rect.MIDDLE_RIGHT:
				delete reference.screenY;
				break;
			}
			this.backupLatLngs();
			this._frame.on('drag:move', this._onMove, this).on('drag:end', this._onEnd, this);
		}
	});
	L.Polyline.addInitHook(function () {
		this.larva.resize = new L.larva.handler.Polyline.Resize(this, L.larva.frame.RECT_STYLE.RESIZE);
	});
	/**
	 * @requires L.Polyline.js
	 */
	/**
	 * @external "L.Polygon"
	 * @see {@link external:"L.Polyline" Extends L.Polyline}
	 */
	L.extend(L.Polygon, {
		POLYGON: 3,
		MULTIPOLYGON: 4
	});
	L.Polygon.include({
		/**
		* @memberOf external:"L.Polygon"
		* @instance
		* @returns {Number}
		*
		* Value|Type
		* -----|----
		* 3| Polygon
		* 4| MultiPolygon
		*/
		getType: function () {
			var latlngs = this._latlngs;
			if (latlngs.length) {
				if (!L.larva.isFlat(latlngs[0])) {
					return L.Polygon.MULTIPOLYGON;
				}
			}
			return L.Polygon.POLYGON;
		},
		/**
		* @memberOf external:"L.Polygon"
		* @instance
		* @param  {Function} fn      ({L.LatLng}, {L.LatLng[]}, hole? {Boolean})
		* @param  {Any}   context
		*/
		forEachLatLng: function (fn, context) {
			var i = 0, j, k, polygons = [], polygon, hole, latlngs = this.getLatLngs();
			if (L.larva.isFlat(latlngs[0])) {
				polygons.push(latlngs);
			} else {
				polygons = latlngs;
			}
			for (; i < polygons.length; i++) {
				polygon = polygons[i];
				for (j = 0; j < polygon.length; j++) {
					hole = j > 0;
					for (k = 0; k < polygon[j].length; k++) {
						fn.call(context, polygon[j][k], polygon[j], hole);
					}
				}
			}
		},
		/**
		* @memberOf external:"L.Polygon"
		* @instance
		* @param  {Function} fn
		* @param  {Any}   context
		*/
		forEachPolygon: function (fn, context) {
			var latlngs = this._latlngs;
			switch (this.getType()) {
			case L.Polygon.POLYGON:
				if (context) {
					fn.call(context, latlngs[0], latlngs.slice(1));
				} else {
					fn(latlngs[0], latlngs.slice(1));
				}
				break;
			case L.Polygon.MULTIPOLYGON:
				for (var i = 0, l = latlngs.length; i < l; i++) {
					if (context) {
						fn.call(context, latlngs[i][0], latlngs[i].slice(1));
					} else {
						fn(latlngs[i][0], latlngs[i].slice(1));
					}
				}
				break;
			}
		}
	});
	/**
	 * @class
	 *
	 * Style class with helper methods
	 *
	 * Example:
	 * 
	 * ```js
	 *
	 * 	var polygon = L.polygon(latlngs, {
	 * 		fillOpacity: 0.5,
	 * 		fillColor: '#ABABAB'
	 * 	});
	 * 
	 * 	var style = L.larva.style(polygon);
	 *
	 * 	style.multiplyBy({
	 * 		fillColor: [1, 0.5, 2],
	  * 	}).subtract({
	  * 		fillOpacity: 0.2
	  * 	});
	 *
	 * 	polygon.setStyle(style);
	 * 
	 * ```
	 * @param {(L.Path | L.larva.Style | Object)} source
	 *
	 */
	L.larva.Style = L.Class.extend(/** @lends L.larva.Style.prototype */
	{
		statics: {
			STYLES: [
				'fillOpacity',
				'fillColor',
				'color',
				'opacity'
			],
			TYPE: {
				fillOpacity: 'number',
				opacity: 'number',
				fillColor: 'color',
				color: 'color'
			}
		},
		initialize: function (source) {
			if (source instanceof L.Path) {
				source = source.options;
			}
			L.larva.Style.STYLES.forEach(function (styleName) {
				this[styleName] = source[styleName];
			}, this);
		},
		/**
		* @param  {Object} style
		* @return {L.larva.Style} this
		*/
		subtract: function (styles) {
			return this._transform(styles, function (cV, d) {
				return cV - d;
			});
		},
		/**
		* @param  {Object} style
		* @return {L.larva.Style} this
		*/
		multiplyBy: function (styles) {
			return this._transform(styles, function (cV, d) {
				return cV * d;
			});
		},
		_transform: function (styles, transfom) {
			var styleName, currentValue, delta;
			for (styleName in styles) {
				if (styleName in this) {
					currentValue = this[styleName];
					delta = styles[styleName];
					switch (L.larva.Style.TYPE[styleName]) {
					case 'color':
						var rgb = L.larva.Style.getRGB(currentValue);
						if (rgb) {
							rgb[0] = transfom(rgb[0], delta[0]);
							rgb[1] = transfom(rgb[1], delta[1]);
							rgb[2] = transfom(rgb[2], delta[2]);
							rgb = rgb.map(L.larva.Style.convertColorComponent);
							currentValue = '#' + rgb.join('');
						}
						break;
					case 'number':
						currentValue = transfom(currentValue, delta);
						break;
					}
					this[styleName] = currentValue;
				}
			}
			return this;
		}
	});
	/**
	 * @memberOf L.larva.Style
	 * @param  {String} color
	 * @return {Array} [r, g, b]
	 */
	L.larva.Style.getRGB = function (color) {
		if (!color) {
			return;
		}
		var r, g, b;
		if (color.length === 4) {
			r = parseInt(color[1], 16);
			g = parseInt(color[2], 16);
			b = parseInt(color[3], 16);
		} else if (color.length === 7) {
			r = parseInt(color.substr(1, 2), 16);
			g = parseInt(color.substr(3, 2), 16);
			b = parseInt(color.substr(5, 2), 16);
		} else {
			return;
		}
		return [
			r,
			g,
			b
		];
	};
	L.larva.Style.convertColorComponent = function (component) {
		if (component < 0) {
			component = 0;
		} else if (component > 255) {
			component = 255;
		}
		component = parseInt(component).toString(16);
		return component.length === 2 ? component : '0' + component;
	};
	L.larva.style = function (source) {
		return new L.larva.Style(source);
	};
	/**
	 * @requires package.js
	 *
	 * @requires ../ext/L.Polygon.js
	 * @requires ../Style.js
	 */
	/**
	 * @class
	 *
	 * Frame for handle point by point editor
	 * 
	 */
	L.larva.frame.Vertices = L.Layer.extend(/** @lends L.larva.frame.Vertices.prototype */
	{
		statics: {
			MULTIPOLYGON: 4,
			MULTIPOLYLINE: 3,
			POLYGON: 2,
			POLYLINE: 1
		},
		options: {
			colorFactor: [
				0.8,
				1.3,
				0.8
			],
			handleClassName: 'llarva-vertex',
			opacityFactor: 0.8,
			pane: 'llarva-frame',
			tolerance: 10,
			simplifyZoom: -1
		},
		initialize: function (path) {
			this._path = path;
			this._type = this._path.getType();
		},
		beforeAdd: function (map) {
			if (!map.getPane(this.options.pane)) {
				map.createPane(this.options.pane);
			}
		},
		getEvents: function () {
			return {
				moveend: this._updateView,
				zoomend: this._onZoomEnd
			};
		},
		/**
		* Returns handle L.LatLng
		* @param  {String}  handleId
		* @return {L.LatLng}
		*/
		getLatLng: function (handleId) {
			if (this._handles && this._handles[handleId]) {
				return this._handles[handleId]._latlng;
			}
		},
		/**
		* @param  {String} handleId
		* @return {L.LatLng[]}
		*/
		getLatLngs: function (handleId) {
			if (this._handles && this._handles[handleId]) {
				return this._handles[handleId]._latlngs;
			}
		},
		/**
		* Returns handle layer point
		* @param  {String} handleId
		* @return {L.Point}
		*/
		getPoint: function (handleId) {
			if (this._handles && this._handles[handleId]) {
				return this._handles[handleId]._point;
			}
		},
		onAdd: function () {
			this._container = this.getPane();
			this._updateHandles();
			this._updateView();
		},
		onRemove: function () {
			var id, handle;
			if (this._handles) {
				for (id in this._handles) {
					handle = this._handles[id];
					if (handle.offsetParent) {
						L.DomUtil.remove(handle);
					}
				}
				delete this._handles;
			}
			for (id in L.Draggable.MOVE) {
				L.DomEvent.off(document, L.Draggable.MOVE[id], this._onMove, this).off(document, L.Draggable.END[id], this._onEnd, this);
			}
		},
		/**
		* @param  {String} handleId
		*/
		removeHandle: function (handleId) {
			if (this._handles && this._handles[handleId]) {
				var handle = this._handles[handleId];
				L.Draggable.START.forEach(function (evtName) {
					L.DomEvent.off(handle, evtName, this._onStart, this);
				}, this);
				L.DomEvent.off(handle, 'dblclick', this._onHandleDblclick, this);
				if (handle.offsetParent) {
					L.DomUtil.remove(handle);
				}
				var prev = handle._prev, next = handle._next;
				if (prev && next) {
					prev._next = next;
					next._prev = prev;
				} else if (prev !== next) {
					if (prev) {
						// handle is last
						delete prev._next;
						if (handle._isPolygon) {
							prev._first._last = prev;
						}
					} else {
						// handle is first
						delete next._prev;
						if (handle._isPolygon) {
							var first = next;
							do {
								next._first = first;
							} while (next = next._next);
						}
					}
				}
				for (var i = 0, index; i < this._lines.length; i++) {
					if ((index = this._lines[i].handles.indexOf(handle)) >= 0) {
						this._lines[i].handles.splice(index, 1);
						if (this._lines[i].handles.length === 0) {
							this._lines.splice(i, 1);
						}
						break;
					}
				}
				delete this._handles[handleId];
				if (this._aura && this._aura[handleId]) {
					this._map.removeLayer(this._aura[handleId].polyline);
					delete this._aura[handleId];
				}
			}
		},
		/**
		* @param  {String} handleId
		* @returns {Boolean} Does the aura was created?
		*/
		startAura: function (handleId) {
			var handle = this._handles[handleId];
			if (!handle) {
				return false;
			}
			if (!this._aura) {
				this._aura = {};
			}
			if (!this._aura[handleId]) {
				var polyline;
				var latlngs = [], latlng = handle._latlng.clone(), style = L.larva.style(this._path).multiplyBy({
						color: this.options.colorFactor,
						opacity: this.options.opacityFactor
					}), latlng0;
				if (handle._isPolygon) {
					if (handle._prev) {
						latlng0 = handle._prev._latlng;
					} else {
						latlng0 = handle._last._latlng;
					}
					latlngs.push(latlng0.clone());
					latlngs.push(latlng);
					if (handle._next) {
						latlng0 = handle._next._latlng;
					} else {
						latlng0 = handle._first._latlng;
					}
					latlngs.push(latlng0.clone());
				} else {
					if (handle._prev) {
						latlngs.push(handle._prev._latlng.clone());
					}
					latlngs.push(latlng);
					if (handle._next) {
						latlngs.push(handle._next._latlng.clone());
					}
				}
				polyline = L.polyline(latlngs, L.extend({}, style, { noClip: true })).addTo(this._map);
				this._aura[handleId] = {
					isPolygon: !!handle._isPolygon,
					point: handle._point.clone(),
					polyline: polyline,
					latlng: latlng,
					x: this._position.x,
					y: this._position.y
				};
			}
			return true;
		},
		/**
		* 
		*/
		redraw: function () {
			this._updateHandles();
			this._updateView();
			return this;
		},
		/**
		* @param  {String} handleId
		*
		* @returns {L.LatLng} Aura's L.LatLng
		*/
		stopAura: function (handleId) {
			var aura, handle;
			if (this._aura && (aura = this._aura[handleId])) {
				this._map.removeLayer(this._aura[handleId].polyline);
				delete this._aura[handleId];
				handle = this._handles[handleId];
				handle._point = this._map.latLngToLayerPoint(aura.latlng);
				return aura.latlng;
			}
		},
		/**
		* @param  {String} handleId
		*/
		updateHandle: function (handleId) {
			var handle = this._handles[handleId];
			if (handle) {
				delete handle._point;
				this._updateHandlePosition(handle);
			}
		},
		_createHandles: function (latlngs, isPolygon, isHole) {
			var i, handle, prev, handles = [], first;
			for (i = 0; i < latlngs.length; i++) {
				handle = L.DomUtil.create('div', this.options.handleClassName);
				if (isPolygon) {
					handle._isPolygon = true;
				}
				if (isHole) {
					handle._isHole = true;
				}
				handle._latlng = latlngs[i];
				handle._latlng._handle = handle;
				handle._latlngs = latlngs;
				handle._point = this._map.latLngToLayerPoint(handle._latlng);
				L.DomEvent.on(handle, L.Draggable.START.join(' '), this._onStart, this).on(handle, 'dblclick', this._onHandleDblclick, this);
				this._handles[L.stamp(handle)] = handle;
				if (prev) {
					prev._next = handle;
					handle._prev = prev;
					prev = handle;
					if (isPolygon && first) {
						handle._first = first;
					}
				} else {
					first = handle;
					prev = handle;
					handle._first = handle;
				}
				handles.push(handle);
			}
			if (isPolygon) {
				first._last = handle;
			}
			this._lines.push({
				handles: handles,
				isHole: !!isHole,
				isPolygon: !!isPolygon
			});
			return handles;
		},
		_onHandleDblclick: function (evt) {
			L.DomEvent.stop(evt);
			this.fire('handle:dblclick', {
				id: L.stamp(evt.target),
				originalEvent: evt
			});
		},
		_onEnd: function (evt) {
			var id, aura;
			L.DomEvent.stop(evt);
			for (id in L.Draggable.MOVE) {
				L.DomEvent.off(document, L.Draggable.MOVE[id], this._onMove, this).off(document, L.Draggable.END[id], this._onEnd, this);
			}
			L.DomUtil.removeClass(document.body, 'leaflet-dragging');
			try {
				for (id in this._aura) {
					aura = this._aura[id];
					delete this._aura[id];
					this._map.removeLayer(aura.polyline);
					this.fire('aura:end', {
						id: id,
						latlng: aura.latlng
					});
				}
			} finally {
				this.fire('handle:end', { sourceEvent: evt });
			}
		},
		_onMove: function (evt) {
			var aura, handle, id, dx, dy, newPoint, newLatLng;
			L.DomEvent.stop(evt);
			this._position.x = evt.clientX;
			this._position.y = evt.clientY;
			for (id in this._aura) {
				aura = this._aura[id];
				handle = this._handles[id];
				dx = this._position.x - aura.x;
				dy = this._position.y - aura.y;
				newPoint = aura.point.add(L.point(dx, dy));
				newLatLng = this._map.layerPointToLatLng(newPoint);
				aura.latlng.lat = newLatLng.lat;
				aura.latlng.lng = newLatLng.lng;
				aura.polyline.updateBounds();
				aura.polyline.redraw();
				this._updateHandlePosition(handle, newPoint);
			}
			this.fire('handle:move', { sourceEvent: evt });
		},
		_onStart: function (evt) {
			L.DomEvent.stop(evt);
			var sourceEvent = L.larva.getSourceEvent(evt);
			this._position = {
				x: sourceEvent.clientX,
				y: sourceEvent.clientY
			};
			this.fire('handle:start', {
				id: L.stamp(evt.target),
				sourceEvent: evt
			});
			L.DomEvent.on(document, L.Draggable.MOVE[evt.type], this._onMove, this).on(document, L.Draggable.END[evt.type], this._onEnd, this);
			L.DomUtil.addClass(document.body, 'leaflet-dragging');
		},
		_onZoomEnd: function () {
			var id, handle;
			for (id in this._handles) {
				handle = this._handles[id];
				handle._point = this._map.latLngToLayerPoint(handle._latlng);
			}
		},
		_updateHandles: function () {
			var id, handle;
			if (this._handles) {
				for (id in this._handles) {
					handle = this._handles[id];
					L.DomUtil.remove(handle);
				}
			}
			this._handles = {};
			this._lines = [];
			switch (this._type) {
			case L.Polyline.POLYLINE:
			case L.Polyline.MULTIPOLYLINE:
				this._path.forEachLine(function (line) {
					this._createHandles(line);
				}, this);
				break;
			case L.Polygon.POLYGON:
			case L.Polygon.MULTIPOLYGON:
				this._path.forEachPolygon(function (shell, holes) {
					this._createHandles(shell, true);
					holes.forEach(function (latlngs) {
						this._createHandles(latlngs, true, true);
					}, this);
				}, this);
				break;
			default:
				throw new Error('Invalid geometry type - ' + this._type);
			}
		},
		_updateHandlePosition: function (handle, target) {
			var point;
			if (target) {
				point = target.clone();
			} else if (handle._point) {
				point = handle._point.clone();
			} else {
				handle._point = this._map.latLngToLayerPoint(handle._latlng);
				point = handle._point.clone();
			}
			if (handle.offsetParent) {
				point._subtract({
					x: L.larva.getWidth(handle) / 2,
					y: L.larva.getHeight(handle) / 2
				});
			}
			L.DomUtil.setPosition(handle, point);
		},
		_showHandles: function (handles, isPolygon) {
			var pointsToShow;
			var bounds = this._map.getPixelBounds(), pixelOrigin = this._map.getPixelOrigin();
			var points = handles.map(function (handle) {
				var point = handle._point.add(pixelOrigin);
				point._handle = handle;
				return point;
			});
			if (isPolygon) {
				pointsToShow = L.PolyUtil.clipPolygon(points, bounds).filter(function (point) {
					return !!point._handle;
				});
			} else {
				var i, l, lineClip;
				pointsToShow = [];
				for (i = 0, l = points.length - 1; i < l; i++) {
					lineClip = L.LineUtil.clipSegment(points[i], points[i + 1], bounds);
					if (lineClip) {
						if (lineClip[0]._handle) {
							pointsToShow.push(lineClip[0]);
						}
						if (lineClip[1]._handle) {
							pointsToShow.push(lineClip[1]);
						}
					}
				}
			}
			var doSimplify = false;
			if (this.options.simplifyZoom > 0) {
				doSimplify = this._map.getZoom() < this.options.simplifyZoom;
			} else if (this.options.simplifyZoom < 0) {
				doSimplify = this._map.getZoom() < this._map.getMaxZoom() + this.options.simplifyZoom;
			}
			if (doSimplify) {
				pointsToShow = L.LineUtil.simplify(pointsToShow, this.options.tolerance);
			}
			pointsToShow.forEach(function (point) {
				if (!point.offsetParent) {
					this._container.appendChild(point._handle);
				}
				this._updateHandlePosition(point._handle);
			}, this);
		},
		_updateView: function () {
			var id, handle;
			for (id in this._handles) {
				handle = this._handles[id];
				if (handle.offsetParent) {
					L.DomUtil.remove(handle);
				}
			}
			this._lines.forEach(function (line) {
				this._showHandles(line.handles, line.isPolygon, line.isHole);
			}, this);
		}
	});
	/**
	 * @param  {L.Path} path
	 * @memberOf L.larva.frame
	 * @return {L.larva.frame.Vertices}
	 */
	L.larva.frame.vertices = function (path) {
		if (path._verticesFrame) {
			return path._verticesFrame;
		}
		return path._verticesFrame = new L.larva.frame.Vertices(path);
	};
	/**
	 * @requires Polyline.js
	 * @requires ../frame/Vertices.js
	 */
	/**
	 * @class Hand point by point of a layer
	 *
	 * @extends {L.larva.handler.Polyline}
	 */
	L.larva.handler.Polyline.Edit = L.larva.handler.Polyline.extend(/** @lends L.larva.handler.Polyline.prototype */
	{
		options: {
			aura: true,
			maxDist: 10
		},
		addHooks: function () {
			this._frame = L.larva.frame.vertices(this._path).addTo(this.getMap());
			this._frame.on('handle:start', this._onHandleStart, this).on('handle:dblclick', this._onHandleDbclick, this);
			this._path.on('dblclick', this._onDblclick, this);
		},
		removeHooks: function () {
			this.getMap().removeLayer(this._frame);
			this._frame.off('handle:start', this._onHandleStart, this).off('dblclick', this._onDblclick, this);
		},
		_searchNearestPoint: function (point) {
			var found = [], map = this.getMap();
			this._path.forEachLine(function (latlngs) {
				found = found.concat(L.larva.handler.Polyline.Edit.searchNearestPointIn(point, this.options.maxDist, latlngs, map));
			}, this);
			return found;
		},
		_addVertex: function (point) {
			var founds, found, newLatLng;
			founds = this._searchNearestPoint(point);
			if (founds.length) {
				if (founds.length === 1) {
					found = founds[0];
					newLatLng = this.getMap().layerPointToLatLng(found.point);
					found.latlngs.splice(found.index, 0, newLatLng);
					this._path.updateBounds();
					this._path.redraw();
					this._frame.redraw();
				}
			}
		},
		_removeLatLng: function (handleId) {
			var latlng = this._frame.getLatLng(handleId), latlngs = this._path.getLatLngs(), index, i = 0;
			switch (this._path.getType()) {
			case L.Polyline.MULTIPOLYLINE:
				for (; i < latlngs[i].length; i++) {
					if ((index = latlngs[i].indexOf(latlng)) !== -1) {
						if (latlngs[i].length === 2) {
							latlngs.splice(i, 1);
						} else {
							latlngs[i].splice(index, 1);
						}
						break;
					}
				}
				break;
			default:
				if ((index = latlngs.indexOf(latlng)) !== -1) {
					latlngs.splice(index, 1);
					break;
				}
			}
			this._path.updateBounds();
			this._path.redraw();
			this._frame.removeHandle(handleId);
		},
		_onAuraEnd: function (evt) {
			this._frame.off('aura:end', this._onAuraEnd, this);
			var latlng = this._frame.getLatLng(evt.id);
			latlng.lat = evt.latlng.lat;
			latlng.lng = evt.latlng.lng;
			this._path.updateBounds();
			this._path.redraw();
			this._frame.updateHandle(evt.id);
		},
		_onDblclick: function (evt) {
			L.DomEvent.stop(evt);
			this._addVertex(this.getMap().mouseEventToLayerPoint(evt.originalEvent));
		},
		_onHandleDbclick: function (evt) {
			var originalEvent = evt.originalEvent;
			if (originalEvent.shiftKey) {
				this._removeLatLng(evt.id);
			}
		},
		_onHandleEnd: function () {
			this._frame.off('handle:move', this._onHandleMove, this).off('handle:end', this._onHandleEnd, this);
		},
		_onHandleMove: function (evt) {
			var sourceEvent = L.larva.getSourceEvent(evt);
			var dx = sourceEvent.clientX - this._origin.x, dy = sourceEvent.clientY - this._origin.y;
			var newPoint = this._originalPoint.add(L.point(dx, dy));
			var latlng = this._frame.getLatLng(this._handleId), newLatLng = this.getMap().layerPointToLatLng(newPoint);
			latlng.lat = newLatLng.lat;
			latlng.lng = newLatLng.lng;
			this._path.updateBounds();
			this._path.redraw();
			this._frame.updateHandle(this._handleId);
		},
		_onHandleStart: function (evt) {
			var sourceEvent;
			this._handleId = evt.id;
			if (this.options.aura) {
				this._frame.startAura(evt.id);
				this._frame.on('aura:end', this._onAuraEnd, this);
			} else {
				sourceEvent = L.larva.getSourceEvent(evt);
				this._origin = {
					x: sourceEvent.clientX,
					y: sourceEvent.clientY
				};
				this._originalPoint = this._frame.getPoint(evt.id).clone();
				this._frame.on('handle:move', this._onHandleMove, this).on('handle:end', this._onHandleEnd, this);
			}
		}
	});
	/**
	 * @memberOf L.larva.handler.Polyline.Edit
	 * @param  {L.Point} point
	 * @param  {Number} maxDist
	 * @param  {LatLng[]} latlngs
	 * @param  {L.Map} map
	 * @param  {Boolean} closed
	 * @return {Object[]}
	 */
	L.larva.handler.Polyline.Edit.searchNearestPointIn = function (point, maxDist, latlngs, map, closed) {
		var found = [], aPoint, bPoint, i, index, l, dist;
		if (closed) {
			l = latlngs.length;
		} else {
			l = latlngs.length - 1;
		}
		for (i = 0; i < l; i++) {
			index = (i + 1) % latlngs.length;
			aPoint = map.latLngToLayerPoint(latlngs[i]);
			bPoint = map.latLngToLayerPoint(latlngs[index]);
			dist = L.LineUtil.pointToSegmentDistance(point, aPoint, bPoint);
			if (dist <= maxDist) {
				found.push({
					point: L.LineUtil.closestPointOnSegment(point, aPoint, bPoint),
					index: index,
					latlngs: latlngs
				});
			}
		}
		return found;
	};
	/**
	 * @requires Path.js
	 */
	/**
	 * @class Polygon handler
	 *
	 * @extends L.larva.handler.Path
	 */
	L.larva.handler.Polygon = L.larva.handler.Path.extend({});
	/**
	 * @namespace
	 */
	L.larva.Util = {
		/**
		* @see {@link https://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#The%20C%20Code Reference}
		*
		* @param {L.Point} point
		* @param {L.Point[]} points
		*
		* @returns {Boolean} Point inside points?
		*/
		pointIsInside: function (point, points) {
			var i, j, isInside = false;
			for (i = 0, j = points.length - 1; i < points.length; j = i++) {
				if (points[i].y > point.y !== points[j].y > point.y && point.x < (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x) {
					isInside = !isInside;
				}
			}
			return isInside;
		}
	};
	/**
	 * @requires package.js
	 */
	/**
	 * @class Base type to creators
	 * @param {L.Map} map
	 * @param {Object} options
	 * 
	 * @extends L.Handler
	 * @mixes L.Evented
	 */
	L.larva.handler.New = L.Handler.extend(/** @lends L.larva.handler.New.prototype */
	{
		includes: [L.Evented.prototype],
		options: { allowFireOnMap: true },
		initialize: function (map, options) {
			L.Handler.prototype.initialize.call(this, map);
			if (options) {
				L.setOptions(this, options);
			}
		},
		/**
		* Fire an event on map
		* @param  {String} eventName
		* @param  {Object} eventObject
		*/
		fireOnMap: function (eventName, eventObject) {
			if (this.options.allowFireOnMap) {
				this._map.fire(eventName, eventObject);
			}
		},
		/**
		* Project a (lat, lng) to a layer point
		* @param  {number} lat
		* @param  {number} lng
		* @return {L.Point}
		*/
		project: function (a, b) {
			if (b !== undefined) {
				return this._map.latLngToLayerPoint(L.latLng(a, b));
			} else {
				return this._map.latLngToLayerPoint(a);
			}
		}
	});
	/**
	 * @requires New.js
	 */
	/**
	 * @class Polyline creator
	 * @extends L.larva.handler.New
	 */
	L.larva.handler.New.Polyline = L.larva.handler.New.extend(/** @lends L.larva.handler.New.Polyline.prototype */
	{
		options: {
			handleStyle: {
				border: '1px solid #0f0',
				cursor: 'crosshair',
				height: '20px',
				position: 'absolute',
				width: '20px'
			},
			layerOptions: {},
			// Snap here?
			onMove: L.larva.NOP,
			threshold: 1
		},
		addHooks: function () {
			this._latlngs = [];
			this._pane = this._map.getPane('popupPane');
			var handle = this._handle = L.DomUtil.create('div', 'llarva-new-vertex-handle', this._pane);
			L.extend(handle.style, this.options.handleStyle);
			this._newLatLng = new L.LatLng(0, 0);
			this._previewLayer = this._lineLayer = L.polyline([], L.extend({}, this.options, { noClip: true }));
			this._map.on('mousemove', this._onMapMouseMove, this).on('movestart', this._onMapMoveStart, this);
			L.DomEvent.on(handle, 'click', this._onClick, this).on(handle, 'dblclick', this._onDblClick, this);
		},
		addLatLng: function (latlng) {
			this._newLatLng = latlng.clone();
			this._pushLatLng();
		},
		/**
		* Create an empty Polyline layer
		* @return {L.Polyline}
		*/
		createLayer: function () {
			return L.polyline([], L.extend({}, this.options.layerOptions, { noClip: true }));
		},
		_next: function () {
			this._latlngs.pop();
			if (this._latlngs.length >= this.options.threshold) {
				try {
					this._map.removeLayer(this._previewLayer);
					this._previewLayer.setLatLngs(this._latlngs);
					this.fire('ldraw:created', { layer: this._previewLayer });
					this.fireOnMap('ldraw:created', {
						handler: this,
						layer: this._previewLayer
					});
				} finally {
					this._lineLayer.setLatLngs([]);
					this._latlngs = [];
					this._previewLayer = this._lineLayer;
					delete this._newLayer;
				}
			}
		},
		removeHooks: function () {
			L.DomEvent.off(this._handle, 'click', this._onClick, this).off(this._handle, 'dblclick', this._onDblClick, this);
			this._map.off('mousemove', this._onMapMouseMove, this).off('movestart', this._onMapMoveStart, this);
			L.DomUtil.remove(this._handle);
			if (this._previewLayer) {
				this._map.removeLayer(this._previewLayer);
			}
		},
		_getEventLayerPoint: function (evt) {
			var bounding = this._pane.getBoundingClientRect();
			evt = L.larva.getSourceEvent(evt);
			return new L.Point(evt.clientX - bounding.left, evt.clientY - bounding.top);
		},
		_onClick: function (evt) {
			L.DomEvent.stop(evt);
			if (this._lastClick) {
				evt = L.larva.getSourceEvent(evt);
				var dx = evt.clientX - this._lastClick.x, dy = evt.clientY - this._lastClick.y;
				if (dx * dx + dy * dy < 100) {
					return;
				}
			} else {
				this._lastClick = {};
			}
			this._lastClick.x = evt.clientX;
			this._lastClick.y = evt.clientY;
			if (!this._moving) {
				this._pushLatLng();
			} else {
				delete this._moving;
			}
		},
		_onDblClick: function (evt) {
			L.DomEvent.stop(evt);
			this._pushLatLng();
			this._next();
		},
		_onMapMouseMove: function (evt) {
			var latlng = evt.latlng;
			if (this.options.onMove) {
				this.options.onMove(latlng);
			}
			this._newLatLng.lat = latlng.lat;
			this._newLatLng.lng = latlng.lng;
			var point = this._map.latLngToLayerPoint(latlng);
			L.DomUtil.setPosition(this._handle, point.subtract(new L.Point(this._handle.offsetWidth / 2, this._handle.offsetHeight / 2)));
			if (this._latlngs.length) {
				this._previewLayer.redraw();
			}
		},
		_onMapMoveStart: function () {
			this._moving = true;
		},
		_pushLatLng: function () {
			this._latlngs.push(this._newLatLng.clone());
			if (this._latlngs.length === this.options.threshold) {
				this._map.removeLayer(this._lineLayer);
				this._newLayer = this.createLayer().addTo(this._map);
				this._previewLayer = this._newLayer;
			}
			if (!this._previewLayer._map) {
				this._map.addLayer(this._previewLayer);
			}
			this._previewLayer.setLatLngs(this._latlngs.concat(this._newLatLng));
			this._previewLayer.redraw();
		}
	});
	L.larva.handler.newPolyline = function (map, options) {
		return new L.larva.handler.New.Polyline(map, options);
	};
	/**
	 * @requires  New.Polyline.js
	 */
	/**
	 * @class Polygon creator
	 * @extends {L.larva.handler.New.Polyline}
	 */
	L.larva.handler.New.Polygon = L.larva.handler.New.Polyline.extend(/** @lends L.larva.handler.New.Polygon.prototype */
	{
		options: { threshold: 2 },
		/**
		* @return {L.Polygon} Creates blank layer
		*/
		createLayer: function () {
			return L.polygon([], this.options.layerOptions);
		}
	});
	/**
	 * @memberOf L.larva.handler.New.Polygon
	 * @param  {L.Map} map
	 * @param  {Object} options
	 * @return {L.larva.handler.New.Polygon}
	 */
	L.larva.handler.newPolygon = function (map, options) {
		return new L.larva.handler.New.Polygon(map, options);
	};
	/**
	 * @requires Polygon.js
	 * @requires Polyline.Edit.js
	 * @requires ../Util.js
	 * @requires New.Polygon.js
	 */
	L.larva.handler.Polygon.Edit = L.larva.handler.Polyline.Edit.extend({
		options: {
			allowMakeHole: true,
			makeHoleCursor: 'crosshair',
			newHoleOptions: {}
		},
		addHooks: function () {
			L.larva.handler.Polyline.Edit.prototype.addHooks.call(this);
			if (this.options.allowMakeHole) {
				this._path.on('click', this._onPathClickHole, this);
			}
		},
		_searchNearestPoint: function (point) {
			var found = [], map = this.getMap(), maxDist = this.options.maxDist;
			var search = L.larva.handler.Polyline.Edit.searchNearestPointIn;
			this._path.forEachPolygon(function (shell, holes) {
				found = found.concat(search(point, maxDist, shell, map, true));
				holes.forEach(function (latlngs) {
					found = found.concat(search(point, maxDist, latlngs, map, true));
				}, this);
			}, this);
			return found;
		},
		_onNewHole: function (evt) {
			if (this._shellHole) {
				delete this._makingHole;
				var polygons = this._path.getLatLngs();
				if (this._path.getLatLngs() === L.Polygon.POLYGON) {
					polygons = [polygons];
				}
				this._newPolygonHole.disable();
				var index;
				for (var p = 0; p < polygons.length; p++) {
					if ((index = polygons[p].indexOf(this._shellHole)) !== -1) {
						polygons[p].push(evt.layer.getLatLngs()[0]);
						this._path.updateBounds();
						this._path.redraw();
						this._frame.redraw();
						break;
					}
				}
			}
		},
		_onPathClickHole: function (evt) {
			if (!this._makingHole && evt.originalEvent.ctrlKey) {
				this._makingHole = true;
				var point = evt.layerPoint, points, found = [];
				this._path.forEachPolygon(function (shell) {
					points = shell.map(L.Map.prototype.latLngToLayerPoint, this.getMap());
					if (L.larva.Util.pointIsInside(point, points)) {
						found.push(shell);
					}
				}, this);
				if (found.length === 1) {
					this._shellHole = found[0];
					this._newPolygonHole = new L.larva.handler.New.Polygon(this.getMap(), L.extend({}, this.options.newHoleOptions, { allowFireOnMap: false }));
					this._newPolygonHole.on('ldraw:created', this._onNewHole, this).enable();
					this._newPolygonHole.addLatLng(evt.latlng);
				}
			}
		},
		_removeLatLng: function (handleId) {
			var latlng = this._frame.getLatLng(handleId), latlngs = this._path.getLatLngs(), index, i = 0, p = 0;
			switch (this._path.getType()) {
			case L.Polygon.POLYGON:
				for (; i < latlngs.length; i++) {
					if ((index = latlngs[i].indexOf(latlng)) !== -1) {
						if (latlngs[i].length === 3) {
							if (i === 0) {
								// shell..
								latlngs.splice(0, latlngs.length);
							} else {
								latlngs.splice(index, 1);
							}
						} else {
							latlngs[i].splice(index, 1);
						}
					}
				}
				break;
			default:
				l:
					for (; p < latlngs.length; p++) {
						// each polygon
						for (i = 0; i < latlngs[p].length; i++) {
							if ((index = latlngs[p][i].indexOf(latlng)) !== -1) {
								if (latlngs[p][i].length === 3) {
									if (i === 0) {
										//shell
										latlngs.splice(p, 1);
									} else {
										latlngs[p].splice(i, 1);
									}
								} else {
									latlngs[p][i].splice(index, 1);
								}
								break l;
							}
						}
					}
			}
			this._path.updateBounds();
			this._path.redraw();
			this._frame.redraw();
		},
		_restoreCursor: function () {
		},
		_setHoleCursor: function () {
		}
	});
	L.Polyline.addInitHook(function () {
		if (this instanceof L.Polygon) {
			this.larva.edit = new L.larva.handler.Polygon.Edit(this);
		} else {
			this.larva.edit = new L.larva.handler.Polyline.Edit(this);
		}
	});
}());
//# sourceMappingURL=leaflet-larva.js.map
