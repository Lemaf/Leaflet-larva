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
	_do: function (desc, doFn) {

		var map = this.getMap(),
		    doArgs = Array.prototype.slice.call(arguments, 2),
		    self = this;

		return function (undoFn) {

			if (map.options.allowUndo) {
				map.fire('lundo:do', {
					command: L.larva.command({
						undoable: self,
						desc: desc,
						doFn: doFn,
						doArgs: doArgs,
						undoFn: undoFn,
						undoArgs: Array.prototype.slice.call(arguments, 1)
					})
				});
			} else {
				doFn.apply(this, doArgs);
			}
		};
	},

	/**
	 * @param  {String} desc
	 * @param  {Function} doFn
	 * @return {L.larva.Command}
	 */
	_newCommand: function (desc, doFn) {
		var args = Array.prototype.slice.call(arguments, 2);
		return new L.larva.Command.Builder(desc, doFn, args);
	}

};