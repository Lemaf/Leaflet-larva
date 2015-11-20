var edit = false,
    layers = [],
    newPolyline;


function toogle() {
	edit = !edit;

	layers.forEach(function (layer) {
		if (edit) {
			layer.larva.edit.enable();
		} else {
			layer.larva.edit.disable();
		}
	});

	if (edit) {
		newPolyline.disable();
	} else {
		newPolyline.enable();
	}
}


window.onload = function moveHandler () {


	var map = L.map('map', {

	});

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

	map.setView([-15.80064, -47.86164], 16);

	newPolyline = L.larva.handler.newPolyline(map);

	newPolyline.enable();

	map.on('ldraw:created', function (evt) {
		map.addLayer(evt.layer);

		layers.push(evt.layer);

		if (edit) {
			evt.layer.larva.edit.enable();
		}
	});
}