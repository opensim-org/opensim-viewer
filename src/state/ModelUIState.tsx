import { makeObservable, observable, action } from 'mobx'
import SceneTreeModel from '../helpers/SceneTreeModel'
import { AnimationClip } from 'three/src/animation/AnimationClip'
import { Group } from 'three'

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
    selected: string
    deSelected: string
    cameraLayersMask: number

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
        this.selected = ""
        this.deSelected = ""
        this.cameraLayersMask = -1
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
            setAnimationSpeed: action,
            selected: observable,
            setSelected: action,
            sceneTree: observable,
            setSceneTree: action,
            cameraLayersMask: observable
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
    setShowGlobalFrame(newState: boolean) {
        this.showGlobalFrame = newState 
    }
    setSceneTree(newTree: SceneTreeModel) {
        this.sceneTree = newTree
    }
    setAnimationList(animations: AnimationClip[]) {
        this.animations=animations
    }
    setAnimationSpeed(newSpeed: number) {
        this.animationSpeed = newSpeed
    }
    setSelected(uuid: string) {
        this.deSelected = this.selected
        this.selected = uuid
    }
    getLayerVisibility(layerToTest: number) {
        return ((this.cameraLayersMask & (1 << layerToTest)) !== 0)
    }
    toggleLayerVisibility(layerToToggle: number) {
        this.cameraLayersMask = this.cameraLayersMask ^ (1 << layerToToggle)
    }
}
