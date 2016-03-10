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

	_doNewHole: function (polygon, hole) {
		polygon.push(hole);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	},

	_searchNearestPoint: function (point) {
		var found = [],
		    map = this.getMap(),
		    maxDist = this.options.maxNewVertexDistance;

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

			if (this._path.getType() === L.Polygon.POLYGON) {
				polygons = [polygons];
			}

			this._newPolygonHole.disable();

			var index;
			for (var p=0; p<polygons.length; p++) {
				if ((index = polygons[p].indexOf(this._shellHole)) !== -1) {

					var args = [
						polygons[p],
						evt.layer.getLatLngs()[0]
					];

					this._doNewHole.apply(this, args);

					this._do(L.larva.l10n.editPolygonAddHole, this._doNewHole, args, this._undoNewHole, args, true);
					break;
				}
			}
		}
	},

	_onPathClickHole: function (evt) {

		if (!this._makingHole && evt.originalEvent.ctrlKey) {

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
				})).on('ldraw:created', this._onNewHole, this);

				this._newPolygonHole.enable();
				this._newPolygonHole.addLatLng(evt.latlng);
				this._makingHole = true;
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
								// latlngs.splice(0, latlngs.length);
								this._removeItems(latlngs.slice(0), latlngs, 0);
							} else {
								// latlngs.splice(index, 1);
								this._removeItem(latlngs[i], latlngs, i);
							}
						} else {
							// latlngs[i].splice(index, 1);
							this._removeItem(latlng, latlngs[i], index);
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
									// latlngs.splice(p, 1);
									this._removeItem(latlngs[p], latlngs, p);
								} else {
									// latlngs[p].splice(i, 1);
									this._removeItem(latlngs[p][i], latlngs[p], i);
								}
							} else {
								// latlngs[p][i].splice(index, 1);
								this._removeItem(latlng, latlngs[p][i], index);
							}

							break l;
						}
					}
				}
		}
	},

	_restoreCursor: function () {

	},

	_setHoleCursor: function () {

	},

	_undoNewHole: function (polygon, hole) {
		var index = polygon.indexOf(hole);
		if (index !== -1) {
			polygon.splice(index, 1);
			this._path.updateBounds();
			this._path.redraw();
			this._frame.redraw(true);
		}
	}

});

L.Polyline.addInitHook(function () {

	if (this instanceof L.Polygon) {
		this.larva.edit = new L.larva.handler.Polygon.Edit(this);
	} else {
		this.larva.edit = new L.larva.handler.Polyline.Edit(this);
	}

});