import { makeObservable, observable, action } from 'mobx'
import SceneTreeModel from '../helpers/SceneTreeModel'
import { AnimationClip } from 'three/src/animation/AnimationClip'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Light } from 'three'
import { Group } from 'three'
import ViewerState from './ViewerState'

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
    scene: Group | null
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
    lights: Light[]
    currentCameraIndex: number
    selected: string
    deSelected: string
    cameraLayersMask: number
    currentFrame: number
    modelInfo: ModelInfo = new ModelInfo()
    viewerState: ViewerState = new ViewerState('/builtin/arm26_elbow_flex.gltf', '/builtin/featured-models.json', false, false, false, false, "opensim-viewer-snapshot", 'png', "opensim-viewer-video", 'mp4', false, false, false)
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
        this.lights = []
        this.currentCameraIndex = -1
        this.selected = ""
        this.deSelected = ""
        this.cameraLayersMask = -1
        this.currentFrame = 0
        makeObservable(this, {
            rotating: observable,
            currentModelPath: observable,
            zooming: observable,
            showGlobalFrame: observable,
            setRotating: action,
            setCurrentModelPath: action,
            setZooming: action,
            setShowGlobalFrame: action,
            animationSpeed: observable,
            setAnimationList: observable,
            setAnimationSpeed: action,
            animations: observable,
            cameras: observable,
            lights: observable,
            setCamerasList: action,
            selected: observable,
            setSelected: action,
            sceneTree: observable,
            setSceneTree: action,
            cameraLayersMask: observable,
            currentFrame: observable,
            setCurrentFrame: action,
            currentCameraIndex: observable,
            setCurrentCameraIndex: action
        })
        console.log("Created ModelUIState instance ", currentModelPathState)
    }

    setCurrentModelPath(newState: string) {
        let oldPath = this.currentModelPath
        if (oldPath !== newState){
            this.currentModelPath = newState
            this.sceneTree = null;
            this.cameraLayersMask = -1
            this.animating = false
            this.animationSpeed = 1
			      this.animations = []
            this.currentAnimationIndex = -1
			      this.cameras = []
			      this.lights = []
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
    setLightsList(lights: Light[]) {
      this.lights = lights
    }
    setAnimationSpeed(newSpeed: number) {
        this.animationSpeed = newSpeed
    }
    setSelected(uuid: string) {
        if (this.selected !== uuid) {
            this.deSelected = this.selected
            this.selected = uuid
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
}
