/**
 * @requires Polyline.js
 * @requires ../frame/Vertices.js
 * @requires ../Undoable.js
 */

/**
 * @class Hand point by point of a layer
 *
 * @extends {L.larva.handler.Polyline}
 */
L.larva.handler.Polyline.Edit = L.larva.handler.Polyline.extend(
/** @lends L.larva.handler.Polyline.Edit.prototype */
{

	includes: [L.larva.Undoable],

	options: {
		ghost: true,
		maxNewVertexDistance: 10,
		// L.frame.Vertices options
		frame: {
			minSqrEditVertexDistance: 10
		}
	},

	addHooks: function () {
		this._frame = L.larva.frame.vertices(this._path, this.options.frame).addTo(this.getMap());

		this._frame
			.on('handle:dragstart', this._onHandleDragStart, this)
			.on('handle:dblclick', this._onHandleDbclick, this);

		this._path.on('dblclick', this._onPathDblclick, this);
	},

	removeHooks: function () {
		this.getMap().removeLayer(this._frame);
		this._frame
			.off('handle:dragstart', this._onHandleDragStart, this)
			.off('handle:dblclick', this._onHandleDbclick, this);

		this._path
			.off('dblclick', this._onPathDblclick, this);
	},

	_addVertex: function (point) {
		var founds, found, newLatLng;

		founds = this._searchNearestPoint(point);

		if (founds.length === 1) {
			found = founds[0];
			newLatLng = this.getMap().layerPointToLatLng(found.point);

			var args = [
				newLatLng,
				found.latlngs,
				found.index
			];

			this._editAddVertex.apply(this, args);

			this._do(L.larva.l10n.editPolylineAddVertex, this._editAddVertex, args, this._unEditAddVertex, args, true);
		}
	},

	_edit: function (handle, deltas) {
		var latlng = handle.getLatLng();
		latlng.lat += deltas.lat;
		latlng.lng += deltas.lng;
		handle.update(this.getMap());
		this._path.redraw();
	},

	_editAddVertex: function (latlng, latlngs, index) {
		latlngs.splice(index, 0, latlng);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	},

	_editDelItem: function (item, array, index) {
		array.splice(index, 1);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	},

	_editDelItems: function (items, array, index) {
		array.splice(index, items.length);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	},

	_onPathDblclick: function (evt) {
		L.DomEvent.stop(evt);
		this._addVertex(this.getMap().mouseEventToLayerPoint(evt.originalEvent));
	},

	_onGhostEnd: function (evt) {
		this._frame.off('ghost:end', this._onGhostEnd, this);
		var latlng = evt.handle.getLatLng();
		var args = [
			evt.handle,
			{lat: evt.latlng.lat - latlng.lat, lng: evt.latlng.lng - latlng.lng}
		];

		this._do(L.larva.l10n.editPolyline, this._edit, args, this._unEdit, args);
	},

	_onHandleDbclick: function (evt) {
		var originalEvent = evt.originalEvent;

		if (originalEvent.shiftKey) {
			this._removeLatLng(evt.handle);
		}
	},

	_onHandleDragEnd: function () {
		this._frame
			.off('handle:move', this._onHandleDrag, this)
			.off('handle:dragend', this._onHandleDragEnd, this);

		var deltas = {
			lat: this._handle.getLatLng().lat - this._deltas.latLngOrigin.lat,
			lng: this._handle.getLatLng().lng - this._deltas.latLngOrigin.lng
		};

		var args = [
			this._handle,
			deltas
		];

		this._do(L.larva.l10n.editPolyline, this._edit, args, this._unEdit, args, true);
	},

	_onHandleDrag: function (evt) {
		var originalEvent = L.larva.getOriginalEvent(evt);

		var dx = originalEvent.clientX - this._origin.x,
		    dy = originalEvent.clientY - this._origin.y;

		var newPoint = this._deltas.pointOrigin.add(L.point(dx, dy));
		var newLatLng = this.getMap().layerPointToLatLng(newPoint);

		this._handle.getLatLng().lat = newLatLng.lat;
		this._handle.getLatLng().lng = newLatLng.lng;

		this._path.updateBounds();
		this._path.redraw();
		this._handle.update(this.getMap());
	},

	_onHandleDragStart: function (evt) {
		var originalEvent;

		if (this.options.ghost) {
			this._frame.startGhost(evt.handle);
			this._frame.on('ghost:end', this._onGhostEnd, this);
		} else {
			originalEvent = L.larva.getOriginalEvent(evt);
			this._origin = {
				x: originalEvent.clientX, y: originalEvent.clientY
			};

			this._handle = evt.handle;
			this._deltas = {
				latLngOrigin: evt.handle.getLatLng().clone(),
				pointOrigin: evt.handle.getPoint().clone()
			};

			this._frame
				.on('handle:drag', this._onHandleDrag, this)
				.on('handle:dragend', this._onHandleDragEnd, this);
		}
	},

	_removeLatLng: function (handle) {
		var latlng = handle.getLatLng(),
		    latlngs = this._path.getLatLngs(),
		    index, p;

		switch (this._path.getType()) {
			case L.Polyline.MULTIPOLYLINE:

				for (p=0; p < latlngs.length; p++) {
					if ((index = latlngs[p].indexOf(latlng)) !== -1) {

						if (latlngs[p].length <= 2) {
							this._removeItem(latlng[p], latlngs, p);
						} else {
							this._removeItem(latlng, latlngs[p], index);
							// latlngs[p].splice(index, 1);
						}

						break;
					}
				}

				break;

			default:
				if ((index = latlngs.indexOf(latlng)) !== -1) {
					// latlngs.splice(index, 1);
					this._removeItem(latlng, latlngs, index);
					break;
				}
		}
	},

	/**
	 * @protected
	 * @param  {*} item
	 * @param  {Array.<*>} array
	 * @param  {Number} index
	 */
	_removeItem: function (item, array, index) {
		this._editDelItem(item, array, index);
		var args = [item, array, index];
		this._do(L.larva.l10n.editPolylineDelVertex, this._editDelItem, args, this._unEditDelItem, args, true);
	},

	_removeItems: function (items, array, index) {
		this._editDelItems(items, array, index);
		var args = [items, array, index];
		this._do(L.larva.l10n.editPolylineDelVertex, this._editDelItems, args, this._unEditDelItems, args, true);
	},

	_searchNearestPoint: function (point) {
		var found = [], map = this.getMap();

		this._path.forEachLine(function (latlngs) {
			found = found.concat(L.larva.handler.Polyline.Edit.searchNearestPointIn(point, this.options.maxNewVertexDistance, latlngs, map));
		}, this);

		return found;
	},

	_unEdit: function (handle, deltas) {
		var latlng = handle.getLatLng();
		latlng.lat -= deltas.lat;
		latlng.lng -= deltas.lng;
		handle.update(this.getMap());
		this._path.redraw();
	},

	_unEditAddVertex: function () {
		var latlngs = arguments[1],
		    index = arguments[2];

		latlngs.splice(index, 1);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	},

	_unEditDelItem: function (item, array, index) {
		array.splice(index, 0, item);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	},

	_unEditDelItems: function (items, array, index) {
		array.splice.apply(array, [index, 0].concat(items));
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw(true);
	}
});

/**
 * @memberOf L.larva.handler.Polyline.Edit
 * @static
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
	    i, l, dist;

	l = (closed) ? latlngs.length : latlngs.length - 1;

	if (latlngs.length) {
		aPoint = map.latLngToLayerPoint(latlngs[0]);

		for (i = 0; i < l; i++) {

			bPoint = map.latLngToLayerPoint(latlngs[(i + 1) % latlngs.length]);

			dist = L.LineUtil.pointToSegmentDistance(point, aPoint, bPoint);

			if (dist <= maxDist) {
				found.push({
					point: L.LineUtil.closestPointOnSegment(point, aPoint, bPoint),
					index: i + 1,
					latlngs: latlngs
				});
			}

			aPoint = bPoint;
		}
	}

	return found;

};