/**
 * @requires package.js
 */

/**
 * @class
 * @extends {L.Evented}
 *
 * @param {Object} options
 * @param {String} options.css
 * @param {HTMLElement} options.pane
 */
L.larva.frame.Handle = L.Evented.extend(
/** @lends L.larva.frame.Handle.prototype */
{
	options: {
		css: 'llarva-frame-handle',
		pane: null
	},

	initialize: function (options) {
		L.setOptions(this, options);
		this._handleEl = L.DomUtil.create('div', this.options.css);

		L.DomEvent
			.on(this._handleEl, L.Draggable.START.join(' '), this._onDragStart, this)
			.on(this._handleEl, 'dblclick', this._onDblClick, this);
	},

	/**
	 * @returns {L.larva.frame.Handle} this
	 */
	add: function () {
		if (!this._handleEl.offsetParent) {
			this.options.pane.appendChild(this._handleEl);
		}

		return this;
	},

	getEl: function () {
		return this._handleEl;
	},

	/**
	 * @returns {L.larva.frame.Handle} this
	 */
	remove: function () {
		if (this._handleEl.offsetParent) {
			L.DomUtil.remove(this._handleEl);
		}

		return this;
	},

	_onDblClick: function (evt) {
		L.DomEvent.stop(evt);
		this.fire('dblclick', {
			originalEvent: evt
		});
	},

	_onDragStart: function (evt) {
		L.DomEvent.stop(evt);
		this.fire('dragstart', {
			originalEvent: evt
		});
	}

});