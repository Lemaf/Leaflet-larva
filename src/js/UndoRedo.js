/**
 * @class
 *
 * @param {L.Map} map
 */
L.larva.UndoRedo = L.Class.extend(
/** @lends L.larva.UndoRedo.prototype */
{

	options: {
		limit: 10
	},

	statics: {
		REDO: 1,
		UNDO: 2
	},

	initialize: function (map, options) {
		this._map = map;
		map.on('lundo:do', this._onDo, this);

		L.setOptions(this, options);
		this._bottom = null;
		this._current = null;
		this._top = null;
		this._total = 0;
		this._state = null;
	},

	/**
	 */
	undo: function () {
		var current = this._current || (this._state === L.larva.UndoRedo.REDO ? this._top : null);

		if (current) {
			try {
				current.unapply();
			} finally {
				this._current = current.prev;
				this._state = L.larva.UndoRedo.UNDO;
			}
		}
	},

	/**
	 */
	redo: function () {
		var current = this._current || (this._state === L.larva.UndoRedo.UNDO ? this._bottom : null);

		if (current) {
			try {
				current.apply();
			} finally {
				this._current = current.next;
				this._state = L.larva.UndoRedo.REDO;
			}
		}
	},

	_onDo: function (evt) {
		try {
			evt.command.apply();
		} finally  {
			this._push(evt.command);
			this._state = L.larva.UndoRedo.REDO;
		}
	},

	_pop: function () {
		var newBottom = this._bottom.next;
		delete newBottom.prev;
		delete this._bottom.next;
		this._bottom = newBottom;
	},

	_push: function (command) {
		var prev, next;

		if (this._total) {

			if (this._current) {
				command.prev = this._current;

				if (this._current === this._top) {
					this._top.next = command;
					this._top = this._current = command;

					// here + command

					if (this._total === this.options.limit) {
						this._pop();
					} else {
						this._total++;
					}

				} else {

					next = this._current.next;
					while (next) {
						delete next.prev;
						prev = next;
						next = next.next;
						delete prev.next;
						this._total--;
					}

					this._current.next = command;
					this._top = this._current = command;
					this._total++;
				}
			} else {

				if (this._state === L.larva.UndoRedo.UNDO) {
					// current before last
					prev = this._top;
					while (prev) {
						delete prev.next;
						next = prev;
						prev = prev.prev;
						delete next.prev;
					}

					this._top = this._bottom = this._current = command;
					this._total = 1;

				} else {
					command.prev = this._top;
					this._top.next = command;
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
			this.larva.undoRedo = new L.larva.UndoRedo(this, this.options.undoOptions);
			L.extend(this.larva, Mixin);
		}

	});

})();
