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