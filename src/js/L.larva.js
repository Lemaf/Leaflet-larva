/**
 * Leaflet namespace
 * @namespace L
 */

/**
 * Leaflet Larva namespace
 *
 * @namespace L.larva
 * 
 */
L.larva = {
	version: '0.1.1',

	CTRL_KEY: 17,

	NOP: function () {},

	/**
	 * @param  {Event} event
	 * @return {Number}
	 */
	getEventKeyCode: function (event) {
		return event.keyCode || event.key;
	},

	/**
	 * @param  {HTMLElement} el
	 * @return {Number}
	 */
	getHeight: function (el) {
		return el.offsetHeight;
	},

	/**
	 * @param  {L.Event} evt
	 * @return {Event}
	 */
	getSourceEvent: function (evt) {
		if (evt.sourceEvent) {
			evt = evt.sourceEvent;
		}

		return !evt.touches ?
		        evt : evt.touches[0];
	},

	/**
	 * @param  {HTMLElement} el
	 * @return {Number}
	 */
	getWidth: function (el) {
		return el.offsetWidth;
	},

	/**
	 * @param  {L.LatLng[]}  latlngs
	 * @return {Boolean}
	 */
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