/**
 * @requires Polygon.js
 * @requires Polyline.Edit.js
 */
L.larva.handler.Polygon.Edit = L.larva.handler.Polyline.Edit.extend({

	options: {
		makeHoleCursor: 'crosshair'
	},

	addHooks: function () {
		L.larva.handler.Polyline.Edit.prototype.addHooks.call(this);

		L.DomEvent
			.on(document, 'keydown', this._onKeyDown, this)
			.on(document, 'keyup', this._onKeyUp, this);
	},

	searchNearestPoint: function (point) {
		var found = [],
		    map = this.getMap(),
		    maxDist = this.options.newVertexRatioClick;

		var search = L.larva.handler.Polyline.Edit.searchNearestPointIn;

		this._path.forEachPolygon(function (shell, holes) {
			found = found.concat(search(point, maxDist, shell, map, true));

			holes.forEach(function (latlngs) {
				found = found.concat(search(point, maxDist, latlngs, map, true));
			}, this);
		}, this);

		return found;
	},

	_onKeyDown: function (event) {
		var keyCode = L.larva.getEventKeyCode(event);

		if (keyCode === L.larva.CTRL_KEY && !this._makeHole) {
			this._makeHole = true;
			this._previousCursor = this._path._path.style.cursor;
			this._path._path.style.cursor = this.options.makeHoleCursor;
		}
	},

	_onKeyUp: function (event) {
		var keyCode = L.larva.getEventKeyCode(event);

		if (this._makeHole && keyCode === L.larva.CTRL_KEY) {
			delete this._makeHole;
			this._path._path.style.cursor = this._previousCursor;
		}
	}

});

L.Polyline.addInitHook(function () {

	if (this instanceof L.Polygon) {
		this.larva.edit = new L.larva.handler.Polygon.Edit(this);
	} else {
		this.larva.edit = new L.larva.handler.Polyline.Edit(this);
	}

});