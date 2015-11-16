L.larva = {
	version: '0.1.0',

	getHeight: function (el) {
		return el.offsetHeight;
	},

	getSourceEvent: function (evt) {
		return !evt.sourceEvent.touches ?
		        evt.sourceEvent : evt.sourceEvent.touches[0];
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
	}
};