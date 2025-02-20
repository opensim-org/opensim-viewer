import { Command } from '../Command.js';
import { OpenSimLoader } from '../OpenSimLoader.js';
/**
 * @param editor Editor
 * @param editor Editor
 * @param object THREE.Object3D
 * @constructor
 */
class AddObjectCommand extends Command {

	constructor( editor, object ) {

		super( editor );

	this.type = 'AddObjectCommand';

	this.object = object;
	if ( object !== undefined ) {

			this.name = `Add Object: ${object.name}`;

	}

	}

	execute() {

		this.editor.addObject( this.object );
		//this.editor.select( this.object );
		this.object.updateMatrixWorld( true );

	}

	undo() {

		this.editor.removeObject( this.object );
		this.editor.deselect();

	}

	toJSON() {

		const output = super.toJSON( this );

		output.object = this.object.toJSON();

		return output;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.object = this.editor.objectByUuid( json.object.object.uuid );

		if ( this.object === undefined ) {

			var loader = new OpenSimLoader();
			this.object = loader.parse( json.object );
		}

	}

}

export { AddObjectCommand };
