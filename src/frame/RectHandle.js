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
		var currentPos = L.DomUtil.getPosition(this._handleEl);
		this._lock = currentPos.subtract(layerBounds.min);
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
				this._draggable.once('dragend', this._onDragEnd, this);
			}
			this._draggable.enable();
		} else {
			if (this._draggable) {
				this._draggable.disable();
				delete this._draggable;
			}
		}

		return this;
	},

	/**
	 * @return {L.larva.frame.RectHandle} this
	 */
	unlock: function () {
		delete this._lock;
	},

	/**
	 * @param  {L.map} map
	 * @param  {L.Bounds} layerBounds
	 * @return {L.larva.frame.rectHandle} this
	 */
	update: function (map, layerBounds) {
		var top, left;

		if (!this._handleEl.offsetParent) {
			return;
		}

		var point;

		if (this._lock) {
			point = layerBounds.min.add(this._lock);
		} else {
			switch (this._position[0]) {
				case 't':
					top = layerBounds.min.y;
					break;

				case 'm':
					top = (layerBounds.max.y + layerBounds.min.y) / 2;
					break;

				case 'b':
					top = layerBounds.max.y;
					break;
			}

			switch (this._position[1]) {
				case 'l':
					left = layerBounds.min.x;
					break;

				case 'm':
					left = (layerBounds.max.x + layerBounds.min.x) / 2;
					break;

				case 'r':
					left = layerBounds.max.x;
					break;
			}
			point = L.point(left, top).subtract(this._halfSize);
		}

		if (this._lock || !this._draggable || !L.DomUtil.getPosition(this._handleEl)) {
			L.DomUtil.setPosition(this._handleEl, point);
		}
	},

	_onDragEnd: function () {
		this._dragged = true;
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