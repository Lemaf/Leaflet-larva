/**
 * @requires Polygon.js
 * @requires Polyline.Edit.js
 */
L.larva.handler.Polygon.Edit = L.larva.handler.Polyline.Edit.extend({

	searchNearestPoint: function (point) {
		var found = [],
		    map = this.getMap(),
		    maxDist = this.options.newVertexRatioClick;

		var search = L.larva.handler.Polyline.Edit.searchNearestPointIn;

		this._path.forEachPolygon(function (shell, holes) {
			found = found.concat(search(point, maxDist, shell, map, true));

			holes.forEach(function (latlngs) {
				found = found.concat(search(point, maxDist, latlngs, map, true));
			}, this);
		}, this);

		return found;
	}

});

L.Polyline.addInitHook(function () {

	if (this instanceof L.Polygon) {
		this.larva.edit = new L.larva.handler.Polygon.Edit(this);
	} else {
		this.larva.edit = new L.larva.handler.Polyline.Edit(this);
	}

});