/**
 * @requires ../frame/Rect.js
 * @requires ../frame/RECT_STYLE.js
 * @requires ../ext/L.Polyline.js
 * 
 * @requires Polyline.Transform.js
 */

/**
 * @class Move layer
 *
 * @extends {L.larva.handler.Polyline.Transform}
 */
L.larva.handler.Polyline.Move = L.larva.handler.Polyline.Transform.extend(
/** @lends L.larva.handler.Polyline.Move.prototype */
{

	addHooks: function() {
		this._frame = L.larva.frame.rect(this._path).addTo(this.getMap());
		this._frame.on('dragstart', this._onDragStart, this);

		//this._previousCursor = this._frame.getComputedStyle().cursor;
		// this._frame.setElementStyle({
		// 	cursor: 'move'
		// });

		this._frame.redraw();
	},

	_deltaOf: function (evt) {
		var event = L.larva.getOriginalEvent(evt);
		var worldPoint = this._getEventWorldPoint(event);

		var x = worldPoint.x - this._startPosition.x,
		    y = worldPoint.y - this._startPosition.y;

		if (event.ctrlKey && event.altKey) {
			var dxy = Math.min(Math.abs(x), Math.abs(y));

			x = x >= 0 ? dxy : -dxy;
			y = y >= 0 ? dxy : -dxy;
		} else if (event.altKey) {
			y = null;
		} else if (event.ctrlKey) {
			x = null;
		}

		return {x: x, y: y};
	},

	_getEventWorldPoint: function(event) {
		var pagePosition = this._frame.getPosition(true),
		    layerPosition = this._frame.getPosition();

		return L.larva.project(
			this.unproject(
				event.clientX - pagePosition.x + layerPosition.x,
				event.clientY - pagePosition.y + layerPosition.y
			)
		);
	},


	_onDragEndOffTheFly: function () {
		this._stopPreview();

		this._frame
			.off('drag', this._onDragOffTheFly, this)
			.off('dragend', this._onDragEndOffTheFly, this)
			.unlockDraggagle();

		if (this._delta) {
			this._apply(L.larva.l10n.transformMove, [this._delta], [this._delta]);
		}
	},

	_onDragEndOnTheFly: function () {
		this._frame
			.off('drag', this._onDragOnTheFly, this)
			.off('dragend', this._onDragEndOnTheFly)
			.unlockDraggagle();

		if (this._delta) {
			this._apply(L.larva.l10n.transformMove, [this._delta], [this._delta], true);
		}
	},

	_onDragOnTheFly: function (evt) {
		this._transform(this._delta = this._deltaOf(evt));
	},

	_onDragOffTheFly: function (evt) {
		this._transformPreview(this._delta = this._deltaOf(evt));
	},

	_onDragStart: function (evt) {
		if (!evt.handle) {
			this.backupLatLngs();

			delete this._delta;
			this._startPosition = this._getEventWorldPoint(L.larva.getOriginalEvent(evt));

			this._frame.lockDraggables();

			if (this.options.onTheFly) {
				this._frame
					.on('drag', this._onDragOnTheFly, this)
					.on('dragend', this._onDragEndOnTheFly, this);
			} else {
				this._startPreview();
				this._frame
					.on('drag', this._onDragOffTheFly, this)
					.on('dragend', this._onDragEndOffTheFly, this);
			}
		}

	},
	/**
	 * @param  {L.Point} original
	 * @param  {L.Point} transformed
	 * @param {Object} delta
	 */
	_transformPoint: function (original, transformed, delta) {
		if (delta.x) {
			transformed.x = original.x + delta.x;
		}

		if (delta.y) {
			transformed.y = original.y + delta.y;
		}
	},

	_unTransformPoint: function (original, transformed, delta) {
		if (delta.x) {
			transformed.x = original.x - delta.x;
		}

		if (delta.y) {
			transformed.y = original.y - delta.y;
		}
	}

});

L.Polyline.addInitHook(function () {
	this.larva.move = new L.larva.handler.Polyline.Move(this);
});