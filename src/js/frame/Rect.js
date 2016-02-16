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
L.larva.frame.Rect = L.Layer.extend(
/** @lends L.larva.frame.Rect.prototype */
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

	options: {
		pane: 'llarva-frame'
	},

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
	getComputedStyle: function(id) {
		if (id) {
			if (this._handles[id]) {
				return getComputedStyle(this._handles[id]);
			}
		} else {
			return getComputedStyle(this._el);
		}
	},

	getEvents: function () {
		return {
			zoom: this._onMapZoom
		};
	},
	/**
	 * @return {DOMRect}
	 */
	getFrameClientRect: function () {
		return this._el.getBoundingClientRect();
	},
	/**
	 * @param  {String} id
	 * @return {HTMLElement}
	 */
	getHandle: function (id) {
		return this._handles[id];
	},
	/**
	 * @param  {String} id
	 * @return {L.Point}
	 */
	getPosition: function(id) {
		if (id) {
			return L.DomUtil.getPosition(this._handles[id]);
		} else {
			return L.DomUtil.getPosition(this._el);
		}
	},
	/**
	 */
	hideHandle: function() {
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

		['tl','tm','tr','ml','mm','mr','bl','bm','br'].forEach(function (id) {

			this._handles[id] = L.DomUtil.create('div', 'llarva-' + id, el);
			this._handles[id]._id = id;
			L.DomEvent.on(this._handles[id], L.Draggable.START.join(' '), this._onStart, this);

		}, this);

		this._draggables = {};
		this._updateFrame(false);
		this._updateHandles();
	},

	onRemove: function() {
		var id, eventTypes = L.Draggable.START.join(' ');

		for (id in this._draggables) {
			this._draggables[id].disable();
		}

		// L.DomEvent.off(this._el, 'mousedown click', L.DomEvent.stop);
		L.DomEvent.off(this._el, eventTypes, this._onStart, this);

		for (id in this._handles) {
			L.DomEvent.off(this._handles[id], eventTypes, this._onStart, this);
		}

		L.DomUtil.remove(this._el);
		L.DomUtil.empty(this._el);

		delete this._el;
	},
	/**
	 * @param {Object} styles
	 * @param {HTMLElement} element
	 */
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
	/**
	 * @param {L.larva.frame.RECT_STYLE} style
	 */
	setStyle: function (style) {
		var id, el, oldStyle = this._style;

		for (id in this._handles) {
			el = this._handles[id];
			el.style.display = 'block';

			if (this._draggables[id]) {
				this._draggables[id].disable();
				delete this._draggables[id];
			}

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
	/**
	 * @param {L.LatLngBounds} [bounds]
	 * @param {...String} [maintainHandles]
	 */
	updateBounds: function (bounds) {
		this._updateFrame(false, Array.prototype.slice.call(arguments, 1), bounds);
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

	_onMapZoom: function () {
		this._updateFrame(true);
	},

	_onMove: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('drag:move', {
			sourceEvent: evt
		});
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

	_setHandlePosition: function (handle, borders) {
		var id = handle._id, style = {};

		switch (id[0]) {
			case 't':
				style.top = (L.larva.getHeight(handle) / -2 - borders.top) + 'px';
				break;

			case 'm':
				style.top = '50%';
				style.marginTop = (L.larva.getHeight(handle) / -2) + 'px';
				break;

			case 'b':
				style.bottom = (L.larva.getHeight(handle) / -2 - borders.bottom) + 'px';
				break;
		}

		switch (id[1]) {
			case 'l':
				style.left = (L.larva.getWidth(handle) / -2 - borders.left) + 'px';
				break;

			case 'm':
				style.marginLeft = (L.larva.getWidth(handle) / -2) + 'px';
				style.left = '50%';
				break;

			case 'r':
				style.right = (L.larva.getWidth(handle) / -2 - borders.right) + 'px';
				break;
		}

		L.extend(handle.style, style);
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

	_updateFrame: function (zoomChanged, maintainHandles, userBounds) {
		var id,
		    currentPosition = L.DomUtil.getPosition(this._el),
		    handle,
		    handlePosition;

		var bounds = userBounds || this._path.getBounds();

		var southEastPoint = this._map.latLngToLayerPoint(bounds.getSouthEast()),
		northWestPoint = this._map.latLngToLayerPoint(bounds.getNorthWest());

		var computedStyle = getComputedStyle(this._el);

		if (maintainHandles && currentPosition && maintainHandles.length) {
			for (var i=0; i<maintainHandles.length; i++) {
				handle = this._handles[maintainHandles[i]];
				if (handle && (handlePosition = L.DomUtil.getPosition(handle))) {
					handlePosition = handlePosition.add(currentPosition);
					L.DomUtil.setPosition(handle, handlePosition.subtract(northWestPoint));
				}
			}
		}

		L.DomUtil.setPosition(this._el, northWestPoint);

		var x = parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.borderRightWidth),
		y = parseInt(computedStyle.borderTopWidth) + parseInt(computedStyle.borderBottomWidth);

		var oldWidth, oldHeight;
		if (zoomChanged) {
			oldWidth = L.larva.getWidth(this._el);
			oldHeight = L.larva.getHeight(this._el);
		}

		this._el.style.width = (southEastPoint.x - northWestPoint.x - x) + 'px';
		this._el.style.height = (southEastPoint.y - northWestPoint.y - y) + 'px';

		if (zoomChanged) {

			for (id in this._handles) {
				handle = this._handles[id];
				handlePosition = L.DomUtil.getPosition(handle);

				if (handlePosition) {
					L.DomUtil.setPosition(handle, handlePosition.scaleBy(L.point(
						L.larva.getWidth(this._el) / oldWidth, 
						L.larva.getHeight(this._el) / oldHeight
					)));
				}
			}
		}

		this.southEastPoint = southEastPoint;
		this.northWestPoint = northWestPoint;
	},

	_updateHandles: function () {
		var id, computedStyle;

		computedStyle = getComputedStyle(this._el);

		var borders = {
			bottom: 'borderBottomWidth',
			left: 'borderLeftWidth',
			right: 'borderRightWidth',
			top: 'borderTopWidth'
		};

		for (id in borders) {
			borders[id] = parseInt(computedStyle[borders[id]]) / 2;
		}

		for (id in this._handles) {
			this._setHandlePosition(this._handles[id], borders);
		}
	}
});

L.larva.frame.rect = function (path) {
	if (path && path._rectFrame) {
		return path._rectFrame;
	}

	return (path._rectFrame = new L.larva.frame.Rect(path));
};