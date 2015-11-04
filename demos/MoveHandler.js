window.onload = function moveHandler () {
	var map = L.map('map', {

	});

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

	map.setView([-15.80064, -47.86164], 16);

	L.polyline([
		[-15.79975, -47.86732],
		[-15.79790, -47.86672],
		[-15.79947, -47.86196],
		[-15.80129, -47.86256]
	]).addTo(map).larva.move.enable();


}