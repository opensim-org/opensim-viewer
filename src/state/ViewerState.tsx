import { makeObservable, observable, action } from 'mobx'

class ViewerState {
    currentModelPath: string
    featuredModelsFilePath: string
    dark: boolean

    constructor(
        currentModelPathState: string,
        featuredModelsFilePathState: string,
        darkState: boolean,
    ) {
        this.currentModelPath = currentModelPathState
        this.featuredModelsFilePath = featuredModelsFilePathState
        this.dark = darkState
        makeObservable(this, {
            currentModelPath: observable,
            featuredModelsFilePath: observable,
            dark: observable,
            setCurrentModelPath: action,
            setFeaturedModelsFilePath: action
        })
    }

    setCurrentModelPath(newState: string) {
        this.currentModelPath = newState
    }
    setFeaturedModelsFilePath(newState: string) {
        this.featuredModelsFilePath = newState
    }
    setDark(newState: boolean) {
        this.dark = newState
    }

}

const viewerState = new ViewerState('/builtin/arm26_elbow_flex.gltf', '/builtin/featured-models.json', false)

export default viewerState
