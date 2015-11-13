/**
 * @requires L.Polyline.js
 */

L.extend(L.Polygon, {
	POLYGON: 3,
	MULTIPOLYGON: 4
});

L.Polygon.include({

	getType: function () {
		var latlngs = this._latlngs[0];

		if (Array.isArray(latlngs[0])) {
			latlngs = latlngs[0];

			if (Array.isArray(latlngs[0]) && Array.isArray(latlngs[0][0])) {
				return L.Polygon.MULTIPOLYGON;
			}
		}

		return L.Polygon.POLYGON;
	},

	forEachPolygon: function (fn, context) {
		var latlngs = this._latlngs;

		switch (this.getType()) {
			case L.Polygon.POLYGON:

				if (context) {
					fn.call(context, latlngs[0], latlngs.slice(1));
				} else {
					fn(latlngs[0], latlngs.slice(1));
				}

				break;

			case L.Polygon.MULTIPOLYGON:

				for (var i=0, l=latlngs.length; i<l; i++) {
					if (context) {
						fn.call(context, latlngs[i][0], latlngs[i].slice(1));
					} else {
						fn(latlngs[i][0], latlngs[i].slice(1));
					}
				}

				break;
		}
	}

});