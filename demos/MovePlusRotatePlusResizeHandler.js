window.onload = function moveHandler () {

	var map = L.map('map', {
		allowUndo: true,
		undoOptions: {
			limit: 500
		}
	});

	L.DomEvent.on(document, 'keydown', function (evt) {
		if (evt.ctrlKey) {
			switch (evt.code) {
				case 'KeyZ':

					if (!evt.shiftKey) {
						map.larva.undo();
					} else {
						map.larva.redo();
					}
					break;
			}
		}
	});

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

	map.setView([-15.80064, -47.86164], 16);

	var poly1 = L.polyline([
		[-15.79975, -47.86732],
		[-15.79790, -47.86672],
		[-15.79947, -47.86196],
		[-15.80129, -47.86256]
	]).addTo(map);

	var poly2 = L.polyline([
		[-15.79682119727878664, -47.87021988827178376],
		[-15.7972230926705457, -47.87016685082567591],
		[-15.79837774007298101, -47.87128063719405446],
		[-15.79857549670255423, -47.87069059560603534],
		[-15.79817998325028405, -47.87000110880656933],
		[-15.79883066626179478, -47.86988840423357061],
		[-15.79891997553156102, -47.86962984668377885],
		[-15.79753567742384313, -47.86801220457732597],
		[-15.79764412508267313, -47.86764094245452839],
		[-15.79856273821615353, -47.86776690638904341],
		[-15.79921979922055719, -47.86798568585425784],
		[-15.79945583032298906, -47.86798568585425784],
		[-15.79967910273423115, -47.86720338352409243],
		[-15.79928997065812446, -47.86707078990880859],
		[-15.7998130660628, -47.86545977748311742]
	]).addTo(map);


	var poly3 = L.polygon([
		[-15.79884980396577809, -47.87044529741776699],
		[-15.799073077045243, -47.86972266221447114],
		[-15.79927721221674908, -47.86970277317217892],
		[-15.80032340174062178, -47.870060775933446],
		[-15.80009375084477341, -47.87090937507125687],
		[-15.79884980396577809, -47.87044529741776699]
	]).addTo(map);

	poly1.larva.move.enable();

	poly2.larva.resize.enable();
	poly3.larva.rotate.enable();

	poly2.larva.move.enable();
	poly3.larva.move.enable();
}