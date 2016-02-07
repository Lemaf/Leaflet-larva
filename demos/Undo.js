window.onload = function undoExample () {

	var edit = false,
	    layers = [];


	var map = L.map('map', {
		allowUndo: true,
		undoOptions: {
			limit: 100
		}
	});

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

	map.setView([-15.80064, -47.86164], 16);

	newPolyline = L.larva.handler.newPolyline(map);
	newPolygon = L.larva.handler.newPolygon(map);

	newPolyline.enable();

	map.on('ldraw:created', function (evt) {
		map.addLayer(evt.layer);
		layers.push(evt.layer);
	});

	L.DomEvent.on(L.DomUtil.get('toogle'), 'click', function () {
		newPolyline.disable();
		newPolygon.disable();

		edit = true;

		updateLayers();
	});

	L.DomEvent.on(L.DomUtil.get('polyline'), 'click', function () {
		newPolyline.enable();
		newPolygon.disable();

		edit = false;
		updateLayers();
	});

	L.DomEvent.on(L.DomUtil.get('polygon'), 'click', function () {
		newPolygon.enable();
		newPolyline.disable();

		edit = false;
		updateLayers();
	});

	function updateLayers () {
		layers.forEach(function (layer) {
			try {
				if (edit) {
					layer.larva.edit.enable();
				} else {
					layer.larva.edit.disable();
				}
			} catch (e) {
				console.error(e);
			}
		});
	}

	L.DomEvent.on(document, 'keydown', function (evt) {
		if (evt.ctrlKey) {
			if (evt.code === 'KeyZ') {
				map.undoRedo.undo();
			}
		}
	});
}