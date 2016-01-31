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
		colorFactor: [2, 0.5, 2],
		handleClassName: 'llarva-vertex',
		opacityFactor: 0.5,
		pane: 'llarva-frame',
		tolerance: 10,
		simplifyZoom: -1
	},

	initialize: function (path) {
		this._path = path;
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
	 * @param  {String} handleId
	 * @return {L.LatLng}
	 */
	getLatLng: function (handleId) {
		if (this._handles && this._handles[handleId]) {
			return this._handles[handleId]._latlng;
		}
	},

	/**
	 * Returns handle layer position
	 * @param  {String} handleId
	 * @return {L.Point}
	 */
	getPosition: function (handleId) {
		if (this._handles && this._handles[handleId]) {
			return this._handles[handleId]._layerPoint;
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
	},

	/**
	 * @param  {String} handleId
	 */
	createAura: function (handleId) {
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
			    style = L.larva.style(this._path).multipleBy({
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
				polyline: polyline,
				latlng: latlng
			};
		}

		return true;
	},

	redraw: function () {
		this._updateHandles();
		this._updateView();
		return this;
	},

	/**
	 * @param  {String} handleId
	 * @param  {Boolean} commit
	 */
	stopAura: function (handleId, commit) {
		var aura;
		if (this._aura && (aura = this._aura[handleId])) {
			this._map.removeLayer(this._aura[handleId].polyline);
			delete this._aura[handleId];

			if (commit) {
				this._setLatLng(handleId, aura.latlng);
			}
		}
	},

	/**
	 * @param  {String} handleId
	 * @param  {L.Point} new layer position
	 */
	updateAura: function (handleId, newPoint) {
		var aura = this._aura ? this._aura[handleId] : null;

		if (aura) {

			var newLatLng = this._map.layerPointToLatLng(newPoint);
			aura.latlng.lat = newLatLng.lat;
			aura.latlng.lng = newLatLng.lng;

			aura.polyline.updateBounds();
			aura.polyline.redraw();

			this._updatePosition(this._handles[handleId], newPoint);
		}
	},

	/**
	 * @param  {String} handleId
	 */
	updateHandle: function (handleId) {
		var handle = this._handles[handleId];
		if (handle) {
			delete handle._layerPoint;
			this._updatePosition(handle);
		}
	},

	_setLatLng: function (handleId, newLatLng) {

		var handle = this._handles[handleId];

		if (handle) {
			handle._latlng.lat = newLatLng.lat;
			handle._latlng.lng = newLatLng.lng;
			delete handle._layerPoint;

			this._updatePosition(handle);

			this._path.updateBounds();
			this._path.redraw();
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
			handle._layerPoint = this._map.latLngToLayerPoint(handle._latlng);

			L.DomEvent.on(handle, L.Draggable.START.join(' '), this._onStart, this);

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

	_onMove: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('drag:move', {
			sourceEvent: evt
		});
	},

	_onStart: function (evt) {
		L.DomEvent.stop(evt);

		this.fire('drag:start', {
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
			handle._layerPoint = this._map.latLngToLayerPoint(handle._latlng);
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

		var type = this._path.getType();

		switch (type) {
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
				throw new Error('Invalid geometry type');
		}
	},

	_updatePosition: function (handle, target) {
		var point;

		if (target) {
			point = target.clone();
		} else if (handle._layerPoint) {
			point = handle._layerPoint.clone();
		} else {
			handle._layerPoint = this._map.latLngToLayerPoint(handle._latlng);
			point = handle._layerPoint.clone();
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
			var point = handle._layerPoint.add(pixelOrigin);
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

			this._updatePosition(point._handle);
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

L.larva.frame.vertices = function (path) {
	if (path._verticesFrame) {
		return path._verticesFrame;
	}

	return (path._verticesFrame = new L.larva.frame.Vertices(path));
};