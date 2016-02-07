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
		map.undoRedo = this;
		map.on('lundo:do', this._onDo, this);

		L.setOptions(this, options);
		this._bottom = null;
		this._current = null;
		this._top = null;
		this._total = 0;
	},

	_onDo: function (evt) {
		try {
			evt.command.apply();
		} finally  {
			this._push(evt.command);
		}
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
						next = this._bottom._n;
						delete next._p;
						delete this._bottom._n;
						this._bottom = next;
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
			}
		} else {
			this._top = this._current = this._bottom = command;
			this._total = 1;
		}
	},

	/**
	 */
	undo: function () {
		if (this._current) {
			try {
				this._current.unapply();
			} finally {
				this._current = this._current._p;
			}
		}
	}

});


L.Map.addInitHook(function () {

	if (this.options.allowUndo) {
		this._undoRedo = new L.larva.UndoRedo(this, this.options.undoOptions);
	}

});