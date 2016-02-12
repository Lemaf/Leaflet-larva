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
	 */
	_do: function (desc, doFn, doArgs, undoFn, undoArgs) {

		var map = this.getMap();

		if (map.options.allowUndo) {
			map.fire('lundo:do', {
				command: L.larva.command({
					undoable: this,
					desc: desc,
					doFn: doFn,
					doArgs: doArgs || Array.prototype,
					undoFn: undoFn,
					undoArgs: undoArgs || Array.prototype
				})
			});
		} else {
			doFn.apply(this, doArgs);
		}
	}
};