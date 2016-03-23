/**
 * @requires package.js
 * @requires VertexHandle.js
 * @requires Ghost.js
 * @requires ../Style.js
 *
 * @requires ../ext/L.Polygon.js
 */

/**
 * @class
 * @extends {L.Layer}
 *
 * Frame for handle point by point editor
 *
 * @param {Object} options
 * @param {Object} options.ghost @see {@link L.larva.frame.Ghost}
 */
L.larva.frame.Vertices = L.Layer.extend(
/** @lends L.larva.frame.Vertices.prototype */
{
	statics: {
		HANDLE_PROPS: ['isPolygon', 'isHole', 'prev', 'next', 'first', 'last']
	},

	options: {
		ghost: {
			colorFactor: [0.8, 1.3, 0.8],
			opacityFactor: 0.8,
		},
		sqrEditResistance: 4,
		pane: 'llarva-frame-handles',
		tolerance: 10,
		simplifyZoom: -1,
	},

	initialize: function (path, options) {
		this._path = path;
		this._ghosts = {};
		this._handles = {};
		this._lines = [];

		if (options) {
			L.setOptions(this, options);
		}
	},

	beforeAdd: function (map) {
		if (!map.getPane(this.options.pane)) {
			map.createPane(this.options.pane);
		}
	},

	getEvents: function () {
		return {
			moveend: this._onMapMoveEnd,
			zoomend: this._onMapZoomEnd
		};
	},

	/**
	 * @return {Number}
	 * @see {@link external:"L.Polygon" L.Polygon}
	 */
	getPathType: function () {
		return this._path.getType();
	},

	onAdd: function () {
		this.redraw(true);
	},

	onRemove: function () {
		for (var id in this._handles) {
			this._handles[id].remove();
			delete this._handles[id];
		}

		this._lines.splice(0, this._lines.length);
	},

	/**
	 * @param  {L.larva.frame.VertexHandle} handle
	 */
	startGhost: function (handle) {
		var id = L.stamp(handle);
		if (this._ghosts[id] || !this._handles[id]) {
			return;
		}

		this._ghosts[id] = L.larva.frame.ghost({
			handle: handle,
			path: this._path,
			map: this._map,
			position: this._position,
			options: this.options.ghost
		});
	},

	/**
	 * @param {Boolean} [updateHandles=false]
	 */
	redraw: function (updateHandles) {
		if (updateHandles) {
			this._updateHandles();
		}

		this._lines.forEach(function (line) {
			this._showOrHideHandles(line.handles, line.isPolygon);
		}, this);

		return this;
	},

	_createOrUpdateHandles: function (latlngs, isPolygon, isHole) {
		var i, handle, prev, handles = [], first, handleOptions = {
			pane: this.getPane(),
		};

		for (i = 0; i < latlngs.length; i++) {
			handle = L.larva.frame.vertexHandle(latlngs[i], handleOptions);
			this._delProps(handle);

			if (handle.isNew) {
				handle
					.on('dragstart', this._onHandleDragStart, this)
					.on('dblclick', this._onHandleDblclick, this);
			}

			if (isPolygon) {
				handle.isPolygon = true;
			}

			if (isHole) {
				handle.isHole = true;
			}

			this._handles[L.stamp(handle)] = handle;

			if (prev) {
				prev.next = handle;
				handle.prev = prev;
				prev = handle;
				if (isPolygon && first) {
					handle.first = first;
				}
			} else {
				first = handle;
				prev = handle;
			}

			handles.push(handle);
		}

		if (isPolygon && first) {
			first.last = handle;
		}

		this._lines.push({
			handles: handles,
			isHole: !!isHole,
			isPolygon: !!isPolygon
		});

		return handles;
	},

	_delProps: function (handle) {
		L.larva.frame.Vertices.HANDLE_PROPS.forEach(function (prop) {
			delete handle[prop];
		});
	},

	_onDocEnd: function (evt) {
		var id, ghost;

		L.DomEvent.stop(evt);

		for (id in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onDocMove, this)
				.off(document, L.Draggable.END[id], this._onDocEnd, this);
		}

		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		try {
			if (this._ghosts) {
				for (id in this._ghosts) {
					ghost = this._ghosts[id];
					this.fire('ghost:end', {
						latlng: ghost.latlng,
						handle: ghost.handle
					});
				}
			}
		} finally {
			if (this._ghosts) {
				for (id in this._ghosts) {
					this._ghosts[id].destroy();
					delete this._ghosts[id];
				}
			}

			this.fire('handle:dragend', {
				originalEvent: evt
			});
		}
	},

	_onDocMove: function (evt) {
		var id, dx, dy;

		L.DomEvent.stop(evt);

		if (this._position.lock) {
			dx = evt.clientX - this._position.x;
			dy = evt.clientY - this._position.y;

			if (((dx * dx) + (dy * dy)) > this.options.sqrEditResistance) {
				try {
					this.fire('handle:dragstart', this._position.lock);
				} finally {
					delete this._position.lock;
				}
			} else {
				return;
			}
		}

		this._position.x = evt.clientX;
		this._position.y = evt.clientY;

		for (id in this._ghosts) {
			this._ghosts[id].update(this._position, this._map);
		}

		this.fire('handle:drag', {
			originalEvent: evt
		});
	},

	_onHandleDblclick: function (evt) {
		this.fire('handle:dblclick', {
			handle: evt.target,
			originalEvent: evt.originalEvent
		});
	},

	_onHandleDragStart: function (evt) {
		var originalEvent = L.larva.getOriginalEvent(evt);

		this._position = {
			x: originalEvent.clientX, y: originalEvent.clientY
		};

		var startEvent = {
			handle: evt.target,
			originalEvent: originalEvent
		};

		if (this.options.sqrEditResistance) {
			this._position.lock = startEvent;
		} else {
			this.fire('handle:dragstart', startEvent);
		}

		L.DomEvent
			.on(document, L.Draggable.MOVE[originalEvent.type], this._onDocMove, this)
			.on(document, L.Draggable.END[originalEvent.type], this._onDocEnd, this);

		L.DomUtil.addClass(document.body, 'leaflet-dragging');
	},

	_onMapMoveEnd: function () {
		this._lines.forEach(function (line) {
			this._showOrHideHandles(line.handles, line.isPolygon);
		}, this);
	},

	_onMapZoomEnd: function () {
		this._onMapMoveEnd();
	},

	_showOrHideHandles: function (handles) {
		var bounds = this._map.getPixelBounds(),
		    pixelOrigin = this._map.getPixelOrigin();

		var points = handles.map(function (handle) {
			var point = this._map.latLngToLayerPoint(handle.getLatLng()).add(pixelOrigin);
			point.handle = handle;
			return point;
		}, this);

		var pointsToShow = points.filter(function (point) {
			return bounds.contains(point);
		});

		var doSimplify = false;

		if (this.options.simplifyZoom > 0) {
			doSimplify = this._map.getZoom() < this.options.simplifyZoom;
		} else if (this.options.simplifyZoom < 0) {
			doSimplify = this._map.getZoom() < (this._map.getMaxZoom() + this.options.simplifyZoom);
		}

		if (doSimplify) {
			pointsToShow = L.LineUtil.simplify(pointsToShow, this.options.tolerance);
		}

		pointsToShow.forEach(function (point) {
			point.show = true;
		});

		points.forEach(function (point) {
			if (point.show) {
				point.handle.add().update(this._map);
			} else {
				point.handle.remove();
			}
		}, this);
	},

	_updateHandles: function () {
		for (var id in this._handles) {
			this._handles[id].remove();
			delete this._handles[id];
		}

		this._lines.splice(0, this._lines.length);

		switch (this.getPathType()) {
			case L.Polyline.POLYLINE:
			case L.Polyline.MULTIPOLYLINE:

				this._path.forEachLine(function (line) {
					this._createOrUpdateHandles(line);
				}, this);

				break;

			case L.Polygon.POLYGON:
			case L.Polygon.MULTIPOLYGON:

				this._path.forEachPolygon(function (shell, holes) {
					this._createOrUpdateHandles(shell, true);

					holes.forEach(function (latlngs) {
						this._createOrUpdateHandles(latlngs, true, true);
					}, this);

				}, this);

				break;

			default:
				throw new Error('Invalid geometry type - ' + this.getPathType());
		}
	}
});

/**
 * @param  {L.Path} path
 * @param  {Object} options
 * @return {L.larva.frame.Vertices}
 */
L.larva.frame.vertices = function (path, options) {
	if (!path._verticesFrame) {
		path._verticesFrame = new L.larva.frame.Vertices(path, options);
	}

	return path._verticesFrame;
};