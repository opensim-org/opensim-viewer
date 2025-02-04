import { makeObservable, observable, action } from 'mobx'
import { Color, Vector3 } from 'three'

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
    // scene options
    backgroundColor: Color
    backgroundImage: string | null
    sceneLightPosition: Vector3
    // floor options
    textureIndex: number
    floorVisible: boolean
    floorHeight: number
    // light
    lightIntensity: number
    lightColor: Color
    spotLight: boolean
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
        this.backgroundColor = new Color(0.7, 0.7, 0.7)
        this.backgroundImage = null
        this.textureIndex = 0
        this.floorVisible = true
        this.floorHeight = 0
        this.sceneLightPosition = new Vector3(0.5, 1.5, -0.5)
        this.lightIntensity = 0.25
        this.lightColor = new Color(0.6, 0.6, 0.6)
        this.spotLight = false
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
            floorHeight: observable,
            floorVisible: observable,
            textureIndex: observable,
            setFloorTextureIndex: action,
            backgroundColor: observable,
            setBackgroundColor: action,
            lightIntensity: observable,
            lightColor: observable,
            spotLight: observable,
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
    setLightColor(newColor: Color) {
        this.lightColor = newColor
    }
    setBackgroundColor(newColor: Color) {
        this.backgroundColor = newColor
    }
    setFloorTextureIndex(newIndex: number) {
        this.textureIndex = newIndex
    }
}

const viewerState = new ViewerState('/builtin/leg39.json', '/builtin/featured-models.json', false, false, false, false, "opensim-viewer-snapshot", 'png', "opensim-viewer-video", 'mp4', false, true, false)

export default viewerState
