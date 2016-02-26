/**
 * @requires package.js
 * @requires VertexHandle.js
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
L.larva.frame.Vertices = L.Layer.extend(
/** @lends L.larva.frame.Vertices.prototype */
{
	options: {
		colorFactor: [0.8, 1.3, 0.8],
		opacityFactor: 0.8,
		sqrEditResistance: 4,
		pane: 'llarva-vertex',
		tolerance: 10,
		shadowPane: 'shadowPane',
		simplifyZoom: -1,
	},

	initialize: function (path, options) {
		this._path = path;

		if (options) {
			L.setOptions(this, options);
		}
	},

	beforeAdd: function (map) {
		if (!map.getPane(this.options.shadowPane)) {
			map.createPane(this.options.shadowPane);
		}
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
	 * @param  {L.LatLng} latlng
	 * @return {String}
	 */
	getHandleId: function (latlng) {
		if (latlng._handle) {
			var id = L.stamp(latlng._handle);
			if (this._handles[id]) {
				return id;
			}
		}

		return null;
	},
	/**
	 * Returns handle L.LatLng
	 * @param  {String}  handleId
	 * @return {L.LatLng}
	 */
	getLatLng: function (handleId) {
		if (this._handles && this._handles[handleId]) {
			return this._handles[handleId].getLatLng();
		}
	},
	/**
	 * @return {Number}
	 *
	 * @see {@link external:"L.Polygon" L.Polygon}
	 */
	getPathType: function () {
		return this._path.getType();
	},

	/**
	 * Returns handle layer point
	 * @param  {String} handleId
	 * @return {L.Point}
	 */
	getPoint: function (handleId) {
		if (this._handles && this._handles[handleId]) {
			return this._handles[handleId].point;
		}
	},

	onAdd: function () {
		this._pane = this.getPane();
		this._shadowPane = this.getPane(this.options.shadowPane);
		this._updateHandles();
		this._updateView();
	},

	onRemove: function () {
		var id;

		if (this._handles) {

			for (id in this._handles) {
				this._handles[id].remove();
			}

			delete this._handles;
			delete this._lines;
		}

		for (id in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onMove, this)
				.off(document, L.Draggable.END[id], this._onEnd, this);
		}
	},

	/**
	 * @param  {String} handleId
	 * @returns {Boolean} Does the ghost was created?
	 */
	startGhost: function (handleId) {
		var handle = this._handles[handleId];

		if (!handle) {
			return false;
		}

		if (!this._ghosts) {
			this._ghosts = {};
		}

		if (!this._ghosts[handleId]) {

			var polyline;

			var latlngs = [],
			    latlng = handle.getLatLng().clone(),
			    style = L.larva.style(this._path).multiply({
			    	color: this.options.colorFactor,
			    	opacity: this.options.opacityFactor
			    });

			if (handle.isPolygon) {

				latlngs.push((handle.prev ? handle.prev.getLatLng() : handle.last.getLatLng()).clone());

				latlngs.push(latlng);

				latlngs.push((handle.next ? handle.next.getLatLng() : handle.first.getLatLng()).clone());

			} else {

				if (handle.prev) {
					latlngs.push(handle.prev.getLatLng().clone());
				}

				latlngs.push(latlng);

				if (handle.next) {
					latlngs.push(handle.next.getLatLng().clone());
				}
			}

			polyline = L.polyline(latlngs, L.extend({}, style, {
				noClip: true
			})).addTo(this._map);

			this._ghosts[handleId] = {
				point: handle.point.clone(),
				polyline: polyline,
				latlng: latlng,
				x: this._position.x,
				y: this._position.y
			};
		}

		return true;
	},

	/**
	 * @param {Boolean} [updateHandles]
	 */
	redraw: function (updateHandles) {
		if (updateHandles) {
			this._updateHandles();
		}

		this._updateView();
		return this;
	},

	/**
	 * @param  {String} handleId
	 */
	updateHandle: function (handleId) {
		var handle = this._handles[handleId];
		if (handle) {
			delete handle.point;
			handle.update(this._map);
		}
	},

	_createOrUpdateHandles: function (latlngs, isPolygon, isHole) {
		var i, handle, prev, handles = [], first;

		for (i = 0; i < latlngs.length; i++) {

			if (latlngs[i]._handle) {
				handle = latlngs[i]._handle;
				delete handle.isPolygon;
				delete handle.isHole;
				delete handle.prev;
				delete handle.next;
				delete handle.first;
				delete handle.last;
			} else {
				handle = L.larva.frame.vertexHandle(latlngs[i], this._pane, this._shadowPane);

				handle
					.on(L.Draggable.START.join(' '), this._onHandleDragStart, this)
					.on('dblclick', this._onHandleDbclick, this);
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
				//handle.first = handle;
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

	_onEnd: function (evt) {
		var id, ghost;

		L.DomEvent.stop(evt);

		for (id in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onMove, this)
				.off(document, L.Draggable.END[id], this._onEnd, this);
		}

		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		try {
			if (this._ghosts) {
				for (id in this._ghosts) {
					ghost = this._ghosts[id];
					this.fire('ghost:end', {
						id: +id,
						latlng: ghost.latlng
					});
				}
			}
		} finally {
			if (this._ghosts) {
				for (id in this._ghosts) {
					ghost = this._ghosts[id];
					this._map.removeLayer(ghost.polyline);
				}

				delete this._ghosts;
			}
			this.fire('handle:end', {
				originalEvent: evt.originalEvent
			});
		}
	},

	_onHandleDbclick: function (evt) {
		var handleId = L.stamp(evt.target);
		evt = L.larva.getSourceEvent(evt);
		L.DomEvent.stop(evt);

		this.fire('handle:dblclick', {
			id: handleId,
			originalEvent: evt
		});
	},

	_onHandleDragStart: function (evt) {
		var originalEvent = L.larva.getSourceEvent(evt);
		L.DomEvent.stop(originalEvent);

		this._position = {
			x: originalEvent.clientX, y: originalEvent.clientY
		};

		var startEvent = {
			id: L.stamp(evt.target),
			originalEvent: originalEvent
		};

		if (this.options.sqrEditResistance) {
			this._position.lock = startEvent;
		} else {
			this.fire('handle:start', startEvent);
		}

		L.DomEvent
			.on(document, L.Draggable.MOVE[originalEvent.type], this._onMove, this)
			.on(document, L.Draggable.END[originalEvent.type], this._onEnd, this);

		L.DomUtil.addClass(document.body, 'leaflet-dragging');
	},

	_onMove: function (evt) {
		var ghost, handle, id, dx, dy, newPoint, newLatLng;

		L.DomEvent.stop(evt);

		if (this._position.lock) {
			dx = evt.clientX - this._position.x;
			dy = evt.clientY - this._position.y;

			if (((dx * dx) + (dy * dy)) > this.options.sqrEditResistance) {
				try {
					this.fire('handle:start', this._position.lock);
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
			ghost = this._ghosts[id];
			handle = this._handles[id];

			dx = this._position.x - ghost.x;
			dy = this._position.y - ghost.y;

			newPoint = ghost.point.add(L.point(dx, dy));
			newLatLng = this._map.layerPointToLatLng(newPoint);
			ghost.latlng.lat = newLatLng.lat;
			ghost.latlng.lng = newLatLng.lng;

			ghost.polyline.updateBounds();
			ghost.polyline.redraw();

			handle.update(this._map, newPoint);
		}

		this.fire('handle:move', {
			originalEvent: evt
		});
	},

	_onZoomEnd: function () {
		var id;

		for (id in this._handles) {
			delete this._handles[id].point;
			this._handles[id].update(this._map);
		}
	},

	_showHandles: function (handles, isPolygon) {
		var pointsToShow;

		var bounds = this._map.getPixelBounds(),
		    pixelOrigin = this._map.getPixelOrigin();

		var points = handles.map(function (handle) {
			var point = this._map.latLngToLayerPoint(handle.getLatLng()).add(pixelOrigin);
			point._handle = handle;
			return point;
		}, this);

		if (isPolygon) {

			pointsToShow = L.PolyUtil.clipPolygon(points, bounds).filter(function (point) {
				return !!point._handle;
			});

		} else {

			var i,l, lineClip;

			pointsToShow = [];

			for (i=0, l = points.length - 1; i<l; i++) {
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

			doSimplify = this._map.getZoom() < (this._map.getMaxZoom() + this.options.simplifyZoom);

		}

		if (doSimplify) {
			pointsToShow = L.LineUtil.simplify(pointsToShow, this.options.tolerance);
		}

		pointsToShow.forEach(function (point) {
			point._handle.update(this._map);
		}, this);
	},

	_updateHandles: function () {
		var id;

		if (this._handles) {
			for (id in this._handles) {
				this._handles[id].remove();
				delete this._handles[id];
			}
		} else {
			this._handles = {};
		}

		if (this._lines) {
			this._lines.splice(0, this._lines.length);
		} else {
			this._lines = [];
		}

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
	},

	_updateView: function () {
		for (var id in this._handles) {
			this._handles[id].remove();
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
L.larva.frame.vertices = function (path, options) {
	if (path._verticesFrame) {
		return path._verticesFrame;
	}

	return (path._verticesFrame = new L.larva.frame.Vertices(path, options));
};