import { Command } from '../Command.js';
/**
 * @author Ayman / https://github.com/aymanhab
 * Developed as part of a OpenSim project
 */

/**
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newValue number, string, boolean or object
 * @constructor
 */
class SetValueCommandMuscle extends Command {

	constructor ( editor, object, attributeName, newValue ) {

		super(editor);

		this.type = 'SetValueCommandMuscle';
		this.name = 'Set ' + attributeName;
		this.updatable = true;

		this.object = object;
		this.attributeName = attributeName;
		this.oldValue = ( object !== undefined ) ? object[ attributeName ] : undefined;
		this.newValue = newValue;

	}

	execute() {

		//this.object[ this.attributeName ] = this.newValue;
        this.object.setVisible(this.newValue);
		//this.editor.signals.objectChanged.dispatch( this.object );
		// //this.editor.signals.sceneGraphChanged.dispatch();

	}

	undo() {

		this.object[ this.attributeName ] = this.oldValue;
		//this.editor.signals.objectChanged.dispatch( this.object );
		// //this.editor.signals.sceneGraphChanged.dispatch();

	}

	update( cmd ) {

		this.newValue = cmd.newValue;

	}

	toJSON() {

		var output = super.toJSON(this);

		output.objectUuid = this.object.uuid;
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;

	}

	fromJSON( json ) {

		super.fromJSON(json);

		this.attributeName = json.attributeName;
		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

}

export { SetValueCommandMuscle };
