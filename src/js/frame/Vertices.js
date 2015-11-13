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

	getEvents: function () {
		return {
			zoom: this._reset
		};
	},

	onAdd: function () {
		this._container = this.getPane();
		this._reset();
	},

	_createHandler: function (latlngs) {

		var handle, id, i, prev;

		for (i=0; i<latlngs.length; i++) {
			handle = L.DomUtil.create('div', this.options.handleClassName);
			handle._latlng = latlngs[i];
			id = L.stamp(handle);
			this._handles[id] = handle;

			this._setPosition(handle, latlngs[i]);

			if (prev) {
				prev._next = handle;
				handle._prev = prev;
				prev = handle;
			}
		}
	},

	_reset: function () {
		var id;

		if (this._handles) {
			for (id in this._handles) {
				L.DomUtil.remove(this._handles[id]);
			}

		}

		this._handles = {};

		var type = this._path.getType();

		switch (type) {
			case L.Polyline.POLYLINE:
			case L.Polyline.MULTIPOLYLINE:
				this._path.forEachLine(function (line) {
					this._createHandler(line);
				}, this);
				break;
			case L.Polygon.POLYGON:
			case L.Polygon.MULTIPOLYGON:
				this._path.forEachPolygon(function (shell, holes) {
					this._createHandler(shell);
					holes.forEach(this._createHandler, this);
				}, this);

				break;
		}

		//this._setPosition(this._handles[id], this._latlngs[id]);
	},

	_setPosition: function (handle, latlng) {
		var position = latlng instanceof L.Point ? latlng : this._path._map.latLngToLayerPoint(latlng);

		L.DomUtil.setPosition(handle, position.subtract(L.point(
			L.larva.getWidth(handle) / 2,
			L.larva.getHeight(handle) / 2
		)));
	}
});

L.larva.frame.vertices = function (path) {
	if (path._verticesFrame) {
		return path._verticesFrame;
	}

	return (path._verticesFrame = new L.larva.frame.Vertices(path));
};