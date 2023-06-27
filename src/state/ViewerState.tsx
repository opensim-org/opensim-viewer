import { makeObservable, observable, action } from 'mobx'

class ViewerState {
    currentModelPath: string
    featuredModelsFilePath: string
    rotating: boolean
    dark: boolean
    zooming: boolean
    zoom_inOut: number
    takeSnapshot: boolean
    showGlobalFrame: boolean

    constructor(
        currentModelPathState: string,
        featuredModelsFilePathState: string,
        rotatingState: boolean,
        darkState: boolean
    ) {
        this.currentModelPath = currentModelPathState
        this.featuredModelsFilePath = featuredModelsFilePathState
        this.rotating = rotatingState
        this.dark = darkState
        this.zooming = false
        this.zoom_inOut = 0.0
        this.takeSnapshot = false
        this.showGlobalFrame = true
        makeObservable(this, {
            rotating: observable,
            currentModelPath: observable,
            featuredModelsFilePath: observable,
            dark: observable,
            zooming: observable,
            showGlobalFrame: observable,
            setRotating: action,
            setCurrentModelPath: action,
            setFeaturedModelsFilePath: action,
            setZooming: action,
            setShowGlobalFrame: action
        })
    }

    setCurrentModelPath(newState: string) {
        this.currentModelPath = newState
    }
    setFeaturedModelsFilePath(newState: string) {
        this.featuredModelsFilePath = newState
    }
    setRotating(newState: boolean) {
        this.rotating = newState
    }
    setDark(newState: boolean) {
        this.dark = newState
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
    setShowGlobalFrame(newState: boolean) {
        this.showGlobalFrame = newState 
    }
}

const viewerState = new ViewerState('/builtin/leg39_nomusc.gltf', '/builtin/featured-models.json', true, true)

export default viewerState
