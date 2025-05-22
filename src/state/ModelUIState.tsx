import { makeObservable, observable, action } from 'mobx'
import SceneTreeModel from '../helpers/SceneTreeModel'
import { AnimationClip } from 'three/src/animation/AnimationClip'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Box3, Object3D, Scene } from 'three'
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

export class SnapshotProps {
    size_choice: string
    width: number
    height: number
    preserve_aspect_ratio: boolean
    constructor(){
        this.size_choice = "screen"
        this.height = 600
        this.width = 800
        this.preserve_aspect_ratio = true
    }
}
export class ModelUIState {
    currentModelPath: string
    scene: Scene | null
    isGuiMode: boolean
    rotating: boolean
    zooming: boolean
    zoom_inOut: number
    pending_key: string
    takeSnapshot: boolean
    snapshotProps: SnapshotProps = new SnapshotProps()
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
    cameraLayersMask: number
    currentFrame: number
    last_message_uuid: string
    modelInfo: ModelInfo = new ModelInfo()
    modelDictionary: { [key: string]: Object3D } = {}
    nodeDictionary: { [key: string]: Object3D } = {}
    selectableTypes: string[] = []
    draggableTypes: string[] = []
    socket: WebSocket|null = null
    useSkybox: string
    fitToBox: Box3 | null
    debug: boolean
    constructor(
        currentModelPathState: string,
        rotatingState: boolean,
    ) {
        this.currentModelPath = currentModelPathState
        this.scene = null
        this.isGuiMode = true
        this.rotating = rotatingState
        this.zooming = false
        this.zoom_inOut = 0.0
        this.pending_key = ""
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
        this.cameraLayersMask = -1
        this.currentFrame = 0
        this.last_message_uuid = ""
        this.selectableTypes = ["Marker", "PathPoint", "Model", "Mesh"]
        this.draggableTypes = ["Marker", "PathPoint", "Model"]
        this.useSkybox = "NoBackground"
        this.fitToBox = null
        this.debug = false
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
        })
        console.log("Created ModelUIState instance ", currentModelPathState)
    }
    public toJSON() {
        return {
        showGlobalFrame: this.showGlobalFrame,
        useSkybox: this.useSkybox,
        cameras: this.cameras
        };
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
    addObjectToMap(object:Object3D) {
        this.nodeDictionary[object.uuid] =  object
        object.traverse((o) => {
            this.nodeDictionary[o.uuid] =  o;
        })
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
        if (this.zooming){
            if (inOut > 1.) {
                this.handleKey('i')
            }
            else {
                this.handleKey('o')
            }
        }
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
    saveCamera() {
        this.handleKey('s')
    }
    restoreCamera() {
        this.handleKey('r')
    }
    setSelected(uuid: string, notifyGUI: boolean) {
        if (this.selected !== uuid) {
            this.deSelected = this.selected
            this.selected = uuid
            this.selectedObject = this.objectByUuid(uuid)
            if (this.selectedObject != null){
                 this.draggable = this.selectedObject.userData !== undefined &&
                 this.draggableTypes.includes(this.selectedObject.userData.opensimType)
            }
        }
        if (uuid==="") {
            this.selectedObject = null
            this.draggable = false
        }
        if (notifyGUI) {
            // Send uuid of selected object across socket
            var json = JSON.stringify({
               "event": "select",
                "uuid": uuid});
            this.sendText(json);
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
        var objectToExport:Object3D = this.scene!;
        if (this.selected!=="") {
            objectToExport = this.objectByUuid(this.selected);
        }
        exporter.parse(
            objectToExport,
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
    save(): void {
        const theScene:Object3D = this.scene!;
        // traverse scene to find environment group, export to json
        // then add userData that contains Camera(s), other info
        const envGroup = theScene.getObjectByName('OpenSimEnvironment');
        if (envGroup) {
            var json = envGroup.toJSON();
            json["state"] = this.toJSON()
            const blob = new Blob( [ JSON.stringify( json ) ], { type: 'application/json' } );
            saveAs(blob, "my_environment.json");
        }
    }
    restore(): void {

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
    setSocketHandle(socket: WebSocket) {
        this.socket = socket;
    }
    moveObject( object: Object3D, parent: Object3D): void {
        if (parent === undefined) {
            console.log('parent not found, using scene')
            //parent = this.scene;
        }
        parent.add(object)
    }
    getModelOffsetsJson() {
        var offsets: any = {
            "type": "transforms",
            "ObjectType": "Model",
             "uuids" : [],
             "positions": []
        };
        var modeluuid="";
        for (modeluuid in this.modelDictionary) {
            offsets.uuids.push(modeluuid);
            var nextModel = this.objectByUuid(modeluuid);
            offsets.positions.push(nextModel.position);
        };
        return JSON.stringify(offsets);
    }
    scaleGeometry(scaleJson:string) {
        if (this.debug)
            console.log(scaleJson);
        this.executeOneCommandJson(scaleJson);
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
                if (this.modelDictionary[modeltoClose]!== undefined){
                    this.modelDictionary[modeltoClose].removeFromParent()
                    delete this.modelDictionary[modeltoClose]
                }
                break;
            case "Select" :
                this.setSelected(parsedMessage.UUID, false)
                break;
            case "Deselect" :
                this.setSelected("", false)
                break;
            case "execute":
                this.executeCommandJson(data);
                break; 
            case "SetCurrentModel":
                this.setSelected(parsedMessage.UUID, false);
                break;
            case "addModelObject":
                this.executeCommandJson(data);
                let parentUuid = parsedMessage.command.object.object.parent;
                let cmd = parsedMessage.command;
                let newUuid = cmd.objectUuid;
                this.moveObject(this.objectByUuid(newUuid), this.objectByUuid(parentUuid));
                this.scene?.updateMatrixWorld(true);
                break;
            case "Frame":
                this.setSelected("", false)
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
            case "getOffsets":
                this.sendText(this.getModelOffsetsJson());
                break;
            case "ReplaceGeometry":
                // Placeholder since this doesn't appear in GUI
                //editor.replaceGeometry(msg.geometries, msg.uuid);
                if (this.debug)
                    console.log(data);
                break;
            case "scaleGeometry":
                this.scaleGeometry(parsedMessage);
                this.scene?.updateMatrixWorld(true);
                break;
            case "PathOperation":
                // TODO: support path edit message type
                //editor.processPathEdit(msg);
                break;
        }
    }
    sendText(json: string) {
        if (this.debug)
            console.log(json);
        if (this.socket !== null)
        this.socket!.send(json);
    }
    handleKey(key: string) {
        this.pending_key = key
    }
    setSkyboxImage(skyboxName: string) {
        this.useSkybox = skyboxName
    }
    fitCameraTo(objectbbox: Box3) {
        this.fitToBox = objectbbox;
      }
}
