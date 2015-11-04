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