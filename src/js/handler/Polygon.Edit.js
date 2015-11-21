/**
 * @requires Polygon.js
 * @requires Polyline.Edit.js
 */
L.larva.handler.Polygon.Edit = L.larva.handler.Polyline.Edit.extend({

	searchNearestPoint: function (point) {
		var dist, aPoint, bPoint, founded = [], i, l;

		function search (latlngs) {
			for (i=0, l=latlngs.length - 1; i<l; i++) {
				aPoint = this.getMap().latLngToLayerPoint(latlngs[i]);
				bPoint = this.getMap().latLngToLayerPoint(latlngs[i + 1]);
				dist = L.LineUtil.pointToSegmentDistance(point, aPoint, bPoint);

				if (dist <= this.options.newVertexRatioClick) {
					founded.push({
						point: L.LineUtil.closestPointOnSegment(point, aPoint, bPoint),
						index: i + 1,
						latlngs: latlngs
					});
				}
			}
		}
		
		this._path.forEachPolygon(function (shell, holes) {
			search.call(this, shell);
			holes.forEach(search, this);
		}, this);

		return founded;
	}

});

L.Polyline.addInitHook(function () {

	if (this instanceof L.Polygon) {
		this.larva.edit = new L.larva.handler.Polygon.Edit(this);
	} else {
		this.larva.edit = new L.larva.handler.Polyline.Edit(this);
	}

});