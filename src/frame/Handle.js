/**
 * @requires package.js
 */

/**
 * @class
 * @extends {L.Evented}
 */
L.larva.frame.Handle = L.Evented.extend(
/** @lends L.larva.frame.Handle.prototype */
{
	options: {
		css: 'llarva-verticesframe-handle',
		shadowCss: 'llarva-verticesframe-handle-shadow',
		shadowOffset: {
			x: 0,
			y: 0
		}
	},

	initialize: function (latlng, options) {
		this.latlng = latlng;
		latlng._handle = this;

		L.setOptions(this, options);
		this.el = L.DomUtil.create('div', this.options.css, this.options.pane);
		this.shadowEl = L.DomUtil.create('div', this.options.shadowCss, this.options.shadowPane);

		L.DomEvent
			.on(this.el, L.Draggable.START.join(' '), this._onDragStart, this)
			.on(this.el, 'dblclick', this._onDblClick, this);
	},

	/**
	 */
	remove: function () {
		if (this.el.offsetParent) {
			L.DomUtil.remove(this.el);
			L.DomUtil.remove(this.shadowEl);
		}
	},

	/**
	 * @param  {L.Map} map
	 * @param  {L.Point} [target]
	 */
	update: function (map, target) {
		if (!target) {
			target = this.point || (this.point = map.latLngToLayerPoint(this.latlng));
		}

		if (!this.el.offsetParent) {
			this.options.pane.appendChild(this.el);
			this.options.shadowPane.appendChild(this.shadowEl);
		}

		L.DomUtil.setPosition(this.el, target.clone()._subtract({
			x: L.larva.getWidth(this.el) / 2,
			y: L.larva.getHeight(this.el) / 2
		}));

		L.DomUtil.setPosition(this.shadowEl, target.clone()._add({
			x: this.options.shadowOffset.x - L.larva.getWidth(this.shadowEl) / 2,
			y: this.options.shadowOffset.y - L.larva.getHeight(this.shadowEl) / 2
		}));
	},

	_onDblClick: function (evt) {
		this.fire('dblclick', {
			originalEvent: evt
		});
	},

	_onDragStart: function (evt) {
		this.fire('drag:start', {
			originalEvent: evt
		});
	}

});

/**
 * @param  {L.LatLng} latlng
 * @param  {Object} options
 * @return {L.larva.frame.Handle}
 */
L.larva.frame.handle = function (latlng, options) {
	return new L.larva.frame.Handle(latlng, options);
};