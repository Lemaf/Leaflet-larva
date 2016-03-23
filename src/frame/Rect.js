/**
 * @requires package.js
 * @requires RectHandle.js
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
 * @param {String} options.handlePane
 */
L.larva.frame.Rect = L.Layer.extend(
/** @lends L.larva.frame.Rect.prototype */
{
	options: {
		pane: 'llarva-frame-rect',
		handlePane: 'llarva-frame-handles'
	},

	initialize: function (path) {
		this._path = path;
	},

	beforeAdd: function (map) {
		if (!map.getPane(this.options.pane)) {
			map.createPane(this.options.pane);
		}

		if (!map.getPane(this.options.handlePane)) {
			map.createPane(this.options.handlePane);
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

	getHandle: function (position) {
		return this._handles[position];
	},

	/**
	 * @param {Boolean} [pagePosition=false] Screen
	 * @return {L.Point}
	 */
	getPosition: function (pagePosition) {
		if (pagePosition) {
			var rect = this._el.getBoundingClientRect();
			return L.point(rect.left, rect.top);
		} else {
			return L.DomUtil.getPosition(this._el).clone();
		}
	},

	/**
	 * @returns {L.larva.frame.Rect} this
	 */
	lockDraggables: function (userBounds) {
		var bounds = userBounds || this._path.getBounds(),
		    handle;

		var layerBounds = new L.Bounds(
			this._map.latLngToLayerPoint(bounds.getNorthWest()),
			this._map.latLngToLayerPoint(bounds.getSouthEast())
		);

		for (var pos in this._handles) {
			handle = this._handles[pos];
			if (handle.isDraggable()) {
				handle.lock(layerBounds);
			}
		}

		return this;
	},

	onAdd: function () {
		var el = this._el = L.DomUtil.create('div', 'llarva-frame-rect', this.getPane());
		L.DomEvent.on(el, L.Draggable.START.join(' '), this._onStart, this);

		this._handles = {};

		var handleOptions = {
			pane: this.getPane(this.options.handlePane)
		};

		['tl','tm','tr','ml','mr','bl','bm','br', 'mm'].forEach(function (position) {
			this._handles[position] = L.larva.frame.rectHandle(position, handleOptions);
			this._handles[position]
				.on('dragstart', this._onHandleDragStart, this);
		}, this);

		// this._draggables = {};
		//this._updateFrame(true);
	},

	redraw: function () {
		this._updateFrame(true);
	},

	onRemove: function() {
		L.DomEvent.off(this._el, L.Draggable.START.join(' '), this._onStart, this);
	},

	/**
	 * @param {Object} styles
	 * @param {HTMLElement} element
	 */
	setElementStyle: function (/*styles, element*/) {
	},
	/**
	 * @param {L.larva.frame.RECT_STYLE} style
	 */
	setStyle: function (style) {
		L.DomUtil.addClass(this._el, style.className);

		var y = 'tmb', x = 'lmr', yx, handleStyle, handle;

		for (var iy=0; iy < y.length; iy++) {
			for (var ix=0; ix < x.length; ix++) {
				yx = y[iy] + x[ix];
				handle = this._handles[yx];
				handle.setCssSuffix(style.handleSuffix);
				handleStyle = style[yx];

				if (handleStyle && handleStyle.hide) {
					handle.setDraggable(false).remove();
					continue;
				}

				handle.add().setDraggable(handleStyle && !!handleStyle.draggable);
			}
		}

		this._updateFrame(true);
	},

	/**
	 * @return {L.larva.frame.Rect} this
	 */
	unlockDraggagle: function () {
		var handle;
		for (var pos in this._handles) {
			handle = this._handles[pos];
			if (handle.isDraggable()) {
				handle.unlock();
			}
		}

		return this;
	},

	/**
	 * @param {L.LatLngBounds} bounds
	 */
	updateToBounds: function (bounds) {
		this._updateFrame(true, bounds);
	},

	_onDocEnd: function (evt) {
		L.DomEvent.stop(evt);

		for (var id in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onDocMove, this)
				.off(document, L.Draggable.END[id], this._onDocEnd, this);
		}

		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		this.fire('dragend', {
			originalEvent: evt
		});
	},

	_onDocMove: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('drag', {
			originalEvent: evt
		});
	},

	_onHandleDragStart: function (evt) {
		this.fire('handle:dragstart', {
			handle: evt.target,
			originalEvent: evt.originalEvent
		});

		L.DomEvent
			.on(document, L.Draggable.MOVE[evt.originalEvent.type], this._onDocMove, this)
			.on(document, L.Draggable.END[evt.originalEvent.type], this._onDocEnd, this);

		L.DomUtil.addClass(document.body, 'leaflet-dragging');
	},

	_onMapZoom: function () {
		this._updateFrame(true);
	},

	_onStart: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('dragstart', {
			originalEvent: evt
		});

		L.DomEvent
			.on(document, L.Draggable.MOVE[evt.type], this._onDocMove, this)
			.on(document, L.Draggable.END[evt.type], this._onDocEnd, this);

		L.DomUtil.addClass(document.body, 'leaflet-dragging');
	},

	_updateFrame: function (updateBounds, userBounds) {
		var bounds = userBounds || this._path.getBounds();

		if (updateBounds) {
			var southWestPoint = this._map.latLngToLayerPoint(bounds.getSouthWest()),
			    northEastPoint = this._map.latLngToLayerPoint(bounds.getNorthEast());

			var computed = getComputedStyle(this._el),
			    borders = {};

			['Left', 'Right', 'Bottom', 'Top'].forEach(function(border) {
				borders[border.toLowerCase()] = parseInt(computed['border' + border + 'Width']);
			});

			var layerBounds = L.bounds(
				L.point(southWestPoint.x, northEastPoint.y),
				L.point(northEastPoint.x, southWestPoint.y));

			var width = layerBounds.max.x - layerBounds.min.x - borders.left - borders.right,
			    height = layerBounds.max.y - layerBounds.min.y - borders.top - borders.bottom;

			L.extend(this._el.style, {
				height: height + 'px',
				width: width + 'px'
			});

			L.DomUtil.setPosition(this._el, layerBounds.min);

			for (var id in this._handles) {
				this._handles[id].update(this._map, layerBounds);
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