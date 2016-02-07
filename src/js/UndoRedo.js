/**
 * @class
 *
 * @param {L.Map} map
 */
L.larva.UndoRedo = L.Class.extend({

	options: {
		limit: 5
	},

	initialize: function (map, options) {
		this._map = map;
		map.on('lundo:do', this._onDo, this);

		L.setOptions(this, options);
		this._bottom = null;
		this._current = null;
		this._top = null;
		this._total = 0;
	},

	/**
	 */
	undo: function () {
		var current = this._current || (this._op === 'redo' ? this._top : null);

		if (current) {
			try {
				current.unapply();
			} finally {
				this._current = current._p;
				this._op = 'undo';
			}
		}
	},

	redo: function () {
		var current = this._current || (this._op === 'undo' ? this._bottom : null);

		if (current) {
			try {
				current.apply();
			} finally {
				this._current = current._n;
				this._op = 'redo';
			}
		}
	},

	_onDo: function (evt) {
		try {
			evt.command.apply();
		} finally  {
			this._push(evt.command);
		}
	},

	_pop: function () {
		var newBottom = this._bottom._n;
		delete newBottom._p;
		delete this._bottom._n;
		this._bottom = newBottom;
	},

	_push: function (command) {
		var previous, next;

		if (this._total) {
			if (this._current) {
				command._p = this._current;

				if (this._current === this._top) {
					this._top._n = command;
					this._top = this._current = command;

					// here + command

					if (this._total === this.options.limit) {
						this._pop();
					} else {
						this._total++;
					}

				} else {

					next = this._current._n;
					while (next) {
						delete next._p;
						previous = next;
						next = next._n;
						delete previous._n;
						this._total--;
					}

					this._current._n = command;
					this._top = this._current = command;
					this._total++;
				}
			} else {

				if (this._op === 'undo') {
					// current before last
					previous = this._top;
					while (previous) {
						delete previous._n;
						next = previous;
						previous = previous._p;
						delete next._p;
					}

					this._top = this._bottom = this._current = command;
					this._total = 1;

				} else {
					command._p = this._top;
					this._top._n = command;
					this._top = this._current = command;

					if (this._total === this.options.limit) {
						this._pop();
					} else {
						this._total++;
					}
				}

			}
		} else {
			this._top = this._current = this._bottom = command;
			this._total = 1;
		}
	}
});


(function () {

	var Mixin = {
		redo: function () {
			this.undoRedo.redo();
		},

		undo: function () {
			this.undoRedo.undo();
		}
	};

	L.Map.addInitHook(function () {

		if (this.options.allowUndo) {
			this.larva = this.larva || {};
			this.larva.undoRedo = new L.larva.UndoRedo(this, this.options.undoOptions);
			L.extend(this.larva, Mixin);
		}

	});

})();
