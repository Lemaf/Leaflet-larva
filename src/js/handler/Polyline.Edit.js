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
		minSqrEditVertexDistance: 10
	},

	addHooks: function () {
		this._frame = L.larva.frame.vertices(this._path, {
			minSqrEditVertexDistance: this.options.minSqrEditVertexDistance
		}).addTo(this.getMap());

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

				var args = [
					newLatLng,
					found.latlngs,
					found.index,
					this._frame.getHandleId(newLatLng)
				];

				this._do(L.larva.l10n.editPolylineAddVertex, this._editAddVertex, args, this._unEditAddVertex, args, true);
			}
		}
	},

	_edit: function (handleId, deltas) {
		var latlng = this._frame.getLatLng(handleId);
		latlng.lat += deltas.lat;
		latlng.lng += deltas.lng;

		this._path.updateBounds();
		this._path.redraw();
		this._frame.updateHandle(handleId);
	},

	_editAddVertex: function (latlng, latlngs, index) {
		latlngs.splice(index, 0, latlng);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_editDelItem: function (item, array, index) {
		array.splice(index, 1);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_editDelItems: function (items, array, index) {
		array.splice(index, items.length);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_onDblclick: function (evt) {
		L.DomEvent.stop(evt);
		this._addVertex(this.getMap().mouseEventToLayerPoint(evt.originalEvent));
	},

	_onGhostEnd: function (evt) {
		if (evt.id === this._handleId) {
			this._frame.off('ghost:end', this._onGhostEnd, this);
			var latlng = this._frame.getLatLng(evt.id);

			var args = [
				evt.id,
				{lat: evt.latlng.lat - latlng.lat, lng: evt.latlng.lng - latlng.lng}
			];

			this._do(L.larva.l10n.editPolyline, this._edit, args, this._unEdit, args);
		}
	},

	_onHandleDbclick: function (evt) {
		var originalEvent = evt.originalEvent;

		if (originalEvent.shiftKey) {
			this._removeLatLng(evt.id);
		}
	},

	_onHandleEnd: function () {
		this._frame
			.off('handle:move', this._onHandleMove, this)
			.off('handle:end', this._onHandleEnd, this);

		var deltas = this._deltas;
		deltas.lat = deltas.newLatLng.lat - deltas.oriLatLng.lat;
		deltas.lng = deltas.newLatLng.lng - deltas.oriLatLng.lng;

		var args = [
			this._handleId,
			deltas
		];

		delete deltas.newLatLng;
		delete deltas.oriLatLng;

		this._do(L.larva.l10n.editPolyline, this._edit, args, this._unEdit, args, true);
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

		this._deltas.newLatLng = newLatLng;

		this._path.updateBounds();
		this._path.redraw();
		this._frame.updateHandle(this._handleId);
	},

	_onHandleStart: function (evt) {
		var sourceEvent;

		this._handleId = evt.id;

		if (this.options.ghost) {
			this._frame.startGhost(evt.id);
			this._frame.on('ghost:end', this._onGhostEnd, this);
		} else {
			sourceEvent = L.larva.getSourceEvent(evt);
			this._origin = {
				x: sourceEvent.clientX, y: sourceEvent.clientY
			};

			this._deltas = {
				oriLatLng: this._frame.getLatLng(evt.id).clone()
			};

			this._originalPoint = this._frame.getPoint(evt.id).clone();
			this._frame
				.on('handle:move', this._onHandleMove, this)
				.on('handle:end', this._onHandleEnd, this);
		}
	},

	_removeLatLng: function (handleId) {
		var latlng = this._frame.getLatLng(handleId),
		    latlngs = this._path.getLatLngs(),
		    index, p;

		switch (this._path.getType()) {
			case L.Polyline.MULTIPOLYLINE:

				for (p=0; p < latlngs[p].length; p++) {
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

	_unEdit: function (handleId, deltas) {
		var latlng = this._frame.getLatLng(handleId);
		latlng.lat -= deltas.lat;
		latlng.lng -= deltas.lng;

		this._path.updateBounds();
		this._path.redraw();

		this._frame.updateHandle(handleId);
	},

	_unEditAddVertex: function () {
		var latlngs = arguments[1],
		    index = arguments[2];

		latlngs.splice(index, 1);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_unEditDelItem: function (item, array, index) {
		array.splice(index, 0, item);
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	},

	_unEditDelItems: function (items, array, index) {
		array.splice.apply(array, [index, 0].concat(items));
		this._path.updateBounds();
		this._path.redraw();
		this._frame.redraw();
	}
});

/**
 * @memberOf L.larva.handler.Polyline.Edit
 * @static
 * @param  {L.Point} point
 * @param  {Number} maxNewVertexDistance
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