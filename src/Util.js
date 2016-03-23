/**
 * @namespace
 */
L.larva.Util = {

	/**
	 * @see {@link https://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#The%20C%20Code Reference}
	 *
	 * @param {L.Point} point
	 * @param {L.Point[]} points
	 *
	 * @returns {Boolean} Point inside points?
	 */
	pointIsInside: function (point, points) {
		var i, j, isInside = false;

		for (i=0, j = points.length - 1; i < points.length; j = i++) {
			if ( ((points[i].y > point.y) !== (points[j].y > point.y)) &&
				 (point.x < (points[j].x - points[i].x) * (point.y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
				isInside = !isInside;
			}
		}

		return isInside;
	}

};