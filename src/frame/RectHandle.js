/**
 * @requires Handle.js
 */

/**
 * @class
 * @extends {L.larva.frame.Handle}
 * 
 * @param {String} position
 * @param {Object} [options]
 *
 */
L.larva.frame.RectHandle = L.larva.frame.Handle.extend(
/** @lends L.larva.frame.RectHandle.prototype */
{
	statics: {
		TOP_LEFT: 'tl', TOP_MIDDLE: 'tm', TOP_RIGHT: 'tr',
		MIDDLE_LEFT: 'ml', MIDDLE_MIDDLE: 'mm', MIDDLE_RIGHT: 'mr',
		BOTTOM_LEFT: 'bl', BOTTOM_MIDDLE: 'bm', BOTTOM_RIGHT: 'br'
	},

	options: {
		css: 'llarva-frame-recthandle'
	},

	initialize: function (position, options) {
		L.larva.frame.Handle.prototype.initialize.call(this, options);
		L.DomUtil.addClass(this._handleEl, 'llarva-' + position);
			// .addClass(this._handleEl, 'llarva-' + position);
		this._position = position;
	},

	add: function () {
		L.larva.frame.Handle.prototype.add.call(this);

		var halfWidth = this._halfWidth = L.larva.getWidth(this._handleEl) / 2;
		var halfHeight = this._halfHeight = L.larva.getHeight(this._handleEl) / 2;
		
		this._halfSize = L.point(halfWidth, halfHeight);

		return this;
	},

	/**
	 */
	freeze: function () {
		this._freeze = true;
	},

	/**
	 * @return {String}
	 */
	getPosition: function () {
		return this._position;
	},

	isDraggable: function () {
		return !!this._draggable;
	},

	/**
	 * @param  {[type]} layerBounds [description]
	 * @return {[type]}             [description]
	 */
	lock: function (layerBounds) {
		var currentPosition = L.DomUtil.getPosition(this._handleEl);

		if (currentPosition) {
			this._lock = currentPosition.subtract(layerBounds.min);
		}
	},

	setCssSuffix: function (suffix) {
		if (this._suffix) {
			L.DomUtil.removeClass(this._handleEl, 'llarva-' + this._position + '-' + this._suffix);
		}

		this._suffix = suffix;
		L.DomUtil.addClass(this._handleEl, 'llarva-' + this._position + '-' + suffix);
	},

	setDraggable: function (draggable) {
		if (this._dragged) {
			delete this._dragged;
		}

		if (draggable) {

			if (!this._draggable) {
				this._draggable = new L.Draggable(this._handleEl);
				this._draggable.on('dragend', this._onDragEnd, this);
			}

			this._draggable.enable();

			if (!this._relative) {
				var rx, ry;
				switch (this._position[0]) {
					case 't':
						ry = 0;
						break;
					case 'm':
						ry = 0.5;
						break;
					case 'b':
						ry = 1;
						break;
				}

				switch (this._position[1]) {
					case 'l':
						rx = 0;
						break;
					case 'm':
						rx = 0.5;
						break;
					case 'r':
						rx = 1;
						break;
				}

				this._relative = L.point(rx, rx);
			}

		} else {
			if (this._draggable) {
				this._draggable.disable();
				delete this._draggable;
			}
			delete this._relative;
		}

		return this;
	},

	unfreeze: function () {
		delete this._freeze;

		if (this._relative) {
			this._updateRelative();
		}
	},

	/**
	 * @return {L.larva.frame.RectHandle} this
	 */
	unlock: function () {
		delete this._lock;
	},

	/**
	 * @param  {L.map} map
	 * @param  {L.Bounds} bounds
	 * @return {L.larva.frame.rectHandle} this
	 */
	update: function (map, bounds) {
		var y, x;

		this._lastBounds = bounds;

		if (!this._handleEl.offsetParent || (this._freeze && L.DomUtil.getPosition(this._handleEl))) {
			return;
		}

		var point;

		if (this._lock) {
			point = bounds.min.add(this._lock);
		} else {
			if (this._relative) {
				point = bounds.min.add(bounds.max.subtract(bounds.min).scaleBy(this._relative));
			} else {
				switch (this._position[0]) {
					case 't':
						y = bounds.min.y;
						break;

					case 'm':
						y = (bounds.max.y + bounds.min.y) / 2;
						break;

					case 'b':
						y = bounds.max.y;
						break;
				}

				switch (this._position[1]) {
					case 'l':
						x = bounds.min.x;
						break;

					case 'm':
						x = (bounds.max.x + bounds.min.x) / 2;
						break;

					case 'r':
						x = bounds.max.x;
						break;
				}

				point = L.point(x, y);
			}

			point = point.subtract(this._halfSize);
		}

		if (point) {
			L.DomUtil.setPosition(this._handleEl, point);
		}
	},

	_onDragEnd: function () {
		this._dragged = true;
		this._updateRelative();
	},

	_updateRelative: function () {
		var lastBounds, point;
		if ((lastBounds = this._lastBounds)) {
			point = L.DomUtil.getPosition(this._handleEl);
			this._relative = point.add(this._halfSize).subtract(lastBounds.min)
			                 .unscaleBy(lastBounds.max.subtract(lastBounds.min));
		}
	}
});

/**
 * @param  {Object} position
 * @param  {Object} options
 * @return {L.larva.frame.RectHandle}
 */
L.larva.frame.rectHandle = function (position, options) {
	return new L.larva.frame.RectHandle(position, options);
};