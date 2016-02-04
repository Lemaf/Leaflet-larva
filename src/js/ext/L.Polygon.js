/**
 * @requires L.Polyline.js
 */

/**
 * @external "L.Polygon"
 * @see {@link external:"L.Polyline" Extends L.Polyline}
 */

L.extend(L.Polygon, {
	POLYGON: 3,
	MULTIPOLYGON: 4
});

L.Polygon.include({

	/**
	 * @memberOf external:"L.Polygon"
	 * @instance
	 * @returns {Number}
	 *
	 * Value|Type
	 * -----|----
	 * 3| Polygon
	 * 4| MultiPolygon
	 */
	getType: function () {
		var latlngs = this._latlngs;

		if (latlngs.length) {
			if (!L.larva.isFlat(latlngs[0])) {
				return L.Polygon.MULTIPOLYGON;
			}
		}

		return L.Polygon.POLYGON;
	},

	/**
	 * @param  {Function} fn      ({L.LatLng}, {L.LatLng[]}, hole? {Boolean})
	 * @param  {Any}   context
	 */
	forEachLatLng: function (fn, context) {
		var i=0, j, k, polygons = [], polygon, hole, latlngs = this.getLatLngs();

		if (L.larva.isFlat(latlngs[0])) {
			polygons.push(latlngs);
		} else {
			polygons = latlngs;
		}

		for (; i<polygons.length; i++) {
			polygon = polygons[i];

			for (j=0; j<polygon.length; j++) {
				hole = j > 0;
				for (k=0; k<polygon[j].length; k++) {
					fn.call(context, polygon[j][k], polygon[j], hole);
				}
			}
		}
	},

	/**
	 * @param  {Function} fn
	 * @param  {Any}   context
k	 */
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