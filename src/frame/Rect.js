/**
 * @requires package.js
 * @requires RectHandle.js
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
		pane: 'llarva-rect',
		shadowPane: 'shadowPane'
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
			return getComputedStyle(this._frameEl);
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
		return this._frameEl.getBoundingClientRect();
	},
	/**
	 * @param  {String} id
	 * @return {HTMLElement}
	 */
	getHandle: function (handleId) {
		return this._handles[handleId];
	},
	/**
	 * @param  {String} id
	 * @return {L.Point}
	 */
	getPosition: function(id) {
		if (id) {
			return L.DomUtil.getPosition(this._handles[id]);
		} else {
			return L.DomUtil.getPosition(this._frameEl);
		}
	},

	onAdd: function () {
		var el = this._frameEl = L.DomUtil.create('div', 'llarva-rectframe', this.getPane());
		L.DomEvent.on(el, L.Draggable.START.join(' '), this._onStart, this);

		this._handles = {};

		var shadowPane = this.getPane(this.options.shadowPane);

		['tl','tm','tr','ml','mm','mr','bl','bm','br'].forEach(function (id) {

			(this._handles[id] = L.larva.frame.rectHandle(id, el, shadowPane))
				.on(L.Draggable.START.join(' '), this._onStart, this);

		}, this);

		this._update(true);
		//this._updateHandles();
	},

	onRemove: function() {
		var id, eventTypes = L.Draggable.START.join(' ');

		for (id in this._draggables) {
			this._draggables[id].disable();
		}

		// L.DomEvent.off(this._frameEl, 'mousedown click', L.DomEvent.stop);
		L.DomEvent.off(this._frameEl, eventTypes, this._onStart, this);

		for (id in this._handles) {
			L.DomEvent.off(this._handles[id], eventTypes, this._onStart, this);
		}

		L.DomUtil.remove(this._frameEl);
		L.DomUtil.empty(this._frameEl);

		delete this._frameEl;
	},
	/**
	 * @param {Object} styles
	 * @param {HTMLElement} element
	 */
	setElementStyle: function (styles, element) {
		if (!element) {
			L.extend(this._frameEl.style, styles);
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
		var id, oldStyle = this._style;

		if (oldStyle) {
			L.DomUtil.removeClass(this._frameEl, oldStyle.className);
		}

		L.DomUtil.addClass(this._frameEl, style.className);

		this._frameEl.style.position = 'absolute';

		for (id in this._handles) {
			if (style[id]) {
				this._handles[id].setStyle(style[id]);
			} else {
				// TODO: Hide handle?
			}
		}

		this._style = style;
	},
	/**
	 * @param {L.LatLngBounds} [bounds]
	 * @param {...String} [maintainHandles]
	 */
	updateBounds: function (bounds) {
		this._update(false, Array.prototype.slice.call(arguments, 1), bounds);
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
		this._update(true);
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

	_update: function (zoomChanged, bounds) {
		var id;

		if (!bounds) {
			bounds = this._path.getBounds();
		}

		if (zoomChanged)  {
			var minPoint = this._map.latLngToLayerPoint(bounds.getSouthWest());
			var maxPoint = this._map.latLngToLayerPoint(bounds.getNorthEast());

			L.extend(this._frameEl.style, {
				width: (maxPoint.x - minPoint.x) + 'px',
				height: (minPoint.y - maxPoint.y) + 'px',
				left: minPoint.x + 'px',
				top: maxPoint.y + 'px'
			});

			for (id in this._handles) {
				this._handles[id].update(this._map, bounds);
			}
		}

	}
});

L.larva.frame.rect = function (path) {
	if (path && path._rectFrame) {
		return path._rectFrame;
	}

	return (path._rectFrame = new L.larva.frame.Rect(path));
};