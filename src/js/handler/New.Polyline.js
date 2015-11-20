/**
 * @requires New.js
 */
L.larva.handler.New.Polyline = L.larva.handler.New.extend({

	options: {
		handleOptions: {
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

		threshold: 2
	},

	addHooks: function() {

		this._newLayer = this.createLayer().addTo(this._map);
		this._previewLayer = this._lineLayer = L.polyline(this.options.layerOptions);

		this._pane = this._map.getPane('popupPane');

		var handle = this._handle = L.DomUtil.create('div', 'llarva-new-vertex-handle', this._pane);
		L.extend(handle.style, this.options.handleOptions);

		this._newLatLng = new L.LatLng(0, 0);
		this._latlngs = [this._newLatLng];

		this._map
			.on('mousemove', this._onMapMouseMove, this);

		L.DomEvent
			.on(handle, 'click', this._onClick, this)
			.on(handle, 'dblclick', this._onDblClick, this);
	},

	createLayer: function () {
		return L.polyline(this.options.layerOptions);
	},

	next: function () {

		this._latlngs.pop();

		if (this._latlngs.length >= this.options.threshold) {
			try {

				this._map.removeLayer(this._previewLayer);

				this._previewLayer.setLatLngs(this._latlngs);

				this.fire('ldraw:created', {
					layer: this._previewLayer
				});

				this.fireOnMap('ldraw:created', {
					handler: this,
					layer: this._previewLayer
				});

			} finally {
				this._newLayer = this.createLayer().addTo(this._map);
				this._lineLayer.setLatLngs([]);
				this._latlngs = [this._newLatLng];
				this._previewLayer = this._lineLayer;
			}
		}
	},

	removeHooks: function () {
		L.DomEvent
			.off(this._handle, 'click', this._onClick, this)
			.off(this._handle, 'dblclick', this._onDblClick, this);

		this._map
			.off('mousemove', this._onMapMouseMove, this);

		L.DomUtil.remove(this._handle);
	},

	_addVertex: function () {


		this._latlngs[this._latlngs.length - 1] = this._newLatLng.clone();
		this._latlngs.push(this._newLatLng);

		if (this._latlngs.length === this.options.threshold) {
			this._map.removeLayer(this._lineLayer);
			this._previewLayer = this._newLayer;
			this._map.addLayer(this._previewLayer);
		}

		this._previewLayer.setLatLngs(this._latlngs);
		this._previewLayer.redraw();
	},

	_getEventLayerPoint: function (evt) {
		var bounding = this._pane.getBoundingClientRect();
		evt = L.larva.getSourceEvent(evt);

		return new L.Point(
			evt.clientX - bounding.left,
			evt.clientY - bounding.top
		);
	},

	_onClick: function (evt) {
		L.DomEvent.stop(evt);
		this._addVertex();
	},

	_onDblClick: function (evt) {
		L.DomEvent.stop(evt);
		this.next();
	},

	_onMapMouseMove: function (evt) {
		var latlng = evt.latlng;

		if (this.options.onMove) {
			this.options.onMove(latlng);
		}

		this._newLatLng.lat = latlng.lat;
		this._newLatLng.lng = latlng.lng;

		var point = this._map.latLngToLayerPoint(latlng);

		L.DomUtil.setPosition(this._handle, point.subtract(new L.Point(
			this._handle.offsetWidth / 2,
			this._handle.offsetHeight / 2
		)));

		if (this._latlngs.length) {
			this._previewLayer.redraw();
		}
	}

});

L.larva.handler.newPolyline = function (map, options) {
	return new L.larva.handler.New.Polyline(map, options);
};