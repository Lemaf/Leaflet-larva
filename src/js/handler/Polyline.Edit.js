/**
 * @requires Polyline.js
 * @requires ../frame/Vertices.js
 */
L.larva.handler.Polyline.Edit = L.larva.handler.Polyline.extend({

	addHooks: function () {
		this._frame = L.larva.frame.vertices(this._path).addTo(this._path._map);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.edit = new L.larva.handler.Polyline.Edit(this);
});