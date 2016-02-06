/**
 * @requires New.js
 */

/**
 * @class Polyline creator
 * @extends L.larva.handler.New
 */
L.larva.handler.New.Polyline = L.larva.handler.New.extend(
/** @lends L.larva.handler.New.Polyline.prototype */
{

	options: {

		allowFireOnMap: true,

		handleStyle: {
			border: '1px solid #0f0',
			cursor: 'crosshair',
			height: '20px',
			position: 'absolute',
			width: '20px'
		},

		layerOptions: {

		},

		// Snap here?
		onMove: L.larva.NOP,

		threshold: 1
	},

	/**
	 * Invoke after enable
	 * @param {L.LatLng} latlng
	 */
	addLatLng: function (latlng) {
		this._newLatLng = latlng.clone();
		this._pushLatLng();
	},

	addHooks: function() {

		this._latlngs = [];

		this._pane = this._map.getPane('popupPane');

		var handle = this._handle = L.DomUtil.create('div', 'llarva-new-vertex-handle', this._pane);
		L.extend(handle.style, this.options.handleStyle);

		this._halfHandleSize = new L.Point(
			handle.offsetWidth / 2,
			handle.offsetHeight / 2
		);

		this._newLatLng = new L.LatLng(0, 0);
		this._previewLayer = this._lineLayer = L.polyline([], L.extend({}, this.options, {
			noClip: true
		}));

		this._map
			.on('mousemove', this._onMapMouseMove, this)
			.on('dragstart', this._onMapDragStart, this);

		L.DomEvent
			.on(handle, 'click', this._onHandleClick, this)
			.on(handle, 'dblclick', this._onHandleDblClick, this);
	},
	/**
	 * Create an empty Polyline layer
	 * @return {L.Polyline}
	 */
	createLayer: function () {
		return L.polyline([], L.extend({}, this.options.layerOptions, {
			noClip: true
		}));
	},

	_next: function () {
		if (this._latlngs.length >= this.options.threshold) {
			try {

				this._map.removeLayer(this._previewLayer);
				this._previewLayer.setLatLngs(this._latlngs);

				this.fire('ldraw:created', {
					layer: this._previewLayer
				});

				if (this.options.allowFireOnMap) {
					this.fireOnMap('ldraw:created', {
						handler: this,
						layer: this._previewLayer
					});
				}

			} finally {
				this._lineLayer.setLatLngs([]);
				this._latlngs = [];
				this._previewLayer = this._lineLayer;
				delete this._newLayer;
			}
		}
	},

	removeHooks: function () {
		L.DomEvent
			.off(this._handle, 'click', this._onHandleClick, this)
			.off(this._handle, 'dblclick', this._onHandleDblClick, this);

		this._map
			.off('mousemove', this._onMapMouseMove, this);

		L.DomUtil.remove(this._handle);

		if (this._previewLayer) {
			this._map.removeLayer(this._previewLayer);
		}
	},

	_onHandleClick: function (evt) {
		L.DomEvent.stop(evt);
		console.log('click');

		if (this._dragging) {
			console.log('click dragging...');
			delete this._dragging;
			return;
		}

		if (this._lastClick) {
			evt = L.larva.getSourceEvent(evt);
			var dx = evt.clientX - this._lastClick.x,
			    dy = evt.clientY - this._lastClick.y;

			if ((dx * dx + dy * dy) < 100) {
				console.log('failed');
				return;
			}
		} else {
			this._lastClick = {};
		}

		this._lastClick.x = evt.clientX;
		this._lastClick.y = evt.clientY;

		this._pushLatLng();
	},

	_onHandleDblClick: function (evt) {
		L.DomEvent.stop(evt);
		console.log('dblclick');
		this._next();
	},

	_onMapMouseMove: function (evt) {
		var latlng = evt.latlng;

		if (this.options.onMove) {
			this.options.onMove(latlng);
		}

		this._newLatLng.lat = latlng.lat;
		this._newLatLng.lng = latlng.lng;

		var point = this._map.latLngToLayerPoint(latlng);

		L.DomUtil.setPosition(this._handle, point.subtract(this._halfHandleSize));

		if (this._latlngs.length) {
			this._previewLayer.updateBounds();
			this._previewLayer.redraw();
		}
	},

	_onMapDragStart: function () {
		console.log('dragging...');
		this._dragging = true;
	},

	_pushLatLng: function () {

		this._latlngs.push(this._newLatLng.clone());

		if (this._latlngs.length === this.options.threshold) {
			this._map.removeLayer(this._lineLayer);
			this._newLayer = this.createLayer().addTo(this._map);
			this._previewLayer = this._newLayer;
		}

		if (!this._previewLayer._map) {
			this._map.addLayer(this._previewLayer);
		}

		this._previewLayer.setLatLngs(this._latlngs.concat(this._newLatLng));
		this._previewLayer.getBounds().extend(this._newLatLng);
		this._previewLayer.redraw();
	}

});

L.larva.handler.newPolyline = function (map, options) {
	return new L.larva.handler.New.Polyline(map, options);
};