if (!L.Polyline.prototype.forEachLatLng) {
	L.Polyline.include({

		forEachLatLng: function (fn, context) {
			var latlngs = this.getLatLngs();

			if (!latlngs.length) {
				return;
			}

			if (Array.isArray(latlngs[0])) {
				// nested array

				latlngs = latlngs.reduce(function (array, latlngs) {
					return array.concat(latlngs);
				}, []);
			}

			latlngs.forEach(fn, context);
		}
	});
}

if (!L.Polyline.prototype.updateBounds) {
	L.Polyline.include({

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
		getType: function () {
			return Array.isArray(this._latlngs[0]) ?
			       L.Polyline.MULTIPOLYLINE : L.Polyline.POLYLINE;
		}
	});
}

L.Polyline.include({
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
	}
});