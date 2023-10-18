import { makeObservable, observable, action } from 'mobx'

class ViewerState {
    currentModelPath: string
    featuredModelsFilePath: string
    dark: boolean
    isLoggedIn: boolean
    snapshotName: string
    snapshotFormat: string
    recordedVideoName: string
    recordedVideoFormat: string
    isRecordingVideo: boolean
    isProcessingVideo: boolean

    constructor(
        currentModelPathState: string,
        featuredModelsFilePathState: string,
        darkState: boolean,
        isLoggedInState: boolean,
        snapshotName: string,
        snapshotFormat: string,
        recordedVideoName: string,
        recordedVideoFormat: string,
        isRecordingVideo: boolean,
        isProcessingVideo: boolean
    ) {
        this.currentModelPath = currentModelPathState
        this.featuredModelsFilePath = featuredModelsFilePathState
        this.dark = darkState
        this.isLoggedIn = isLoggedInState
        this.snapshotName = snapshotName
        this.snapshotFormat = snapshotFormat
        this.recordedVideoName = recordedVideoName
        this.recordedVideoFormat = recordedVideoFormat
        this.isRecordingVideo = isRecordingVideo
        this.isProcessingVideo = isProcessingVideo
        makeObservable(this, {
            currentModelPath: observable,
            featuredModelsFilePath: observable,
            dark: observable,
            isLoggedIn: observable,
            setCurrentModelPath: action,
            setFeaturedModelsFilePath: action,
            setSnapshotName: action,
            setSnapshotFormat: action,
            setRecordedVideoName: action,
            setRecordedVideoFormat: action,
            snapshotName: observable,
            snapshotFormat: observable,
            recordedVideoName: observable,
            recordedVideoFormat: observable,
            isRecordingVideo: observable,
            isProcessingVideo: observable,
            setIsProcessingVideo: action,
            setIsRecordingVideo: action,
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
    setSnapshotName(newState: string) {
        this.snapshotName = newState
    }
    setSnapshotFormat(newState: string) {
        this.snapshotFormat = newState
    }
    setRecordedVideoName(newState: string) {
        this.recordedVideoName = newState
    }
    setRecordedVideoFormat(newState: string) {
        this.recordedVideoFormat = newState
    }
    setIsProcessingVideo(newState: boolean) {
        this.isProcessingVideo = newState
    }
    setIsRecordingVideo(newState: boolean) {
        this.isRecordingVideo = newState
    }
}

const viewerState = new ViewerState('/builtin/arm26_elbow_flex.gltf', '/builtin/featured-models.json', false, false, "opensim-viewer-snapshot", 'png', "opensim-viewer-video", 'mp4', false, false)

export default viewerState
