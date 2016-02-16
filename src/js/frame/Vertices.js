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
L.larva.frame.Vertices = L.Layer.extend(
/** @lends L.larva.frame.Vertices.prototype */
{
	options: {
		colorFactor: [0.8, 1.3, 0.8],
		handleClassName: 'llarva-vertex',
		opacityFactor: 0.8,
		sqrEditResistance: 4,
		pane: 'llarva-frame',
		tolerance: 10,
		simplifyZoom: -1,
	},

	initialize: function (path, options) {
		this._path = path;

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
			moveend: this._updateView,
			zoomend: this._onZoomEnd
		};
	},

	getHandleId: function (latlng) {
		if (latlng._lhandle) {
			var id = L.stamp(latlng._lhandle);
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
			return this._handles[handleId]._latlng;
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
			    latlng = handle._latlng.clone(),
			    style = L.larva.style(this._path).multiplyBy({
			    	color: this.options.colorFactor,
			    	opacity: this.options.opacityFactor
			    }),
			    latlng0;

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

			polyline = L.polyline(latlngs, L.extend({}, style, {
				noClip: true
			})).addTo(this._map);

			this._ghosts[handleId] = {
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
	 * @returns {L.LatLng} Ghost's L.LatLng
	 */
	stopGhost: function (handleId) {
		var ghost, handle;
		if (this._ghosts && (ghost = this._ghosts[handleId])) {
			this._map.removeLayer(this._ghosts[handleId].polyline);
			delete this._ghosts[handleId];

			handle = this._handles[handleId];
			handle._point = this._map.latLngToLayerPoint(ghost.latlng);
			return ghost.latlng;
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

	_createOrUpdateHandles: function (latlngs, isPolygon, isHole) {

		var i, handle, prev, handles = [], first;

		for (i = 0; i < latlngs.length; i++) {

			if (latlngs[i]._lhandle) {
				handle = latlngs[i]._lhandle;
				delete handle._isPolygon;
				delete handle._isHole;
				delete handle._prev;
				delete handle._next;
				delete handle._first;
				delete handle._last;
			} else {
				handle = latlngs[i]._lhandle = L.DomUtil.create('div', this.options.handleClassName);
				L.DomEvent
					.on(handle, L.Draggable.START.join(' '), this._onHandleDown, this)
					.on(handle, 'dblclick', this._onHandleDblclick, this);
			}

			if (isPolygon) {
				handle._isPolygon = true;
			}

			if (isHole) {
				handle._isHole = true;
			}


			handle._latlng = latlngs[i];
			handle._point = this._map.latLngToLayerPoint(handle._latlng);

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

		if (isPolygon && first) {
			first._last = handle;
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
			for (id in this._ghosts) {
				ghost = this._ghosts[id];
				delete this._ghosts[id];

				this._map.removeLayer(ghost.polyline);

				this.fire('ghost:end', {
					id: id,
					latlng: ghost.latlng
				});
			}
		} finally {
			this.fire('handle:end', {
				sourceEvent: evt
			});
		}
	},

	_onHandleDblclick: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('handle:dblclick', {
			id: L.stamp(evt.target),
			originalEvent: evt
		});
	},

	_onHandleDown: function (evt) {
		L.DomEvent.stop(evt);
		var sourceEvent = L.larva.getSourceEvent(evt);

		this._position = {
			x: sourceEvent.clientX, y: sourceEvent.clientY
		};

		var startEvent = {
			id: L.stamp(evt.target),
			sourceEvent: evt
		};

		if (this.options.sqrEditResistance) {
			this._position.lock = startEvent;
		} else {
			this.fire('handle:start', startEvent);
		}

		L.DomEvent
			.on(document, L.Draggable.MOVE[evt.type], this._onMove, this)
			.on(document, L.Draggable.END[evt.type], this._onEnd, this);

		L.DomUtil.addClass(document.body, 'leaflet-dragging');
	},

	_onMove: function (evt) {
		var ghost, handle, id, dx, dy, newPoint, newLatLng;

		L.DomEvent.stop(evt);

		if (this._position.lock) {
			dx = evt.clientX - this._position.x;
			dy = evt.clientY - this._position.y;

			if (((dx * dx) + (dy * dy)) >= this.options.sqrEditResistance) {
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

			this._updateHandlePosition(handle, newPoint);
		}

		this.fire('handle:move', {
			sourceEvent: evt
		});
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
				delete this._handles[id];
				L.DomUtil.remove(handle);
			}
		} else {
			this._handles = {};
		}

		if (!this._lines) {
			this._lines = [];
		} else {
			this._lines.splice(0, this._lines.length);
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

		var bounds = this._map.getPixelBounds(),
		    pixelOrigin = this._map.getPixelOrigin();

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
L.larva.frame.vertices = function (path, options) {
	if (path._verticesFrame) {
		return path._verticesFrame;
	}

	return (path._verticesFrame = new L.larva.frame.Vertices(path, options));
};