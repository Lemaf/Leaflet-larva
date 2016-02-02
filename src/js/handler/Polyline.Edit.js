/**
 * @requires Polyline.js
 * @requires ../frame/Vertices.js
 */

/**
 * @class Hand point by point of a layer
 *
 * @extends {L.larva.handler.Polyline}
 */
L.larva.handler.Polyline.Edit = L.larva.handler.Polyline.extend(
/** @lends L.larva.handler.Polyline.prototype */
{

	options: {
		aura: true,
		maxDist: 10
	},

	addHooks: function () {
		this._frame = L.larva.frame.vertices(this._path).addTo(this.getMap());
		this._frame.on('drag:start', this._onDragStart, this);
		this._path.on('dblclick', this._onPathDblClick, this);
	},

	removeHooks: function () {
		this.getMap().removeLayer(this._frame);
		this._frame
			.off('drag:start', this._onDragStart, this)
			.off('dblclick', this._onPathDblClick, this);
	},

	_searchNearestPoint: function (point) {
		var found = [], map = this.getMap();

		this._path.forEachLine(function (latlngs) {
			found = found.concat(L.larva.handler.Polyline.Edit.searchNearestPointIn(point, this.options.maxDist, latlngs, map));
		}, this);

		return found;
	},

	_addVertex: function (point) {
		var founds, found, newLatLng;

		founds = this._searchNearestPoint(point);

		if (founds.length) {
			if (founds.length === 1) {
				found = founds[0];
				newLatLng = this.getMap().layerPointToLatLng(found.point);

				found.latlngs.splice(found.index, 0, newLatLng);

				this._path.updateBounds();
				this._path.redraw();
				this._frame.redraw();
			}
		}
	},

	_onAuraEnd: function (evt) {
		var latlng = this._frame.getLatLng(evt.id);

		latlng.lat = evt.latlng.lat;
		latlng.lng = evt.latlng.lng;

		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_onPathDblClick: function (evt) {
		L.DomEvent.stop(evt);
		this._addVertex(this.getMap().mouseEventToLayerPoint(evt.originalEvent));
	},

	_onDragEnd: function () {
		this._frame
			.off('drag:move', this._onDragMove, this)
			.off('drag:end', this._onDragEnd, this);

		if (this._aura) {
			var newLatLng = this._frame.stopAura(this._handleId, true);
			var currentLatLng = this._frame.getLatLng(this._handleId);

			currentLatLng.lat = newLatLng.lat;
			currentLatLng.lng = newLatLng.lng;

			this._path.updateBounds();
			this._path.redraw();
		}
	},

	_onDragMove: function (evt) {
		var sourceEvent = L.larva.getSourceEvent(evt);

		var dx = sourceEvent.clientX - this._startPos.x,
		    dy = sourceEvent.clientY - this._startPos.y;

		var newPoint = this._original.add(L.point(dx, dy));

		var latlng = this._frame.getLatLng(this._handleId),
			 newLatLng = this.getMap().layerPointToLatLng(newPoint);

		latlng.lat = newLatLng.lat;
		latlng.lng = newLatLng.lng;

		this._path.updateBounds();
		this._frame.updateHandle(this._handleId);
		this._path.redraw();
	},

	_onDragStart: function (evt) {
		var sourceEvent = L.larva.getSourceEvent(evt);

		this._original = this._frame.getPosition(evt.id).clone();
		this._handleId = evt.id;

		this._startPos = {
			x: sourceEvent.clientX, y: sourceEvent.clientY
		};

		if (this.options.aura) {
			this._aura = this._frame.startAura(evt.id);
			this._frame.on('aura:end', this._onAuraEnd, this);
		} else {
			delete this._aura;
			this._frame
				.on('drag:move', this._onDragMove, this)
				.on('drag:end', this._onDragEnd, this);
		}
	}

});

/**
 * @memberOf L.larva.handler.Polyline.Edit
 * @param  {L.Point} point
 * @param  {Number} maxDist
 * @param  {LatLng[]} latlngs
 * @param  {L.Map} map
 * @param  {Boolean} closed
 * @return {Object[]}
 */
L.larva.handler.Polyline.Edit.searchNearestPointIn = function (point, maxDist, latlngs, map, closed) {
	var found = [],
	    aPoint, bPoint,
	    i, index, l, dist;

	if (closed) {
		l = latlngs.length;
	} else {
		l = latlngs.length - 1;
	}

	for (i = 0; i < l; i++) {

		index = (i + 1) % latlngs.length;

		aPoint = map.latLngToLayerPoint(latlngs[i]);
		bPoint = map.latLngToLayerPoint(latlngs[index]);

		dist = L.LineUtil.pointToSegmentDistance(point, aPoint, bPoint);

		if (dist <= maxDist) {
			found.push({
				point: L.LineUtil.closestPointOnSegment(point, aPoint, bPoint),
				index: index,
				latlngs: latlngs
			});
		}
	}

	return found;

};