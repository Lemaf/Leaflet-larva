/**
 * @requires package.js
 * @requires Vertex.js
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
		if (latlng._vertex) {
			var id = L.stamp(latlng._vertex);
			if (this._vertices[id]) {
				return id;
			}
		}

		return null;
	},
	/**
	 * Returns handle L.LatLng
	 * @param  {String}  vertexId
	 * @return {L.LatLng}
	 */
	getLatLng: function (vertexId) {
		if (this._vertices && this._vertices[vertexId]) {
			return this._vertices[vertexId].latlng;
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
	 * @param  {String} vertexId
	 * @return {L.Point}
	 */
	getPoint: function (vertexId) {
		if (this._vertices && this._vertices[vertexId]) {
			return this._vertices[vertexId].point;
		}
	},

	onAdd: function () {
		this._pane = this.getPane();
		this._shadowPane = this.getPane(this.options.shadowPane);
		this._updateVertices();
		this._updateView();
	},

	onRemove: function () {
		var id;

		if (this._vertices) {

			for (id in this._vertices) {
				this._vertices[id].remove();
			}

			delete this._vertices;
			delete this._lines;
		}

		for (id in L.Draggable.MOVE) {
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onMove, this)
				.off(document, L.Draggable.END[id], this._onEnd, this);
		}
	},

	/**
	 * @param  {String} vertexId
	 * @returns {Boolean} Does the ghost was created?
	 */
	startGhost: function (vertexId) {
		var vertex = this._vertices[vertexId];

		if (!vertex) {
			return false;
		}

		if (!this._ghosts) {
			this._ghosts = {};
		}

		if (!this._ghosts[vertexId]) {

			var polyline;

			var latlngs = [],
			    latlng = vertex.latlng.clone(),
			    style = L.larva.style(this._path).multiply({
			    	color: this.options.colorFactor,
			    	opacity: this.options.opacityFactor
			    });

			if (vertex.isPolygon) {

				latlngs.push((vertex.prev ? vertex.prev.latlng : vertex.last.latlng).clone());

				latlngs.push(latlng);

				latlngs.push((vertex.next ? vertex.next.latlng : vertex.first.latlng).clone());

			} else {

				if (vertex.prev) {
					latlngs.push(vertex.prev.latlng.clone());
				}

				latlngs.push(latlng);

				if (vertex.next) {
					latlngs.push(vertex.next.latlng.clone());
				}
			}

			polyline = L.polyline(latlngs, L.extend({}, style, {
				noClip: true
			})).addTo(this._map);

			this._ghosts[vertexId] = {
				point: vertex.point.clone(),
				polyline: polyline,
				latlng: latlng,
				x: this._position.x,
				y: this._position.y
			};
		}

		return true;
	},

	/**
	 * @param {Boolean} [updateVertices]
	 */
	redraw: function (updateVertices) {
		if (updateVertices) {
			this._updateVertices();
		}

		this._updateView();
		return this;
	},
	/**
	 * @param  {String} vertexId
	 * @returns {L.LatLng} Ghost's L.LatLng
	 */
	stopGhost: function (vertexId) {
		var ghost, vertex;
		if (this._ghosts && (ghost = this._ghosts[vertexId])) {
			this._map.removeLayer(this._ghosts[vertexId].polyline);
			delete this._ghosts[vertexId];

			vertex = this._vertices[vertexId];
			vertex.point = this._map.latLngToLayerPoint(ghost.latlng);
			return ghost.latlng;
		}
	},
	/**
	 * @param  {String} handleId
	 */
	updateHandle: function (handleId) {
		var vertex = this._vertices[handleId];
		if (vertex) {
			delete vertex.point;
			vertex.update(this._map);
		}
	},

	_createOrUpdateVertices: function (latlngs, isPolygon, isHole) {
		var i, vertex, prev, vertices = [], first,
		    vertexOptions = {
		    	pane: this._pane,
		    	shadowPane: this._shadowPane
		    };

		for (i = 0; i < latlngs.length; i++) {

			if (latlngs[i]._vertex) {
				vertex = latlngs[i]._vertex;
				delete vertex.isPolygon;
				delete vertex.isHole;
				delete vertex.prev;
				delete vertex.next;
				delete vertex.first;
				delete vertex.last;
			} else {
				// vertex = latlngs[i]._vertex = L.DomUtil.create('div', this.options.handleClassName);
				vertex = L.larva.frame.vertex(latlngs[i], vertexOptions);

				vertex
					.on('drag:start', this._onVertexDragStart, this)
					.on('dblclick', this._onVertexDblClick, this);
			}

			if (isPolygon) {
				vertex.isPolygon = true;
			}

			if (isHole) {
				vertex.isHole = true;
			}

			vertex.point = this._map.latLngToLayerPoint(vertex.latlng);

			this._vertices[L.stamp(vertex)] = vertex;

			if (prev) {
				prev.next = vertex;
				vertex.prev = prev;
				prev = vertex;

				if (isPolygon && first) {
					vertex.first = first;
				}

			} else {
				first = vertex;
				prev = vertex;
				//vertex.first = vertex;
			}

			vertices.push(vertex);
		}

		if (isPolygon && first) {
			first.last = vertex;
		}

		this._lines.push({
			vertices: vertices,
			isHole: !!isHole,
			isPolygon: !!isPolygon
		});

		return vertices;
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

	_onMove: function (evt) {
		var ghost, vertex, id, dx, dy, newPoint, newLatLng;

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
			vertex = this._vertices[id];

			dx = this._position.x - ghost.x;
			dy = this._position.y - ghost.y;

			newPoint = ghost.point.add(L.point(dx, dy));
			newLatLng = this._map.layerPointToLatLng(newPoint);
			ghost.latlng.lat = newLatLng.lat;
			ghost.latlng.lng = newLatLng.lng;

			ghost.polyline.updateBounds();
			ghost.polyline.redraw();

			vertex.update(newPoint);
		}

		this.fire('handle:move', {
			originalEvent: evt
		});
	},

	_onVertexDblClick: function (evt) {
		evt = L.larva.getSourceEvent(evt);
		L.DomEvent.stop(evt);

		this.fire('handle:dblclick', {
			id: L.stamp(evt.target),
			originalEvent: evt.originalEvent
		});
	},

	_onVertexDragStart: function (evt) {
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

	_onZoomEnd: function () {
		var id;

		for (id in this._vertices) {
			delete this._vertices[id].point;
			this._vertices[id].update(this._map);
		}
	},

	_showVertices: function (vertices, isPolygon) {
		var pointsToShow;

		var bounds = this._map.getPixelBounds(),
		    pixelOrigin = this._map.getPixelOrigin();

		var points = vertices.map(function (vertex) {
			var point = vertex.point.add(pixelOrigin);
			point._vertex = vertex;
			return point;
		});

		if (isPolygon) {

			pointsToShow = L.PolyUtil.clipPolygon(points, bounds).filter(function (point) {
				return !!point._vertex;
			});

		} else {

			var i,l, lineClip;

			pointsToShow = [];

			for (i=0, l = points.length - 1; i<l; i++) {
				lineClip = L.LineUtil.clipSegment(points[i], points[i + 1], bounds);
				if (lineClip) {
					if (lineClip[0]._vertex) {
						pointsToShow.push(lineClip[0]);
					}

					if (lineClip[1]._vertex) {
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
			point._vertex.update();
		}, this);
	},

	_updateVertices: function () {
		var id;

		if (this._vertices) {
			for (id in this._vertices) {
				this._vertices[id].remove();
				delete this._vertices[id];
			}
		} else {
			this._vertices = {};
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
					this._createOrUpdateVertices(line);
				}, this);

				break;

			case L.Polygon.POLYGON:
			case L.Polygon.MULTIPOLYGON:

				this._path.forEachPolygon(function (shell, holes) {

					this._createOrUpdateVertices(shell, true);

					holes.forEach(function (latlngs) {
						this._createOrUpdateVertices(latlngs, true, true);
					}, this);

				}, this);

				break;

			default:
				throw new Error('Invalid geometry type - ' + this.getPathType());
		}
	},

	_updateView: function () {
		for (var id in this._vertices) {
			this._vertices[id].remove();
		}

		this._lines.forEach(function (line) {
			this._showVertices(line.vertices, line.isPolygon, line.isHole);
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