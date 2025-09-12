/**
 * @author Ayman Habib / https://github.com/aymanhab
 */

/**
 * @param object THREE.Object3D
 * @param newPosition THREE.Vector3
 * @param optionalOldPosition THREE.Vector3
 * @constructor
 */

var TranslatePositionCommand = function ( object, newPosition, optionalOldPosition ) {

	Command.call( this );

	this.type = 'TranslatePositionCommand';
	this.name = 'Translate Position';
	this.updatable = true;

	this.object = object;

	if ( object !== undefined && newPosition !== undefined ) {

		this.oldPosition = object.position.clone();
		this.newPosition = newPosition.clone();

	}

	if ( optionalOldPosition !== undefined ) {

		this.oldPosition = optionalOldPosition.clone();

	}

};
TranslatePositionCommand.prototype = {

	execute: function () {

		this.object.position.add( this.newPosition );
		this.object.updateMatrixWorld( true );
		//this.editor.signals.objectChanged.dispatch( this.object );

	},

	undo: function () {

		this.object.position.copy( this.oldPosition );
		this.object.updateMatrixWorld( true );
		//this.editor.signals.objectChanged.dispatch( this.object );

	},

	update: function ( command ) {

		this.newPosition.copy( command.newPosition );

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );

		output.objectUuid = this.object.uuid;
		output.oldPosition = this.oldPosition.toArray();
		output.newPosition = this.newPosition.toArray();

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.object = this.editor.objectByUuid( json.objectUuid );
		this.oldPosition = new THREE.Vector3().fromArray( json.oldPosition );
		this.newPosition = new THREE.Vector3().fromArray( json.newPosition );

	}

};
