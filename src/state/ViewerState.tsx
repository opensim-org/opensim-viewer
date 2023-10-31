import { makeObservable, observable, action } from 'mobx'

class ViewerState {
    currentModelPath: string
    featuredModelsFilePath: string
    dark: boolean
    isLoggedIn: boolean

    constructor(
        currentModelPathState: string,
        featuredModelsFilePathState: string,
        darkState: boolean,
        isLoggedInState: boolean
    ) {
        this.currentModelPath = currentModelPathState
        this.featuredModelsFilePath = featuredModelsFilePathState
        this.dark = darkState
        this.isLoggedIn = isLoggedInState
        makeObservable(this, {
            currentModelPath: observable,
            featuredModelsFilePath: observable,
            dark: observable,
            isLoggedIn: observable,
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
    setIsLoggedIn(newState: boolean) {
        this.isLoggedIn = newState
    }

}

const viewerState = new ViewerState('https://opensim-viewer-public-download.s3.us-west-2.amazonaws.com/double_pendulum.gltf', '/builtin/featured-models.json', false, false)

export default viewerState
