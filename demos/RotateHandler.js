window.onload = function moveHandler () {
	var map = L.map('map', {

	});

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

	map.setView([-15.80064, -47.86164], 16);

	L.polyline([
		[-15.79975, -47.86732],
		[-15.80129, -47.86256]
	]).addTo(map).larva.rotate.enable();

	L.polyline([
		[-15.79682119727878664, -47.87021988827178376],
		[-15.7998130660628, -47.86545977748311742]
	]).addTo(map).larva.rotate.enable();


	L.polygon([
		[-15.79884980396577809, -47.87044529741776699],
		[-15.799073077045243, -47.86972266221447114],
		[-15.80009375084477341, -47.87090937507125687],
		[-15.79884980396577809, -47.87044529741776699]
	]).addTo(map).larva.rotate.enable();
}