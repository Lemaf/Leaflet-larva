/**
 * @requires Handle.js
 */

/**
 * @class
 *
 * @param {String} id
 * @param {HTMLElemet} frameEl
 * @param {HTMLElement} shadowPane
 * @param {Object} [options]
 */
L.larva.frame.RectHandle = L.larva.frame.Handle.extend(
/** @lends L.larva.frame.RectHandle.prototype */
{
	options: {
		cssClass: 'llarva-rectframe-handle',
		shaodowCssClass: 'llarva-rectframe-handle-shadow'
	},

	initialize: function(id, frameEl, shadowPane, options) {
		L.larva.frame.Handle.prototype.initialize.call(this, frameEl, shadowPane, options);
		this._id = id;

		L.DomUtil.addClass(this._handle, 'llarva-rectframe-handle-' + id);

		this._handle.style.position = 'absolute';
	},

	/**
	 * @param {Object} style
	 */
	setStyle: function (style) {
		if (style.hide) {
			this._handle.style.display = 'none';
			if (this._shadow) {
				this._handle.style.display = 'none';
			}

			if (style.draggable) {
				if (this._draggle) {
					this._draggle.disable();
					this.update();
					this._draggle.enable();
				} else {
					this.update();
					this._draggle = new L.Draggable(this._handle);
				}
			}
		}
	},

	/**
	 */
	update: function () {
		var id = this._id, style = {}, handle = this._handle;

		var computedStyle = getComputedStyle(this._handlePane);

		switch (id[0]) {
			case 't':
				style.top = (L.larva.getHeight(handle) / -2 - parseInt(computedStyle.borderTopWidth) / 2) + 'px';
				break;

			case 'm':
				style.top = '50%';
				style.marginTop = (L.larva.getHeight(handle) / -2) + 'px';
				break;

			case 'b':
				style.bottom = (L.larva.getHeight(handle) / -2 - parseInt(computedStyle.borderBottomWidth) / 2) + 'px';
				break;
		}

		switch (id[1]) {
			case 'l':
				style.left = (L.larva.getWidth(handle) / -2 - parseInt(computedStyle.borderLeftWidth) / 2) + 'px';
				break;

			case 'm':
				style.marginLeft = (L.larva.getWidth(handle) / -2) + 'px';
				style.left = '50%';
				break;

			case 'r':
				style.right = (L.larva.getWidth(handle) / -2 - parseInt(computedStyle.borderRightWidth) / 2) + 'px';
				break;
		}

		L.extend(handle.style, style);
	}

});

L.larva.frame.rectHandle = function (id, frameEl, shadowPane, options) {
	return new L.larva.frame.RectHandle(id, frameEl, shadowPane, options);
};