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
	 * @param  {String} desc
	 * @param  {Function} doFn
	 * @param  {Function} undoFn
	 */
	_do: function (desc, doFn, undoFn) {
		var args = Array.prototype.slice.call(arguments, 3);
		var map = this.getMap();

		if (map.options.allowUndo) {
			map.fire('lundo:do', {
				command: L.larva.command(this, desc, doFn, undoFn, args)
			});
		} else {
			doFn.apply(this, args);
		}
	}

};