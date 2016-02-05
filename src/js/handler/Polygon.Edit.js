/**
 * @requires Polygon.js
 * @requires Polyline.Edit.js
 * @requires ../Util.js
 * @requires New.Polygon.js
 */
L.larva.handler.Polygon.Edit = L.larva.handler.Polyline.Edit.extend({

	options: {
		allowMakeHole: true,
		makeHoleCursor: 'crosshair',
		newHoleOptions: {

		}
	},

	addHooks: function () {
		L.larva.handler.Polyline.Edit.prototype.addHooks.call(this);

		if (this.options.allowMakeHole) {
			this._path
				.on('click', this._onPathClickHole, this);
		}
	},

	_searchNearestPoint: function (point) {
		var found = [],
		    map = this.getMap(),
		    maxDist = this.options.maxDist;

		var search = L.larva.handler.Polyline.Edit.searchNearestPointIn;

		this._path.forEachPolygon(function (shell, holes) {
			found = found.concat(search(point, maxDist, shell, map, true));

			holes.forEach(function (latlngs) {
				found = found.concat(search(point, maxDist, latlngs, map, true));
			}, this);
		}, this);

		return found;
	},

	_onNewHole: function (evt) {
		if (this._shellHole) {
			delete this._makingHole;
			var polygons = this._path.getLatLngs();
			if (this._path.getLatLngs() === L.Polygon.POLYGON) {
				polygons = [polygons];
			}

			this._newPolygonHole.disable();

			var index;
			for (var p=0; p<polygons.length; p++) {
				if ((index = polygons[p].indexOf(this._shellHole)) !== -1) {
					polygons[p].push(evt.layer.getLatLngs()[0]);

					this._path.updateBounds();
					this._path.redraw();
					this._frame.redraw();
					break;
				}
			}
		}
	},

	_onPathClickHole: function (evt) {

		if (!this._makingHole && evt.originalEvent.ctrlKey) {
			this._makingHole = true;

			var point = evt.layerPoint, points, found = [];

			this._path.forEachPolygon(function (shell) {
				points = shell.map(L.Map.prototype.latLngToLayerPoint, this.getMap());

				if (L.larva.Util.pointIsInside(point, points)) {
					found.push(shell);
				}
			}, this);

			if (found.length === 1) {
				this._shellHole = found[0];
				this._newPolygonHole = new L.larva.handler.New.Polygon(this.getMap(), L.extend({}, this.options.newHoleOptions, {
					allowFireOnMap: false
				}))
				.on('ldraw:created', this._onNewHole, this)
				.addLatLng(evt.latlng);

				this._newPolygonHole.enable();
			}
		}
	},

	_removeLatLng: function (handleId) {
		var latlng = this._frame.getLatLng(handleId),
		    latlngs = this._path.getLatLngs(),
		    index, i=0, p=0;

		switch (this._path.getType()) {
			case L.Polygon.POLYGON:

				for (; i<latlngs.length; i++) {
					if ((index = latlngs[i].indexOf(latlng)) !== -1) {
						if (latlngs[i].length <= 3) {
							if (i === 0) {
								// shell..
								latlngs.splice(0, latlngs.length);
							} else {
								latlngs.splice(index, 1);
							}
						} else {
							latlngs[i].splice(index, 1);
						}
					}
				}

				break;

			default:

				l: for (; p<latlngs.length; p++) {
					// each polygon
					for (i=0; i<latlngs[p].length; i++) {
						if ((index = latlngs[p][i].indexOf(latlng)) !== -1) {
							if (latlngs[p][i].length <= 3) {
								if (i === 0) {
									//shell
									latlngs.splice(p, 1);
								} else {
									latlngs[p].splice(i, 1);
								}
							} else {
								latlngs[p][i].splice(index, 1);
							}

							break l;
						}
					}
				}
		}

		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_restoreCursor: function () {

	},

	_setHoleCursor: function () {

	}

});

L.Polyline.addInitHook(function () {

	if (this instanceof L.Polygon) {
		this.larva.edit = new L.larva.handler.Polygon.Edit(this);
	} else {
		this.larva.edit = new L.larva.handler.Polyline.Edit(this);
	}

});