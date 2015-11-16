/**
 * @requires Polyline.js
 * @requires ../frame/Vertices.js
 */
L.larva.handler.Polyline.Edit = L.larva.handler.Polyline.extend({

	addHooks: function () {
		this._frame = L.larva.frame.vertices(this._path).addTo(this._path._map);
		this._frame.on('drag:start', this._onDragStart, this);
	},

	_onDragEnd: function () {
		this._frame
			.off('drag:move', this._onDragMove, this)
			.off('drag:end', this._onDragEnd, this);
	},

	_onDragMove: function (evt) {
		var sourceEvent = L.larva.getSourceEvent(evt);

		var dx = sourceEvent.clientX - this._startPos.x,
		    dy = sourceEvent.clientY - this._startPos.y;

		var newLatLng = this._path._map.layerPointToLatLng(this._original.clone()._add({
			x: dx, y: dy
		}));

		this._frame.updateLatLng(this._handleId, newLatLng);
		this._path.updateBounds();
		this._path.redraw();
	},

	_onDragStart: function (evt) {
		var sourceEvent = L.larva.getSourceEvent(evt);

		this._original = this._frame.getPosition(evt.id).clone();
		this._handleId = evt.id;

		this._startPos = {
			x: sourceEvent.clientX, y: sourceEvent.clientY
		};

		this._frame
			.on('drag:move', this._onDragMove, this)
			.on('drag:end', this._onDragEnd, this);

	}

});

L.Polyline.addInitHook(function () {
	this.larva.edit = new L.larva.handler.Polyline.Edit(this);
});