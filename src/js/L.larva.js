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
	}
};