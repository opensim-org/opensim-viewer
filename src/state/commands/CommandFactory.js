
import {SetValueCommand} from './Commands.js';
//import {SetColorCommand} from './Commands.js';
import {MultiCmdsCommand} from './Commands.js';
import {SetScaleCommand} from './Commands.js';
import {MoveObjectCommand} from './Commands.js';
//import {RemoveObjectCommand} from './Commands.js';
//import {AddObjectCommand} from './Commands.js';
import {SetMaterialColorCommand} from './Commands.js';
import {SetMaterialValueCommand} from './Commands.js';
import { SetPositionCommand } from './Commands.js';
import { SetValueCommandMuscle } from './Commands.js';
import { SetRotationCommand } from './Commands.js';
function CommandFactory() {

}

CommandFactory.prototype = {
    createCommandByName: function (theEditor, commandType) {
        switch (commandType) {
            case 'SetValueCommand':
                var cmd = new SetValueCommand(theEditor);
                return cmd;
            case 'SetValueCommandMuscle':
                cmd = new SetValueCommandMuscle(theEditor);
                return cmd;
            case 'SetColorCommand':
                cmd = new SetMaterialColorCommand(theEditor);
                return cmd;
           case 'SetScaleCommand':
                cmd = new SetScaleCommand(theEditor);
                return cmd;
            case 'MoveObjectCommand':
                cmd = new MoveObjectCommand(theEditor);
                return cmd;
            // case 'RemoveObjectCommand':
            //     var cmd = new RemoveObjectCommand(theEditor);
            //     return cmd;
            // case 'AddObjectCommand':
            //     var cmd = new AddObjectCommand(theEditor);
            //     return cmd;
            case 'SetMaterialColorCommand':
                cmd = new SetMaterialColorCommand(theEditor);
                return cmd;
            case 'SetMaterialValueCommand':
                cmd = new SetMaterialValueCommand(theEditor);
                return cmd;
            case 'SetPositionCommand':
                cmd = new SetPositionCommand(theEditor);
                return cmd;
            case 'SetRotationCommand':
                cmd = new SetRotationCommand(theEditor);
                return cmd;
            default:
                break;
        }
    },
    createAndExecuteCommand: function ( theEditor, json ) {
        var commandType = json.command.type;
        if (commandType !== 'MultiCmdsCommand'){
            var cmd = this.createCommandByName(theEditor, commandType);
            cmd.fromJSON(json.command);
            cmd.execute();
        }
        else {
                var cmd = new MultiCmdsCommand(theEditor, json.command.cmds);
                for (var c=0; c < cmd.cmdArray.length; c++){
                    var subCmdType = cmd.cmdArray[c].type;
                    var subCmd = this.createCommandByName(theEditor, subCmdType);
                    subCmd.fromJSON(cmd.cmdArray[c]);
                    subCmd.execute();
                }
        }
    }
};
export { CommandFactory };
