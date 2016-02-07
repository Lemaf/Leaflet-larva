/**
 * @requires New.js
 * @requires ../ext/L.LatLngBounds.js
 * @requires ../Undoable.js
 * @requires ../l10n.js
 */

/**
 * @class Polyline creator
 * @extends L.larva.handler.New
 */
L.larva.handler.New.Polyline = L.larva.handler.New.extend(
/** @lends L.larva.handler.New.Polyline.prototype */
{

	includes: [L.larva.Undoable],

	options: {

		allowFireOnMap: true,

		maxDragCount: 5,

		minSqrDistance: 100,

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
		this._toAddLatLng = latlng.clone();
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
			.on('dragstart', this._onMapDragStart, this)
			.on('drag', this._onMapDrag, this);

		L.DomEvent
			.on(handle, 'mousedown', this._onHandleMousedown, this)
			.on(handle, 'mouseup', this._onHandleMouseup, this)
			.on(handle, 'dblclick', this._onHandleDblClick, this);

		delete this._lastDown;
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

	/**
	 * @return {L.Map}
	 */
	getMap: function () {
		return this._map;
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
				delete this._currentBounds;
			}
		}
	},

	removeHooks: function () {
		L.DomEvent
			.off(this._handle, 'mousedown', this._onHandleMousedown, this)
			.off(this._handle, 'mouseup', this._onHandleMouseup, this)
			.off(this._handle, 'dblclick', this._onHandleDblClick, this);

		this._map
			.off('mousemove', this._onMapMouseMove, this)
			.off('dragstart', this._onMapDragStart, this)
			.off('drag', this._onMapDrag, this);

		L.DomUtil.remove(this._handle);

		if (this._previewLayer) {
			this._map.removeLayer(this._previewLayer);
		}
	},

	_onHandleDblClick: function (evt) {
		L.DomEvent.stop(evt);
		this._next();
	},

	_onHandleMousedown: function (evt) {
		var eventPoint = this._map.mouseEventToLayerPoint(evt);
		
		if (this._lastDown) {
			var dx = eventPoint.x - this._lastDown.x,
			    dy = eventPoint.y - this._lastDown.y;

			if ( ((dx * dx) + (dy * dy)) <= this.options.minSqrDistance) {
				return;
			}
		} else {
			this._lastDown = {};
		}

		this._lastDown.x = eventPoint.x;
		this._lastDown.y = eventPoint.y;

		this._toAddLatLng = this._newLatLng.clone();
	},

	_onHandleMouseup: function () {
		if (this._dragCount && this._dragCount > this.options.maxDragCount) {
			delete this._dragCount;
		} else {
			this._pushLatLng();
		}
	},

	_onMapDrag: function () {
		this._dragCount++;
	},

	_onMapDragStart: function () {
		this._dragCount = 0;
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
			this._previewLayer.setBounds(this._previewBounds());
			this._previewLayer.redraw();
		}
	},

	_previewBounds: function () {
		return this._currentBounds.clone().extend(this._newLatLng);
	},

	_pushLatLng: function () {
		this._do(L.larva.l10n.newPolylinePushLatLng, this._doPushLatLng, this._undoPushLatLng, this._toAddLatLng);
	},

	_doPushLatLng: function (toAddLatLng) {
		if (this._currentBounds) {
			this._currentBounds.extend(toAddLatLng);
		} else {
			this._currentBounds = L.latLngBounds(toAddLatLng.clone(), toAddLatLng.clone());
		}

		this._latlngs.push(toAddLatLng.clone());

		if (this._latlngs.length === this.options.threshold) {
			this._map.removeLayer(this._lineLayer);
			this._newLayer = this.createLayer().addTo(this._map);
			this._previewLayer = this._newLayer;
		}

		if (!this._previewLayer._map) {
			this._map.addLayer(this._previewLayer);
		}

		this._previewLayer.setLatLngs(this._latlngs.concat(this._newLatLng));
		this._previewLayer.redraw();
	},

	_undoPushLatLng: function () {
		this._latlngs.pop();
		this._previewLayer.setLatLngs(this._latlngs.concat(this._newLatLng));
		this._previewLayer.redraw();
	}

});

L.larva.handler.newPolyline = function (map, options) {
	return new L.larva.handler.New.Polyline(map, options);
};