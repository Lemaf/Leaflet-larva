/**
 * @external "L.Polyline"
 */
if (!L.Polyline.prototype.forEachLatLng) {
	L.Polyline.include({

		/**
		 * @memberOf external:"L.Polyline"
		 * @instance
		 * @param  {Function} fn ({L.LatLng}, {L.LatLng[]})
		 * @param  {Any}   context
		 */
		forEachLatLng: function (fn, context) {
			var i=0, j, latlngs = this.getLatLngs();

			if (L.larva.isFlat(latlngs)) {
				for (; i<latlngs.length; i++) {
					fn.call(context, latlngs[i], latlngs);
				}
			} else {
				for (; i<latlngs.length; i++) {
					for (j=0; j<latlngs[i].length; j++) {
						fn.call(context, latlngs[i][j], latlngs[i]);
					}
				}
			}
		}
	});
}

if (!L.Polyline.prototype.updateBounds) {
	L.Polyline.include({

		/**
		 * @memberOf external:"L.Polyline"
		 * @instance
		 */
		updateBounds: function () {
			var bounds = this._bounds = new L.LatLngBounds();

			this.forEachLatLng(function (latlng) {
				bounds.extend(latlng);
			});
		}

	});
}

if (!L.Polyline.prototype.getType) {

	L.extend(L.Polyline, {
		POLYLINE: 1,
		MULTIPOLYLINE: 2
	});

	L.Polyline.include({
		/**
		 * @memberOf external:"L.Polyline"
		 * @instance
		 * @returns {Number}
		 *
		 * Value | Type
		 * ------|-----
		 * 1 | Polyline
		 * 2 | MultiPolyline
		 */
		getType: function () {
			return Array.isArray(this._latlngs[0]) ?
			       L.Polyline.MULTIPOLYLINE : L.Polyline.POLYLINE;
		}
	});
}

L.Polyline.include({
	/**
	 * @memberOf external:"L.Polyline"
	 * @instance
	 * @param  {Function} fn
	 * @param  {Any}   context
	 */
	forEachLine: function (fn, context) {

		switch (this.getType()) {
			case L.Polyline.POLYLINE:
			case L.Polyline.MULTIPOLYLINE:

				if (!Array.isArray(this._latlngs[0])) {
					fn.call(context, this._latlngs);
				} else {
					for (var i=0; i<this._latlngs.length; i++) {
						fn.call(context, this._latlngs[i]);
					}
				}

				break;

			default:
				throw new Error('Invalid geometry type!');
		}
	},

	/**
	 * @memberOf external:"L.Polyline"
	 * @instance
	 * @param {L.LatLngBounds} bounds
	 */
	setBounds: function (bounds) {
		this._bounds = bounds;
	}
});