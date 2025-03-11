import { makeObservable, observable, action } from 'mobx'
import SceneTreeModel from '../helpers/SceneTreeModel'
import { AnimationClip } from 'three/src/animation/AnimationClip'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Object3D, Scene } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { CommandFactory } from './commands/CommandFactory'
import { saveAs } from 'file-saver';
import { SkinnedMuscle } from './SkinnedMuscle'
export class ModelInfo {
    model_name: string | null
    desc: string | null
    authors: string | null
    constructor(model_name:string|null=null, desc:string|null=null, authors:string|null=null){
        this.model_name = model_name
        this.desc = desc
        this.authors = authors
    }
}

export class ModelUIState {
    currentModelPath: string
    scene: Scene | null
    rotating: boolean
    zooming: boolean
    zoom_inOut: number
    takeSnapshot: boolean
    showGlobalFrame: boolean
    sceneTree: SceneTreeModel | null
    animating: boolean
    animationSpeed: number
    animations: AnimationClip[]
    currentAnimationIndex: number
    cameras: PerspectiveCamera[]
    currentCameraIndex: number
    selected: string
    deSelected: string
    selectedObject: Object3D | null
    draggable: boolean
    useOrbitControl: boolean
    cameraLayersMask: number
    currentFrame: number
    last_message_uuid: string
    modelInfo: ModelInfo = new ModelInfo()
    modelDictionary: { [key: string]: Object3D } = {}
    nodeDictionary: { [key: string]: Object3D } = {}
    constructor(
        currentModelPathState: string,
        rotatingState: boolean,
    ) {
        this.currentModelPath = currentModelPathState
        this.scene = null
        this.rotating = rotatingState
        this.zooming = false
        this.zoom_inOut = 0.0
        this.takeSnapshot = false
        this.showGlobalFrame = false
        this.sceneTree = null
        this.animating = false
        this.animationSpeed = 1.0
        this.animations = []
        this.currentAnimationIndex = -1
        this.cameras = []
        this.currentCameraIndex = -1
        this.selected = ""
        this.deSelected = ""
        this.selectedObject = null
        this.draggable = false
        this.useOrbitControl = true
        this.cameraLayersMask = -1
        this.currentFrame = 0
        this.last_message_uuid = ""
        makeObservable(this, {
            rotating: observable,
            currentModelPath: observable,
            zooming: observable,
            showGlobalFrame: observable,
            setRotating: action,
            setCurrentModelPath: action,
            setZooming: action,
            draggable: observable,
            setShowGlobalFrame: action,
            animationSpeed: observable,
            setAnimationList: observable,
            setAnimationSpeed: action,
            animations: observable,
            cameras: observable,
            setCamerasList: action,
            selected: observable,
            setSelected: action,
            sceneTree: observable,
            setSceneTree: action,
            cameraLayersMask: observable,
            currentFrame: observable,
            setCurrentFrame: action,
            currentCameraIndex: observable,
            setCurrentCameraIndex: action,
            useOrbitControl: observable,
        })
        console.log("Created ModelUIState instance ", currentModelPathState)
    }

    addModelFromPath(newJsonFile: string) {
        let oldPath = this.currentModelPath
        if (oldPath !== newJsonFile){
            this.currentModelPath = newJsonFile
            this.sceneTree = null;
            this.cameraLayersMask = -1
            this.animating = false
            this.animationSpeed = 1
            this.animations = []
            this.currentAnimationIndex = -1
            this.cameras = []
            this.currentCameraIndex = -1
        }
    }

    addModelToMap(model_uuid:string, modelGroup: Object3D) {
        if (modelGroup.uuid in this.modelDictionary)
            return;
        this.modelDictionary[model_uuid] = modelGroup
        modelGroup.traverse((o) => {
            this.nodeDictionary[o.uuid] =  o;
        });
    }

    getNumberOfOpenModels() {
        return Object.keys(this.modelDictionary).length;
    }
    
    setCurrentModelPath(newPath: string) {
        let oldPath = this.currentModelPath
        if (oldPath !== newPath){
            this.currentModelPath = newPath
            this.sceneTree = null;
            this.cameraLayersMask = -1
            this.animating = false
            this.animationSpeed = 1
			      this.animations = []
            this.currentAnimationIndex = -1
			      this.cameras = []
            this.currentCameraIndex = -1
        }
    }
    setRotating(newState: boolean) {
        this.rotating = newState
    }
    setZooming(newState: boolean) {
        this.zooming = newState
    }
    setZoomFactor(inOut: number) {
        this.zoom_inOut = inOut
    }
    setTakeSnapshot() {
        this.takeSnapshot = true
    }
    setAnimating(newState: boolean){
        this.animating = newState
    }
    setCurrentAnimationIndex(newIndex: number) {
        this.currentAnimationIndex = newIndex
    }
    setCurrentCameraIndex(newIndex: number) {
        this.currentCameraIndex = newIndex
    }
    setShowGlobalFrame(newState: boolean) {
        this.showGlobalFrame = newState 
    }
    setSceneTree(newTree: SceneTreeModel) {
        this.sceneTree = newTree
    }
    setAnimationList(animations: AnimationClip[]) {
        this.animations=animations
    }
    setCamerasList(cameras: PerspectiveCamera[]) {
        this.cameras=cameras
    }
    setAnimationSpeed(newSpeed: number) {
        this.animationSpeed = newSpeed
    }
    setSelected(uuid: string) {
        if (this.selected !== uuid) {
            this.deSelected = this.selected
            this.selected = uuid
            this.selectedObject = this.objectByUuid(uuid)
            this.draggable = true
        }
        if (uuid==="") {
            this.selectedObject = null
            this.draggable = false
        }
    }
    getLayerVisibility(layerToTest: number) {
        return ((this.cameraLayersMask & (1 << layerToTest)) !== 0)
    }
    toggleLayerVisibility(layerToToggle: number) {
        this.cameraLayersMask = this.cameraLayersMask ^ (1 << layerToToggle)
    }
    setCurrentFrame(currentFrame: number) {
        this.currentFrame = currentFrame
    }
    setModelInfo(curName: string, curDescription: string, curAuth: string) {
        this.modelInfo.model_name = curName
        this.modelInfo.desc = curDescription
        this.modelInfo.authors = curAuth
    }
    exportScene(): void {
        const exporter = new GLTFExporter();
        exporter.parse(
            this.objectByUuid(this.selected),
            (gltf) => {
              const output = JSON.stringify(gltf, null, 2);
              const blob = new Blob([output], { type: 'application/json' });
              saveAs(blob, 'scene.gltf');
              // You can save the output to a file or handle it as needed
            },
            (error) => {
              console.error('An error occurred during parsing', error);
            }
          );
    }
    objectByUuid(uuid: string) {
        return this.nodeDictionary[uuid]
    }
    executeCommandJson(message: string): void {
        //console.log(message);
        var parsedMessage = JSON.parse(message);
        this.executeOneCommandJson(parsedMessage);
    }
    executeOneCommandJson(cmd: Object) {
        new CommandFactory().createAndExecuteCommand(this, cmd);
    }
    addObject( object: Object3D ): void {
        console.log(object);
        if (object.parent !== null && object.parent !== undefined) 
            object.parent.add(object)
        else 
            this.scene?.add(object)
    }
    removeObject( object: Object3D ): void {
        console.log(object);
    }
    updatePath( pathUpdateJson: string ): void {
        //console.log(pathUpdateJson);
        var parsedMessage = JSON.parse(pathUpdateJson)
        const pathObject = this.objectByUuid(parsedMessage['uuid']);
        if (pathObject !== undefined)
           (pathObject as SkinnedMuscle).setColor(parsedMessage['color']);
    }
    handleSocketMessage(data: string) {
        var parsedMessage = JSON.parse(data);
        var msgOp = parsedMessage.Op
        if (parsedMessage.message_uuid === this.last_message_uuid)
            return;
        this.last_message_uuid = parsedMessage.message_uuid;
        switch(msgOp){
            case "OpenModel":
                var modeluuid = parsedMessage.UUID;
                var filejson = modeluuid.substring(0,8)+'.json';
                this.addModelFromPath(filejson)
                break;
            case "CloseModel":
                var modeltoClose = parsedMessage.UUID;
                this.modelDictionary[modeltoClose].removeFromParent()
                delete this.modelDictionary[modeltoClose]
                break;
            case "Select" :
                this.setSelected(parsedMessage.UUID)
                break;
            case "Deselect" :
                this.setSelected("")
                break;
            case "execute":
                this.executeCommandJson(data);
                break; 
            case "SetCurrentModel":
                this.setSelected(parsedMessage.UUID);
                break;
            case "addModelObject":
                this.executeCommandJson(data);
                let parentUuid = parsedMessage.command.object.object.parent;
                let cmd = parsedMessage.command;
                let newUuid = cmd.objectUuid;
                //editor.moveObject(this.objectByUuid(newUuid), this.objectByUuid(parentUuid));
                // if (msg.command.bbox !== undefined) {
                //     // update models bounding box with bbox;
                //     editor.updateModelBBox(msg.command.bbox);
                // }
                this.scene?.updateMatrixWorld(true);
                break;
            case "Frame":
                this.setSelected("")
                var transforms = parsedMessage.Transforms;
                for (var i = 0; i < transforms.length; i ++ ) {
                    var oneBodyTransform = transforms[i];
                    var o = this.objectByUuid( oneBodyTransform.uuid);
                    //alert("mat before: " + o.matrix);
                    if (o !== undefined) {
                        o.matrixAutoUpdate = false;
                        o.matrix.fromArray(oneBodyTransform.matrix);
                    }
                }
                var paths = parsedMessage.paths;
                if (paths !== undefined){
                    for (var p=0; p < paths.length; p++ ) {
                        this.updatePath(JSON.stringify(paths[p]));
                    }
                }
                this.scene?.updateMatrixWorld(true);
                break;
        }
    }
}
