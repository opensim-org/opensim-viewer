import { makeObservable, observable, action } from 'mobx'

class ViewerState {
    currentModelPath: string
    featuredModelsFilePath: string
    rotating: boolean
    dark: boolean

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

        makeObservable(this, {
            rotating: observable,
            currentModelPath: observable,
            featuredModelsFilePath: observable,
            dark: observable,
            setRotating: action,
            setCurrentModelPath: action,
            setFeaturedModelsFilePath: action,
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
}

const viewerState = new ViewerState('/builtin/leg39_nomusc.gltf', '/builtin/featured-models.json', true, true)

export default viewerState
