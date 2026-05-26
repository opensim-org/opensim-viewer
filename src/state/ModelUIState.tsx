import { makeObservable, observable, action } from 'mobx'
import { AnimationClip, Group, PerspectiveCamera } from 'three'
import { Light } from 'three'
import { Box3, Object3D, Scene, Vector3, Matrix4 } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { CommandFactory } from './commands/CommandFactory'
import { saveAs } from 'file-saver';
import { SkinnedMuscle } from './SkinnedMuscle'
import ViewerState from './ViewerState'
import SceneTreeModel from '../helpers/SceneTreeModel';

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
    transparent_background: boolean
    image_format: string
    quality_level: string
    aspect_ratio: string
    constructor(){
        this.size_choice = "screen"
        this.height = 600
        this.width = 800
        this.preserve_aspect_ratio = true
        this.transparent_background = false
        this.image_format = "png"
        this.quality_level = "1080p HD"
        this.aspect_ratio = "16:9"
    }
}

export class KeyFrameProps {
    ktime: number
    camera: PerspectiveCamera | null
    target: Vector3 | null
    constructor(camera: PerspectiveCamera| null, target: Vector3| null, time: number|null){
        this.ktime = time===null?0. :time
        this.camera = camera
        this.target = target
    }
}
export class ModelUIState {
    scene: Scene | Group |null
    isGuiMode: boolean
    isModernBrowser: boolean
    zooming: boolean
    zoom_inOut: number
    takeSnapshot: boolean
    snapshotProps: SnapshotProps = new SnapshotProps()
    showGlobalFrame: boolean
    sceneTree: SceneTreeModel | null
    lights: Light[]
    selected: string
    deSelected: string
    selectedObject: Object3D | null
    draggable: boolean
    cameraLayersMask: number
    currentFrame: number
    last_message_uuid: string
    modelInfo: ModelInfo = new ModelInfo()
    viewerState: ViewerState
    modelDictionary: { [key: string]: Object3D } = {}
    nodeDictionary: { [key: string]: Object3D } = {}
    selectableTypes: string[] = []
    draggableTypes: string[] = []
    socket: WebSocket|null = null
    useSkybox: string
    fitToBox: Box3 | null
    debug: boolean
    simulationTime: number
    processingSocketMessage: boolean = false
    fps: number = 60
    guiHasAnimation: boolean = false
    guiAnimationStartTime: number = 0.0
    guiAnimationEndTime: number = 0.0
    guiAnimationSpeed: number = 1.0
    guiAnimationLoop: boolean = false
    guiAnimationReverse: boolean = false
    showBottomBar: boolean = false;
    showAspectRatioFunctionality: boolean = true;
    isInRecordMode: boolean = false;
    visibleHelpers: boolean = true;
    constructor(
        currentModelPathState: string
    ) {
        this.scene = null
        this.isGuiMode = false
        this.isModernBrowser = true
        this.zooming = false
        this.zoom_inOut = 0.0
        this.takeSnapshot = false
        this.showGlobalFrame = false
        this.sceneTree = null
        this.lights = []
        //this.keyframes = []
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
        this.simulationTime=0.0
        this.viewerState = new ViewerState(currentModelPathState, '/builtin/featured-models.json', false, false, false, false, "opensim-snapshot", 'png', "opensim-video", 'mp4', false, false);
        makeObservable(this, {
            zooming: observable,
            showGlobalFrame: observable,
            setZooming: action,
            draggable: observable,
            setShowGlobalFrame: action,
            lights: observable,
            selected: observable,
            setSelected: action,
            sceneTree: observable,
            setSceneTree: action,
            cameraLayersMask: observable,
            currentFrame: observable,
            setCurrentFrame: action,
            incrementCurrentFrame: action,
            simulationTime: observable,
            setIsGuiMode: action,
            setIsModernBrowser: action,
            visibleHelpers: observable,
            debug: observable,
            setDebug: action,
        })
        console.log("Created ModelUIState instance ", currentModelPathState);
        setTimeout(() => {
            if (this.socket !== null){
                var json = JSON.stringify({
                   type: "INFO",
                   "Op": "keepAlive"});
                this.socket!.send(json);
                }
        }, 60000);
    }

    addModelFromPath(newJsonFile: string) {
        let oldPath = this.viewerState.currentModelPath
        if (oldPath !== newJsonFile)
            this.viewerState.setCurrentModelPath(newJsonFile)
    }

    addModelToMap(model_uuid:string, modelGroup: Object3D) {
        if (modelGroup.uuid in this.modelDictionary)
            return;
        this.modelDictionary[model_uuid] = modelGroup
        modelGroup.traverse((o) => {
            this.nodeDictionary[o.uuid] =  o;
        });
        //this.sceneTree!.addModel(modelGroup);
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
    
    setZooming(newState: boolean) {
        this.zooming = newState
    }
    setZoomFactor(inOut: number) {
        this.zoom_inOut = inOut
        if (this.zooming){
            if (inOut > 1.) {
                this.viewerState.handleKey('i')
            }
            else {
                this.viewerState.handleKey('o')
            }
        }
    }
    setTakeSnapshot() {
        this.takeSnapshot = true
    }
    setShowGlobalFrame(newState: boolean) {
        this.showGlobalFrame = newState 
    }
    setSceneTree(newTree: SceneTreeModel) {
        this.sceneTree = newTree
    }
    setLightsList(lights: Light[]) {
        this.lights = lights
    }
    getGuiMode() {
        return this.isGuiMode;
    }
    setIsGuiMode(newGuiMode: boolean = false) {
        this.isGuiMode = newGuiMode;
    }
    setIsInRecordMode(newValue: boolean = false) {
        this.isInRecordMode = newValue;
    }
    getModernBrowserMode() {
        return this.isModernBrowser;
    }
    setIsModernBrowser(newModernBrowser: boolean = true) {
        this.isModernBrowser = newModernBrowser;
    }
    setSelected(uuid: string, notifyGUI: boolean = false) {
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
    incrementCurrentFrame() {
        this.currentFrame += 1;
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
        const envGroup = theScene.getObjectByName('OpenSim Environment');
        if (envGroup) {
            var json = envGroup.toJSON();
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
        // actually remove object from its parent
        object.removeFromParent();
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
                    // update sceneVersion to force tree rendering
                    this.viewerState.setSceneVersion(this.viewerState.sceneVersion+1);
                    // delete all animations related to this model
                    this.viewerState.removeAnimationsForModelUUID(modeltoClose);
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
                if (this.processingSocketMessage)
                    return;
                if (this.viewerState.animating){
                    // If we are animating, ignore frame updates from server
                    return;
                }
                this.processingSocketMessage = true;
                this.setSelected("", false)
                var transforms = parsedMessage.Transforms;
                const tempMatrix = new Matrix4();
                for (var i = 0; i < transforms.length; i ++ ) {
                    var oneBodyTransform = transforms[i];
                    var o = this.objectByUuid( oneBodyTransform.uuid);
                    // set position, quaternion and scale and leave matrixAutoUpdate on
                    // as Animation clips work by interpolating each separately with the flag on
                    tempMatrix.fromArray(oneBodyTransform.matrix);
                    tempMatrix.decompose(o.position, o.quaternion, o.scale);
                }
                var paths = parsedMessage.paths;
                if (paths !== undefined){
                    for (var p=0; p < paths.length; p++ ) {
                        this.updatePath(JSON.stringify(paths[p]));
                    }
                }
                //this.scene?.updateMatrixWorld(true);
                this.simulationTime = parsedMessage.time;
                this.viewerState.currentAnimationTime = this.simulationTime;
                this.processingSocketMessage = false;
                console.log("Receive frame simulation time="+this.simulationTime);
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
                this.processPathEdit(parsedMessage);
                break;
            case "endAnimation":
                this.viewerState.animating = false;
                this.viewerState.setAnimationsNeedUpdate(true);
                console.log("Receive endAnimation");
                break;
            case "ClearCurrentAnimation":
                // TODO Major cleanup needed here
                this.viewerState.currentAnimationIndices = [];
                this.viewerState.setAnimationsNeedUpdate(true);
                console.log("Receive ClearCurrentAnimation");
                break;
            case "AddAnimationClip":
                this.guiHasAnimation = true;
                // check for existing clip with same uuid?
                for (let existingClip of this.viewerState.animations) {
                    if (existingClip.uuid === parsedMessage.Clip.uuid) {
                        console.log(`Animation clip with name ${existingClip.name} already exists. Skipping addition.`);
                        return;
                    }
                }
                // Create AnimationClips for the clip in the message,
                this.createAnimationClipFromMessage(parsedMessage);
                break;
            case "SetCurrentAnimations":
                this.viewerState.animating = false; 
                const animationIDs = parsedMessage.clip_list;
                this.viewerState.clearCurrentAnimationIndices();
                for (let uuid of animationIDs) {
                    for (let i = 0; i < this.viewerState.animations.length; i++) {
                        if (this.viewerState.animations[i].uuid === uuid) {
                            this.viewerState.addCurrentAnimationIndex(i);
                            //console.log("  set as current animation at index "+i+" uuid "+uuid);
                            break;
                        }
                    }
                }
                break;
            case "PlayAnimation":
                //console.log("Receive PlayAnimation from time "+parsedMessage.start_time);
                if (this.viewerState.animating){
                    // If we are animating, ignore play command, likely a redundant message
                    console.log(" Already animating, ignoring PlayAnimation command");
                    return;
                }                
                //this.viewerState.animating = false; 
                //const animationUUIDs = parsedMessage.UUIDs;
                // this.viewerState.clearCurrentAnimationIndices();
                // for (let uuid of animationUUIDs) {
                //     for (let i = 0; i < this.viewerState.animations.length; i++) {
                //         if (this.viewerState.animations[i].uuid === uuid) {
                //             this.viewerState.addCurrentAnimationIndex(i);
                //             console.log("  Playing animation at index "+i+" uuid "+uuid);
                //             break;
                //         }
                //     }
                // }
                this.guiAnimationLoop = parsedMessage.loop;
                this.guiAnimationSpeed = parsedMessage.speed;
                this.guiAnimationStartTime = parsedMessage.start_time;
                this.guiAnimationEndTime = parsedMessage.end_time;
                this.guiAnimationLoop = parsedMessage.loop;
                this.guiAnimationReverse = parsedMessage.reverse;
                this.viewerState.animating = true; 
                this.viewerState.animationChange = {index:0, operation:"start"};
                this.viewerState.setAnimationsNeedUpdate(true)
                break;
            case "AnimationTime":
                //console.log("Receive AnimationTimeUpdate time="+parsedMessage.time);
                this.viewerState.animationChange = {index:0, operation:"timeChange"};
                this.viewerState.currentAnimationTime = parsedMessage.time;
                this.viewerState.setAnimationsNeedUpdate(true)
                break;
            case "SetAnimationSpeed":
                this.guiAnimationSpeed = parsedMessage.speed;
                break;
            case "SetAnimationLoop":
                this.guiAnimationLoop = parsedMessage.state;
                // use index -1 to indicate all current animations
                this.viewerState.animationChange = {index:-1, operation:"updateLooping"};
                this.viewerState.setAnimationsNeedUpdate(true);
                break;
            case "HeartBeat":
                console.log("Hearbeat received")
                this.sendModelOffsets();
                break;
        }
    }
    sendText(json: string) {
        if (this.debug)
            console.log(json);
        if (this.socket !== null)
        this.socket!.send(json);
    }
    setSkyboxImage(skyboxName: string) {
        this.useSkybox = skyboxName
    }
    fitCameraTo(objectbbox: Box3) {
        this.fitToBox = objectbbox;
    }

    startAnimationRecording() {
        const json = JSON.stringify({
        type: "Animation",
        "OP": "Start"});
        if (this.socket !== null)
            this.socket!.send(json);
    }
    
    getClipStartTime(clip: AnimationClip) {
        return clip.tracks.reduce((min, track) => {
            return track.times.length ? Math.min(min, track.times[0]) : min;
        }, Infinity);
    }

    createAnimationClipFromMessage(clipMessage: any) {
        // Creating AnimationClip from clipMessage
        // We probably should check to avoid duplicates here
        const clip = AnimationClip.parse(clipMessage.Clip); // This creates an AnimationClip instance
        const startTime = this.getClipStartTime(clip);
        this.viewerState.animations.push(clip);
        this.viewerState.animationStartTimes.push(startTime);
        const index = this.viewerState.animations.length - 1;
        console.log(`Creating Animation Clip: Name=${clip.name}, Duration=${clip.duration}`);
        const clipRoot = clipMessage.Root;
        console.log(`  Root Object UUID: ${clipRoot}`);
        this.viewerState.animationRoots.push(this.nodeDictionary[clipRoot]);
        this.viewerState.animationChange = {index:index, operation:"add"};
        this.viewerState.setAnimationsNeedUpdate(true)
    }
    stopGUIAnimation() {
        const json = JSON.stringify({
        type: "Animation",
        "OP": "Stop"});
        if (this.socket !== null)
            this.socket!.send(json);
    }
    finishRecording() {
        const json = JSON.stringify({
            type: "FinishRecording"});
            if (this.socket !== null)
                this.socket!.send(json);
    }
    setTimeGUIAnimation(time: number) {
        const json = JSON.stringify({
        type: "Animation",
        "OP": "setTime",
        "value": time
        });
        if (this.socket !== null)
            this.socket!.send(json);
    }
    sendFrameAcknowledge(frameNumber: number) {
        const json = JSON.stringify({
            type: "frameack",
            "#": frameNumber
            });
        if (this.socket !== null)
            this.socket!.send(json);
    }
    sendMeasuredFPS(fps: number) {
        if (this.viewerState.animating)
            return; // Don't interfere with animation while playing
        this.fps = fps;
        var json = JSON.stringify({
               type: "INFO",
               "fps": fps});
        //console.log("FPS: ", fps);
        if (this.socket !== null)
            this.socket!.send(json);
    }
    sendModelOffsets() {
        const offsetsJson = this.getModelOffsetsJson();
        this.sendText(offsetsJson);
    }
    setVisibleHelpers(visible: boolean) {
      this.visibleHelpers = visible;
    }
    setDebug(value: boolean) {
      this.debug = value;
    }
    // Process Path operations from GUI
    processPathEdit(pathEditJson: any) { 
        const pathOp = pathEditJson.SubOperation;
        const pathObject = this.objectByUuid(pathEditJson.uuid);
        switch(pathOp) {
            case "refresh":
                const updPoints = pathEditJson.points;
                for (var i = 0; i < updPoints.length; i++) {
                    const nextEntry = updPoints[i];
                    const uuid = nextEntry.uuid;
                    const xform = nextEntry.matrix;
                    const matrix = new Matrix4();
                    matrix.fromArray(xform);
                    const pathpointObject = this.objectByUuid(uuid);
                    matrix.decompose(pathpointObject.position, pathpointObject.quaternion, pathpointObject.scale);
                }
                break;
            // TODO add more path edit operations here
        }
    }
}
