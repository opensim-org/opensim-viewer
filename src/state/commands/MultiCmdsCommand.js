import { Command } from '../Command.js';
import { CommandFactory } from './CommandFactory.js';
/**
 * @param editor Editor
 * @param editor Editor
 * @param cmdArray array containing command objects
 * @constructor
 */
class MultiCmdsCommand extends Command {

	constructor( editor, cmdArray ) {

		super( editor );

		this.type = 'MultiCmdsCommand';
		this.name = 'Multiple Changes';

		this.cmdArray = ( cmdArray !== undefined ) ? cmdArray : [];

	}

	execute() {

		//this.editor.signals.sceneGraphChanged.active = false;

		for ( let i = 0; i < this.cmdArray.length; i ++ ) {

			this.cmdArray[ i ].execute();

		}

		//this.editor.signals.sceneGraphChanged.active = true;
		//this.editor.signals.sceneGraphChanged.dispatch();

	}

	undo() {

		//this.editor.signals.sceneGraphChanged.active = false;

		for ( let i = this.cmdArray.length - 1; i >= 0; i -- ) {

			this.cmdArray[ i ].undo();

		}

		//this.editor.signals.sceneGraphChanged.active = true;
		//this.editor.signals.sceneGraphChanged.dispatch();

	}

	toJSON() {

		const output = super.toJSON( this );

		const cmds = [];
		for ( let i = 0; i < this.cmdArray.length; i ++ ) {

			cmds.push( this.cmdArray[ i ].toJSON() );

		}

		output.cmds = cmds;

		return output;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		const cmds = json.cmds;
		for ( let i = 0; i < cmds.length; i ++ ) {

			const cmd = CommandFactory.createCommand(cmds[ i ].type);	// creates a new object of type "json.type"
			cmd.fromJSON( cmds[ i ] );
			this.cmdArray.push( cmd );

		}

	}

}

export { MultiCmdsCommand };
