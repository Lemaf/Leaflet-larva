/**
 * @class
 *
 * Style class with helper methods
 *
 * Example:
 * 
 * ```js
 *
 * 	var polygon = L.polygon(latlngs, {
 * 		fillOpacity: 0.5,
 * 		fillColor: '#ABABAB'
 * 	});
 * 
 * 	var style = L.larva.style(polygon);
 *
 * 	style.multiply({
 * 		fillColor: [1, 0.5, 2],
  * 	}).subtract({
  * 		fillOpacity: 0.2
  * 	});
 *
 * 	polygon.setStyle(style);
 * 
 * ```
 * @param {(L.Path | L.larva.Style | Object)} source
 *
 */
L.larva.Style = L.Class.extend(
/** @lends L.larva.Style.prototype */
{

	statics: {

		STYLES: ['fillOpacity', 'fillColor', 'color', 'opacity'],

		TYPE: {
			fillOpacity: 'number',
			opacity: 'number',
			fillColor: 'color',
			color: 'color'
		}
	},

	initialize: function (source) {
		if (source instanceof L.Path) {
			source = source.options;
		}

		L.larva.Style.STYLES.forEach(function (styleName) {
			this[styleName] = source[styleName];
		}, this);
	},

	/**
	 * @return {Object} style
	 */
	getStyle: function () {
		var style = {};
		for (var styleName in this) {
			if (this.hasOwnProperty(styleName)) {
				style[styleName] = this[styleName];
			}
		}

		return style;
	},

	/**
	 * @param  {Object} style
	 * @return {L.larva.Style} this
	 */
	multiply: function(styles) {
		return this._transform(styles, function (cV, d) {
			return cV * d;
		});
	},

	/**
	 * @param  {Object} styles
	 * @return {L.larva.Style} this
	 */
	plus: function (styles) {
		return this._transform(styles, function (cV, d) {
			return cV + d;
		});
	},

	_transform: function (styles, transfom) {
		var styleName, currentValue, delta;

		for (styleName in styles) {
			if (styleName in this) {

				currentValue = this[styleName];
				delta = styles[styleName];

				switch (L.larva.Style.TYPE[styleName]) {
					case 'color':
						var rgb = L.larva.Style.getRGB(currentValue);
						if (rgb) {
							rgb[0] = transfom(rgb[0], delta[0]);
							rgb[1] = transfom(rgb[1], delta[1]);
							rgb[2] = transfom(rgb[2], delta[2]);

							rgb = rgb.map(L.larva.Style.convertColorComponent);

							currentValue = '#' + rgb.join('');
						}
						break;
					case 'number':
						currentValue = transfom(currentValue, delta);
						break;
				}

				this[styleName] = currentValue;
			}
		}

		return this;
	}
});

/**
 * @memberOf L.larva.Style
 * @param  {String} color
 * @return {Array} [r, g, b]
 */
L.larva.Style.getRGB = function (color) {

	if (!color) {
		return;
	}

	var r,g,b;

	if (color.length === 4) {
		r = parseInt(color[1], 16) * 16;
		g = parseInt(color[2], 16) * 16;
		b = parseInt(color[3], 16) * 16;
	} else if (color.length === 7) {
		r = parseInt(color.substr(1, 2), 16);
		g = parseInt(color.substr(3, 2), 16);
		b = parseInt(color.substr(5, 2), 16);
	} else {
		return;
	}

	return [r,g,b];
};

L.larva.Style.convertColorComponent = function (component) {
	if (component < 0) {
		component = 0;
	} else if (component > 255) {
		component = 255;
	}

	component = parseInt(component).toString(16);

	return component.length === 2 ? component : '0' + component;
};

L.larva.style = function (source) {
	return new L.larva.Style(source);
};

L.larva.style = function (source, deltas) {
	var style = new L.larva.Style(source);

	if (deltas) {
		for (var method in deltas) {
			if (style[method] instanceof Function) {
				style[method].call(style, deltas[method]);
			}
		}
	}

	return style;
};