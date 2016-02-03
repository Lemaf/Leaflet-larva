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

		this._frame
			.on('handle:start', this._onHandleStart, this)
			.on('handle:dblclick', this._onHandleDbclick, this);

		this._path.on('dblclick', this._onDblclick, this);
	},

	removeHooks: function () {
		this.getMap().removeLayer(this._frame);
		this._frame
			.off('handle:start', this._onHandleStart, this)
			.off('dblclick', this._onDblclick, this);
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
		this._frame.off('aura:end', this._onAuraEnd, this);
		var latlng = this._frame.getLatLng(evt.id);

		latlng.lat = evt.latlng.lat;
		latlng.lng = evt.latlng.lng;

		this._path.updateBounds();
		this._path.redraw();
		this._frame.updateHandle(evt.id);
	},

	_onHandleDbclick: function (evt) {
		var originalEvent = evt.originalEvent;

		if (originalEvent.shiftKey) {
			var latlngs = this._frame.getLatLngs(evt.id),
			latlng = this._frame.getLatLng(evt.id);

			var index = latlngs.indexOf(latlng);
			latlngs.splice(index, 1);

			this._path.updateBounds();
			this._path.redraw();

			this._frame.removeHandle(evt.id);
		}
	},

	_onDblclick: function (evt) {
		L.DomEvent.stop(evt);
		this._addVertex(this.getMap().mouseEventToLayerPoint(evt.originalEvent));
	},

	_onHandleEnd: function () {
		this._frame
			.off('handle:move', this._onHandleMove, this)
			.off('handle:end', this._onHandleEnd, this);
	},

	_onHandleMove: function (evt) {
		var sourceEvent = L.larva.getSourceEvent(evt);

		var dx = sourceEvent.clientX - this._origin.x,
		    dy = sourceEvent.clientY - this._origin.y;

		var newPoint = this._originalPoint.add(L.point(dx, dy));

		var latlng = this._frame.getLatLng(this._handleId),
			 newLatLng = this.getMap().layerPointToLatLng(newPoint);

		latlng.lat = newLatLng.lat;
		latlng.lng = newLatLng.lng;

		this._path.updateBounds();
		this._path.redraw();
		this._frame.updateHandle(this._handleId);
	},

	_onHandleStart: function (evt) {
		var sourceEvent;

		this._handleId = evt.id;

		if (this.options.aura) {
			this._aura = this._frame.startAura(evt.id);
			this._frame.on('aura:end', this._onAuraEnd, this);
		} else {
			delete this._aura;
			sourceEvent = L.larva.getSourceEvent(evt);
			this._origin = {
				x: sourceEvent.clientX, y: sourceEvent.clientY
			};
			this._originalPoint = this._frame.getPoint(evt.id).clone();
			this._frame
				.on('handle:move', this._onHandleMove, this)
				.on('handle:end', this._onHandleEnd, this);
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