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

	statics: {
		MULTIPOLYGON: 4,
		MULTIPOLYLINE: 3,
		POLYGON: 2,
		POLYLINE: 1
	},

	options: {
		colorFactor: [0.8, 1.3, 0.8],
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
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onMove, this)
				.off(document, L.Draggable.END[id], this._onEnd, this);
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
						do  {
							next._first = first;
						} while ((next = next._next));
					}
				}
			}

			for (var i=0, index; i<this._lines.length; i++) {
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

		for (i=0; i<latlngs.length; i++) {
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

			L.DomEvent
				.on(handle, L.Draggable.START.join(' '), this._onStart, this)
				.on(handle, 'dblclick', this._onHandleDblclick, this);

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
			L.DomEvent
				.off(document, L.Draggable.MOVE[id], this._onMove, this)
				.off(document, L.Draggable.END[id], this._onEnd, this);
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
			this.fire('handle:end', {
				sourceEvent: evt
			});
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

		this.fire('handle:move', {
			sourceEvent: evt
		});
	},

	_onStart: function (evt) {
		L.DomEvent.stop(evt);
		var sourceEvent = L.larva.getSourceEvent(evt);

		this._position = {
			x: sourceEvent.clientX, y: sourceEvent.clientY
		};

		this.fire('handle:start', {
			id: L.stamp(evt.target),
			sourceEvent: evt
		});


		L.DomEvent
			.on(document, L.Draggable.MOVE[evt.type], this._onMove, this)
			.on(document, L.Draggable.END[evt.type], this._onEnd, this);

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
L.larva.frame.vertices = function (path) {
	if (path._verticesFrame) {
		return path._verticesFrame;
	}

	return (path._verticesFrame = new L.larva.frame.Vertices(path));
};