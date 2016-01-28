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

	_onNewHole: function () {
		if (this._shellHole) {
			var holeLatlngs = evt.layer.getLatLngs().slice(0);

			var latlngs = this._path.getLatLngs();
		}
	},

	_onPathClickHole: function (evt) {

		if (!this._makingHole && evt.originalEvent.ctrlKey) {
			this._makingHole = true;

			var point = evt.layerPoint, points, found = [];

			this._path.forEachPolygon(function (shell) {
				points = shell.map(this.getMap().latLngToLayerPoint, this.getMap());

				if (L.larva.Util.pointIsInside(point, points)) {
					found.push(shell);
				}
			}, this);

			if (found.length === 1) {
				this._shellHole = found[0];
				this._newPolygonHole = new L.larva.handler.New.Polygon(this.getMap(), L.extend({}, this.options.newHoleOptions, {
					allowFireOnMap: false
				}));

				this._newPolygonHole
					.on('ldraw:created', this._onNewHole, this)
					.enable();

				this._newPolygonHole.addLatLng(evt.latlng);
			}
		}
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