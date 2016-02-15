if (!L.LatLngBounds.prototype.clone) {

	L.LatLngBounds.prototype.clone = function () {
		return L.latLngBounds(this.getSouthWest().clone(), this.getNorthEast().clone());
	};

}