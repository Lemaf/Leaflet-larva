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

	options: {
		pane: 'llarva-path-frame'
	},

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
		return {
			zoom: this._onMapZoom
		};
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

	getPosition: function(id) {
		if (id) {
			return L.DomUtil.getPosition(this._handles[id]);
		} else {
			return L.DomUtil.getPosition(this._el);
		}
	},

	hideHandle: function() {
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

		['tl','tm','tr','ml','mm','mr','bl','bm','br'].forEach(function (id) {

			this._handles[id] = L.DomUtil.create('div', 'llarva-' + id, el);
			this._handles[id]._id = id;
			L.DomEvent.on(this._handles[id], L.Draggable.START.join(' '), this._onStart, this);

		}, this);

		this._draggable = new L.Draggable(el);
		this._draggables = {};
		this._updateFrame(false);
		this._updateHandles();
	},

	onRemove: function() {
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
		this._updateFrame(false, Array.prototype.slice.call(arguments, 0));
	},

	_onStart: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('drag:start', {
			sourceEvent: evt,
			handle: evt.target._id
		});

		L.DomEvent
			.on(document, L.Draggable.MOVE[evt.type], this._onMove, this)
			.on(document, L.Draggable.END[evt.type], this._onEnd, this);

		L.DomUtil.addClass(document.body, 'leaflet-dragging');
	},

	_onMapZoom: function () {
		this._updateFrame(true);
	},

	_onMove: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('drag:move', {
			sourceEvent: evt
		});
	},

	_onEnd: function (evt) {
		L.DomEvent.stop(evt);

		for (var id in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onMove, this)
				.off(document, L.Draggable.END[id], this._onEnd, this);
		}

		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		this.fire('drag:end', {
			sourceEvent: evt
		});
	},

	_updateDraggable: function (id) {
		var el = this._handles[id];
		var left = el.offsetLeft,
		top = el.offsetTop;

		if (el.style.marginLeft) {
			left -= parseInt(el.style.marginLeft);
		}

		if (el.style.marginTop) {
			top -= parseInt(el.style.marginTop);
		}

		L.extend(el.style, {
			left: '0px', top: '0px'
		});

		L.DomUtil.setPosition(el, L.point(left, top));
	},

	_updateFrame: function (zoomChanged, maintainHandles) {
		var id,
		    currentPosition = L.DomUtil.getPosition(this._el),
		    handle,
		    handlePosition;

		var bounds = this._path.getBounds();

		var southEastPoint = this._map.latLngToLayerPoint(bounds.getSouthEast()),
		northWestPoint = this._map.latLngToLayerPoint(bounds.getNorthWest());

		var computedStyle = getComputedStyle(this._el);

		if (maintainHandles && maintainHandles.length) {

			if (currentPosition) {
				for (var i=0; i<maintainHandles.length; i++) {
					
					handle = this._handles[maintainHandles[i]];
					if (handle && (handlePosition = L.DomUtil.getPosition(handle))) {
						handlePosition = handlePosition.add(currentPosition);
						L.DomUtil.setPosition(handle, handlePosition.subtract(northWestPoint));
					}
				}
			}
		}

		L.DomUtil.setPosition(this._el, northWestPoint);

		var x = parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.borderRightWidth),
		y = parseInt(computedStyle.borderTopWidth) + parseInt(computedStyle.borderBottomWidth);

		var oldWidth, oldHeight;
		if (zoomChanged) {
			oldWidth = this._el.offsetWidth;
			oldHeight = this._el.offsetHeight;
		}

		this._el.style.width = (southEastPoint.x - northWestPoint.x - x) + 'px';
		this._el.style.height = (southEastPoint.y - northWestPoint.y - y) + 'px';

		if (zoomChanged) {

			for (id in this._handles) {
				handle = this._handles[id];
				handlePosition = L.DomUtil.getPosition(handle);

				if (handlePosition) {
					L.DomUtil.setPosition(handle, handlePosition.scaleBy(L.point(
						this._el.offsetWidth / oldWidth, 
						this._el.offsetHeight / oldHeight
					)));
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

		right = (- (widthOf(el) / 2) - borderWidth.right) + 'px';
		bottom = (- (heightOf(el) / 2) - borderWidth.bottom) + 'px';

		L.extend(el.style, {
			right: right,
			bottom: bottom
		});

		el = this._handles.bm;
		left = (-(widthOf(el) / 2)) + 'px';
		bottom = (- (heightOf(el) / 2) - borderWidth.bottom) + 'px';

		L.extend(el.style, {
			left: '50%',
			'margin-left': left,
			bottom: bottom
		});

		el = this._handles.bl;
		left = (-(widthOf(el) / 2) - borderWidth.left) + 'px';
		bottom = (- (heightOf(el) / 2) - borderWidth.bottom) + 'px';
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
		left = (-(widthOf(el) / 2) - borderWidth.left) + 'px';
		L.extend(el.style, {
			top: '50%',
			'margin-top': top,
			left: left
		});

		el = this._handles.mr;
		right = (- (widthOf(el) / 2) - borderWidth.right) + 'px';
		top = -(heightOf(el) / 2) + 'px';
		L.extend(el.style, {
			right: right,
			top: '50%',
			'margin-top': top
		});

		el = this._handles.tr;
		right = (-(widthOf(el) / 2) - borderWidth.right) + 'px';
		top = (-(heightOf(el) / 2) - borderWidth.top) + 'px';
		L.extend(el.style, {
			right: right,
			top: top
		});

		el = this._handles.tm;
		top = (-(heightOf(el) / 2) - borderWidth.top) + 'px';
		left = -(widthOf(el) / 2) + 'px';
		L.extend(el.style, {
			left: '50%',
			'margin-left': left,
			top: top
		});

		el = this._handles.tl;
		top = (-(heightOf(el) / 2) - borderWidth.top) + 'px';
		left = (-(widthOf(el) / 2) - borderWidth.left) + 'px';
		L.extend(el.style, {
			left: left,
			top: top
		});
	}
});

L.larva.frame.path = function pathframe (path) {
	return new L.larva.frame.Path(path);
};