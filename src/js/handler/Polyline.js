/**
 * @requires Path.js
 */
L.larva.handler.Polyline = L.larva.handler.Path.extend({

	options: {
		noUpdate: []
	},

	backupLatLngs: function () {
		this._path.forEachLatLng(function (latlng) {
			latlng._original = latlng.clone();
		});
	}

});