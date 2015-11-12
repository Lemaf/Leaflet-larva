/**
 * @requires Polyline.js
 * @requires ../frame/Path.js
 * @requires ../frame/Style.js
 * @requires ../ext/L.Polyline.js
 */

L.larva.handler.Polyline.Rotate = L.larva.handler.Polyline.extend({

	options: {
		noUpdate: [L.larva.frame.Path.MIDDLE_MIDDLE]
	},

	addHooks: function () {
		this._frame = L.larva.frame.path(this._path);
		this._frame.addTo(this._path._map);

		this._frame.setStyle(this._frameStyle);

		this._frame.on('drag:start', this._onStart, this);
	},

	transformPoint: function (original, transformed, sin, cos, dx, dy) {
		transformed.x = original.x * cos - original.y * sin + dx;
		transformed.y = original.x * sin + original.y * cos + dy;
	},

	_onEnd: function () {
		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd, this);
	},

	_onMove: function (evt) {
		var position = evt.sourceEvent.touches ? evt.sourceEvent.touches[0] : evt.sourceEvent;

		var centerBounding = this._centerElement.getBoundingClientRect();

		var cx = (centerBounding.left + centerBounding.width / 2),
		    cy = (centerBounding.top + centerBounding.height / 2);

		var i = position.clientX - cx,
		    j = position.clientY - cy;

		var length = Math.sqrt(i * i + j * j);

		// cross product
		var sin = (this._vector.i * j - this._vector.j * i) / length;

		// scalar product
		var cos = (this._vector.i * i + this._vector.j * j) / length;

		var frameBounding = this._frame.getFrameClientRect(),
		    framePosition = this._frame.getPosition();

		cx = (cx - frameBounding.left) + framePosition.x;
		cy = (cy - frameBounding.top) + framePosition.y;

		var dx = cx * (1 - cos) + cy * sin;
		var dy = cy * (1 - cos) - cx * sin;

		this.transform(sin, cos, dx, dy);
	},

	_onStart: function (evt) {
		if (!evt.handle || evt.handle === L.larva.frame.Path.MIDDLE_MIDDLE) {
			return;
		}

		var centerElement = this._centerElement = this._frame.getHandle(L.larva.frame.Path.MIDDLE_MIDDLE);

		var centerBounding = centerElement.getBoundingClientRect(),
		    targetBounding = evt.sourceEvent.target.getBoundingClientRect();

		var vector = this._vector = {
			i: (targetBounding.left + targetBounding.width / 2) - (centerBounding.left - centerBounding.width / 2),
			j: (targetBounding.top + targetBounding.height / 2) - (centerBounding.top - centerBounding.height / 2)
		};

		vector.length = Math.sqrt(vector.i * vector.i + vector.j * vector.j);

		vector.i = vector.i / vector.length;
		vector.j = vector.j / vector.length;

		this.backupLatLngs();

		this._frame
			.on('drag:move', this._onMove, this)
			.on('drag:end', this._onEnd, this);
	}

});

L.Polyline.addInitHook(function () {
	this.larva.rotate = new L.larva.handler.Polyline.Rotate(this, L.larva.frame.Style.Rotate);
});