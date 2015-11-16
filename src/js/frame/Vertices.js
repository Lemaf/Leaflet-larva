/**
 * @requires package.js
 *
 * @requires ../ext/L.Polygon.js
 */
L.larva.frame.Vertices = L.Layer.extend({

	statics: {
		POLYLINE: 1,
		POLYGON: 2,
		MULTIPOLYLINE: 3,
		MULTIPOLYGON: 4
	},

	options: {
		handleClassName: 'llarva-vertex',
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

	onAdd: function () {
		this._container = this.getPane();
		this._updateHandles();
		this._updateView();
	},

	_createHandles: function (latlngs, isPolygon, isHole) {

		var i, handle, prev, handles = [];

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

			this._handles[L.stamp(handle)] = handle;

			if (prev) {
				prev._next = handle;
				handle._prev = prev;
				prev = handle;
			}

			handles.push(handle);
		}

		this._lines.push({
			handles: handles,
			isHole: !!isHole,
			isPolygon: !!isPolygon
		});

		return handles;
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
				if (handle._draggable) {
					handle._draggable.disable();
				}
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

	_updatePosition: function (handle) {
		var point;

		if (handle._layerPoint) {
			point = handle._layerPoint.clone();
		} else {
			point = handle._layerPoint = this._map.latLngToLayerPoint(handle._latlng);
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
		var pointsToShow, draggable;

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

			if (!point._handle._draggable) {
				draggable = new L.Draggable(point._handle);
				point._handle._draggable = draggable;
			} else {
				draggable = point._handle._draggable;
			}

			draggable.enable();
		}, this);
	},

	_updateView: function () {
		var id, handle;

		for (id in this._handles) {
			handle = this._handles[id];

			if (handle.offsetParent) {
				L.DomUtil.remove(handle);
			}

			if (handle._draggable) {
				handle._draggable.disable();
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