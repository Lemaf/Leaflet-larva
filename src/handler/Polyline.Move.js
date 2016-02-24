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
		this._frame.on('drag:start', this._onStart, this);

		this._previousCursor = this._frame.getComputedStyle().cursor;
		this._frame.setElementStyle({
			cursor: 'move'
		});
	},

	_deltaOf: function (evt) {
		var event = L.larva.getSourceEvent(evt);
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
		var bounding = this._frame.getFrameClientRect(),
		    position = this._frame.getPosition();

		return L.larva.project(
			this.unproject(
				event.clientX - bounding.left + position.x,
				event.clientY - bounding.top + position.y
			)
		);
	},


	_onEndOffTheFly: function () {
		this._stopPreview();

		this._frame
			.off('drag:move', this._onMoveOffTheFly, this)
			.off('drag:end', this._onEndOffTheFly, this);

		this._apply(L.larva.l10n.transformMove, [this._delta], [this._delta]);
	},

	_onEndOnTheFly: function () {
		this._frame
			.off('drag:move', this._onMoveOnTheFly, this)
			.off('drag:end', this._onEndOnTheFly);

		this._apply(L.larva.l10n.transformMove, [this._delta], [this._delta], true);
	},

	_onMoveOnTheFly: function (evt) {
		this._transform(this._delta = this._deltaOf(evt));
	},

	_onMoveOffTheFly: function (evt) {
		this._transformPreview(this._delta = this._deltaOf(evt));
	},

	_onStart: function (evt) {
		if (!evt.handle) {
			this.backupLatLngs();

			this._startPosition = this._getEventWorldPoint(L.larva.getSourceEvent(evt));

			if (this.options.onTheFly) {
				this._frame
					.on('drag:move', this._onMoveOnTheFly, this)
					.on('drag:end', this._onEndOnTheFly, this);
			} else {
				this._startPreview();
				this._frame
					.on('drag:move', this._onMoveOffTheFly, this)
					.on('drag:end', this._onEndOffTheFly, this);
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