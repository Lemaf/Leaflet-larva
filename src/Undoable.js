/**
 * @requires UndoRedo.js
 * @requires Command.js
 */

/**
 * @mixin
 */
L.larva.Undoable = {
	/**
	 * @instance
	 * @protected
	 * @param {String} desc
	 * @param {Function} doFn
	 * @param {Array.<*>} [doArgs]
	 * @param {Function} undoFn
	 * @param {Array.<*>} undoArgs
	 * @param {Boolean} [applied=false]
	 */
	_do: function (desc, doFn, doArgs, undoFn, undoArgs, applied) {

		var map = this.getMap();

		if (map.options.allowUndo) {
			map.fire('lundo:do', {
				command: L.larva.command({
					applied: !!applied,
					undoable: this,
					desc: desc,
					doFn: doFn,
					doArgs: doArgs || Array.prototype,
					undoFn: undoFn,
					undoArgs: undoArgs || Array.prototype
				})
			});
		} else if (!applied) {
			doFn.apply(this, doArgs);
		}
	},
	/**
	 * @protected
	 * @instance
	 */
	_noUndo: function () {
		var map = this.getMap();
		if (map.options.allowUndo) {
			map.fire('lundo:noundo', {undoable: this});
		}
	}
};