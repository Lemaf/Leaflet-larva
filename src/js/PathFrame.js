L.larva.PathFrame = L.Layer.extend({

	options: {
		pane: 'llarva'
	},

	initialize: function (path) {
		this._path = path;
	},

	beforeAdd: function (map) {
		if (!map.getPane(this.options.pane)) {
			map.createPane(this.options.pane);
		}
	},

	getEvents: function () {
		return {
			zoom: this._onZoom
		};
	},

	getDraggable: function () {
		return this._draggable;
	},

	getPosition: function() {
		return L.DomUtil.getPosition(this._el);
	},

	onAdd: function () {
		var el = this._el = L.DomUtil.create('div', 'llarva-pathframe', this.getPane());
		L.DomEvent.on(el, 'mousedown', L.DomEvent.stop);

		this._draggable = new L.Draggable(el);

		this._onZoom();
	},

	_onZoom: function () {
		var bounds = this._path.getBounds();

		var southEastPoint = this._map.latLngToLayerPoint(bounds.getSouthEast()),
		northWestPoint = this._map.latLngToLayerPoint(bounds.getNorthWest());

		L.DomUtil.setPosition(this._el, northWestPoint);

		this._el.style.width = (southEastPoint.x - northWestPoint.x) + 'px';
		this._el.style.height = (southEastPoint.y - northWestPoint.y) + 'px';

		this.southEastPoint = southEastPoint;
		this.northWestPoint = northWestPoint;
	}

});