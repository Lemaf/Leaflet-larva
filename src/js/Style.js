L.larva.Style = L.Class.extend({

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

	subtract: function (styles) {
		return this._transform(styles, function (cV, d) {
			return cV - d;
		});
	},

	multiple: function(styles) {
		return this._transform(styles, function (cV, d) {
			return cV * d;
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

L.larva.Style.getRGB = function (color) {

	if (!color) {
		return;
	}

	var r,g,b;

	if (color.length === 4) {
		r = parseInt(color[1], 16);
		g = parseInt(color[2], 16);
		b = parseInt(color[3], 16);
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