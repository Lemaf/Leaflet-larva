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

	_onEnd: function () {

		this._frame
			.off('drag:move', this._onMove, this)
			.off('drag:end', this._onEnd);
	},

	_onMove: function (evt) {

		var event = L.larva.getSourceEvent(evt);
		var worldPoint = this._getEventWorldPoint(event);

		var dx = worldPoint.x - this._startPosition.x,
		    dy = worldPoint.y - this._startPosition.y;

		if (event.ctrlKey && event.altKey) {
			var dxy = Math.min(Math.abs(dx), Math.abs(dy));

			dx = dx >= 0 ? dxy : -dxy;
			dy = dy >= 0 ? dxy : -dxy;
		} else if (event.altKey) {
			dy = null;
		} else if (event.ctrlKey) {
			dx = null;
		}

		this._transform(dx, dy);
	},

	_onStart: function (evt) {
		if (!evt.handle) {
			this.backupLatLngs();

			this._startPosition = this._getEventWorldPoint(L.larva.getSourceEvent(evt));

			this._frame
				.on('drag:move', this._onMove, this)
				.on('drag:end', this._onEnd, this);
		}

	},
	/**
	 * @param  {L.Point} original
	 * @param  {L.Point} transformed
	 * @param  {Number} dx
	 * @param  {Number} dy
	 */
	_transformPoint: function (original, transformed, dx, dy) {
		if (dx) {
			transformed.x = original.x + dx;
		}

		if (dy) {
			transformed.y = original.y + dy;
		}
	}

});

L.Polyline.addInitHook(function () {
	this.larva.move = new L.larva.handler.Polyline.Move(this);
});