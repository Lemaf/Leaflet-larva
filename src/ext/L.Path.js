(function () {

	var redraw = L.Path.prototype.redraw;

	L.Path.include({
		redraw: function () {
			var ret = redraw.apply(this, arguments);
			this.fire('redraw');
			return ret;
		}
	});
})();