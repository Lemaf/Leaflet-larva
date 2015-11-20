L.larva = {
	version: '0.1.0',

	NOP: function () {},

	getHeight: function (el) {
		return el.offsetHeight;
	},

	getSourceEvent: function (evt) {
		if (evt.sourceEvent) {
			evt = evt.sourceEvent;
		}

		return !evt.touches ?
		        evt : evt.touches[0];
	},

	getWidth: function (el) {
		return el.offsetWidth;
	},

	isFlat: function (latlngs) {

		if (Array.isArray(latlngs)) {
			if (latlngs[0] instanceof L.LatLng) {
				return true;
			}
		}

		return false;
	},

	project: function (latlng) {
		var point = L.Projection.Mercator.project(latlng);
		point.y = 0 - point.y;
		return point;
	},

	unproject: function (point) {
		point = point.clone();
		point.y = 0 - point.y;
		return L.Projection.Mercator.unproject(point);
	}
};