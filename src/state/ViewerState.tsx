import { makeObservable, observable, action } from 'mobx'

class ViewerState {
    currentModelPath: string
    featuredModelsFilePath: string
    dark: boolean
    isLocalUpload: boolean
    isLoggedIn: boolean
    isFullScreen: boolean
    snapshotName: string
    snapshotFormat: string
    recordedVideoName: string
    recordedVideoFormat: string
    isRecordingVideo: boolean
    isProcessingVideo: boolean
    isGuiMode: boolean
    user_uuid: string

    constructor(
        currentModelPathState: string,
        featuredModelsFilePathState: string,
        darkState: boolean,
        isLocalUploadState: boolean,
        isLoggedInState: boolean,
        isFullScreenState: boolean,
        snapshotName: string,
        snapshotFormat: string,
        recordedVideoName: string,
        recordedVideoFormat: string,
        isRecordingVideo: boolean,
        isGuiMode: boolean,
        isProcessingVideo: boolean
    ) {
        this.currentModelPath = currentModelPathState
        this.featuredModelsFilePath = featuredModelsFilePathState
        this.dark = darkState
        this.isLocalUpload = isLocalUploadState
        this.isLoggedIn = isLoggedInState
        this.isFullScreen = isFullScreenState
        this.snapshotName = snapshotName
        this.snapshotFormat = snapshotFormat
        this.recordedVideoName = recordedVideoName
        this.recordedVideoFormat = recordedVideoFormat
        this.isRecordingVideo = isRecordingVideo
        this.isGuiMode = isGuiMode
        this.isProcessingVideo = isProcessingVideo
        this.user_uuid = ''
        makeObservable(this, {
            currentModelPath: observable,
            featuredModelsFilePath: observable,
            dark: observable,
            isLocalUpload: observable,
            isLoggedIn: observable,
            isFullScreen: observable,
            setCurrentModelPath: action,
            setFeaturedModelsFilePath: action,
            setSnapshotName: action,
            setSnapshotFormat: action,
            setRecordedVideoName: action,
            setRecordedVideoFormat: action,
            setIsLoggedIn: action,
            snapshotName: observable,
            snapshotFormat: observable,
            recordedVideoName: observable,
            recordedVideoFormat: observable,
            isRecordingVideo: observable,
            isGuiMode: observable,
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
    setIsLocalUpload(newState: boolean) {
      this.isLocalUpload = newState
    }
    setIsLoggedIn(newState: boolean) {
        this.isLoggedIn = newState
        if (this.isLoggedIn){
            // Cache user_uuid until logout
            const userName = localStorage.getItem('CognitoIdentityServiceProvider.6jlm2jeibh9aqb0dg34q2uf8pu.LastAuthUser');
            const storedDataString = localStorage.getItem('CognitoIdentityServiceProvider.6jlm2jeibh9aqb0dg34q2uf8pu.'+userName+'.userData');
              if (storedDataString != null) {
                let storedData = JSON.parse(storedDataString);
                storedData["UserAttributes"].forEach((element:any) => {
                  if (element["Name"] === "sub") {
                    this.user_uuid = element["Value"];
                  }
                });
              }
        }
    }
    setIsFullScreen(newState: boolean) {
      this.isFullScreen = newState
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
    setIsGuiMode(newState: boolean) {
      this.isGuiMode = newState
    }
    setIsRecordingVideo(newState: boolean) {
        this.isRecordingVideo = newState
    }
}

const viewerState = new ViewerState('/builtin/arm26_elbow_flex.gltf', '/builtin/featured-models.json', false, false, false, false, "opensim-viewer-snapshot", 'png', "opensim-viewer-video", 'mp4', false, false, false)

export default viewerState
