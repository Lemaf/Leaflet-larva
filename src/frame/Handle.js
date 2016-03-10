/**
 * @requires package.js
 */

/**
 * @class
 * 
 * @param {HTMLElement} handlePane
 * @param {HTMLElement} [shadowPane]
 * @param {Object} [options]
 * 
 * @extends {L.Evented}
 */
L.larva.frame.Handle = L.Evented.extend(
/** @lends L.larva.frame.Handle.prototype */
{
	options: {
		cssClass: null,
		shaodowCssClass: null,
		shadowOffset: {
			x: 2,
			y: 2
		}
	},

	initialize: function (handlePane, shadowPane, options) {
		L.setOptions(this, options);
		this._handlePane = handlePane;
		this._shadowPane = shadowPane;

		this._handle = L.DomUtil.create('div', this.options.cssClass, handlePane);

		L.extend(this._handle.style, {
			position: 'absolute'
		});

		if (shadowPane && this.options.shaodowCssClass) {
			this._shadow = L.DomUtil.create('div', this.options.shaodowCssClass, shadowPane);
			L.extend(this._shadow.style, {
				marginTop: this.options.shadowOffset.x + 'px',
				marginLeft: this.options.shadowOffset.y + 'px'
			});
		}
	},

	/**
	 * @param {String} type
	 * @param {Function} fn
	 * @param {*} [context]
	 * @return {L.larva.frame.Handle} this
	 */
	off: function (type, fn, context) {
		L.Evented.prototype.off.call(type, fn, context);

		if (!this.listens(type)) {
			L.DomEvent.off(this._handle, type, this._onEvent, this);
		}
	},

	/**
	 * @param  {String}   type
	 * @param  {Function} fn
	 * @param  {*}   [context]
	 * @return {L.larva.frame.Handle} this
	 */
	on: function (type, fn, context) {
		var toAddListener = !this.listens(type);
		L.Evented.prototype.on.call(this, type, fn, context);

		if (toAddListener) {
			L.DomEvent.on(this._handle, type, this._onEvent, this);
		}

		return this;
	},

	/**
	 */
	remove: function () {
		if (this._handle.offsetParent) {
			L.DomUtil.remove(this._handle);

			if (this._shadow) {
				L.DomUtil.remove(this._shadow);
			}
		}
	},

	/**
	 * @abstract
	 * @param  {L.Map} map
	 * @param  {L.Point} [target]
	 */
	update: function () {
	},

	_onEvent: function (event) {
		this.fire(event.type, {
			originalEvent: event
		});
	}
});