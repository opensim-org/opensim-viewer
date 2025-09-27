import { makeObservable, observable, action, runInAction } from 'mobx'
import { Color, Vector3, Camera, AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack, PerspectiveCamera, Group, Quaternion, Matrix4 } from 'three'

export class CameraFrame {
    cam_uuid: string
    time: number
    constructor(camera_uuid: string, time: number) {
        this.cam_uuid = camera_uuid
        this.time = time
    }
}

interface CamData {
    object: {
        uuid: string
        name: string
        matrix: number[]
    }
}
export class CameraDolly {
    name: string
    desc: string | null
    cameraFrames: CameraFrame[] 
    constructor(name:string| "", desc:string|null=null){
        this.name = name
        this.desc = desc
        this.cameraFrames = []
    }
    toJSON() {
    return {
      name: this.name,
      // You can transform, rename, or omit fields here
      desc: this.desc,
      cameraFrames: this.cameraFrames.map(frame => ({
        cam_uuid: frame.cam_uuid,
        time: frame.time
      })),
    }
  }

}

export class ViewerState {
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
    user_uuid: string
    // user preferences
    userPreferencesJsonPath: string = ''
    userPreferences: any = null
    // scene options
    backgroundColor: Color
    backgroundImage: string | null
    useTexture: boolean
    sceneLightPosition: Vector3
    // sky options
    skyTextureIndex: number
    defaultSkyTextures: string[]
    skyVisible: boolean
    // floor options
    textureIndex: number
    defaultFloorTextures: string[]
    floorRound: boolean
    floorVisible: boolean
    floorHeight: number
    // light
    lightIntensity: number
    lightColor: Color
    spotLight: boolean
    // toolbar options
    rotating: boolean
    pending_key: string
    // update control
    sceneVersion: number
    // cameras
    cameras: Camera[]
    targets: Vector3[]
    currentCameraIndex: number
    // targets
    lookAtTarget: string
    saveCameraAndTarget: boolean // used to request control save current camera and target to this state
    // camera Animations, sequences, then animations created by interpolating sequences
    cameraDollies: CameraDolly[]
    currentDollyIndex: number
    // Animation support
    animating: boolean
    animationSpeed: number
    animations: AnimationClip[]
    currentAnimationIndex: number
    animationsNeedUpdate: boolean
    animationChange: null | Object
    // Environment holders
    environmentGroup: Group | null
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
        isProcessingVideo: boolean
    ) {
        this.userPreferences = observable({
            skyTexturePath: '',
            floorTexturePath: ''
        });
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
        this.isProcessingVideo = isProcessingVideo
        this.user_uuid = ''
        this.backgroundColor = new Color(0.7, 0.7, 0.7)
        this.backgroundImage = null
        this.useTexture = true
        this.skyTextureIndex = 0
        this.defaultSkyTextures = [
            '/assets/skyTextures/death-valley-alberto.jpg',
            '/assets/skyTextures/San_Carlo_(Grantola)_-_photosphere_of_interior.jpg',
            '/assets/skyTextures/Photosphere_in_Pozzolo_(Domaso)_2.jpg',
            '/assets/skyTextures/Photosphere_VML4_between_Nessa_and_L\'Agnone_01.jpg',
        ]
        this.skyVisible = false
        this.textureIndex = 0
        this.defaultFloorTextures = [
            '/assets/floorTextures/tile.jpg',
            '/assets/floorTextures/wood-floor.jpg',
            '/assets/floorTextures/Cobblestone.png',
            '/assets/floorTextures/cement.jpg',
            '/assets/floorTextures/grassy_d.png'
        ]
        this.floorVisible = true
        this.floorRound = false
        this.floorHeight = 0
        this.sceneLightPosition = new Vector3(0.1, 1.5, -0.5)
        this.lightIntensity = 0.25
        this.lightColor = new Color(1.0, .9, 0.78)
        this.spotLight = false
        this.rotating = false;
        this.pending_key = ""
        this.sceneVersion = 0
        this.cameras = []
        this.targets = []
        this.currentCameraIndex = -1
        this.lookAtTarget = ""
        this.saveCameraAndTarget = false;
        this.cameraDollies = []
        this.currentDollyIndex = -1
        this.animating = false
        this.animationSpeed = 1.0
        this.animations = []
        this.currentAnimationIndex = -1
        this.animationsNeedUpdate = false
        this.animationChange = null
        this.environmentGroup = null
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
            setFloorHeight: action,
            setFloorRound: action,
            snapshotName: observable,
            snapshotFormat: observable,
            recordedVideoName: observable,
            recordedVideoFormat: observable,
            isRecordingVideo: observable,
            userPreferencesJsonPath: observable,
            userPreferences: observable,
            setUserPreferencesJsonPath: action,
            loadUserPreferences: action,
            isProcessingVideo: observable,
            setIsProcessingVideo: action,
            setIsRecordingVideo: action,
            defaultFloorTextures: observable,
            skyVisible: observable,
            skyTextureIndex: observable,
            setSkyTextureIndex: action,
            floorHeight: observable,
            floorRound: observable,
            floorVisible: observable,
            textureIndex: observable,
            setFloorTextureIndex: action,
            backgroundColor: observable,
            setBackgroundColor: action,
            useTexture: observable,
            setUseTexture: action,
            lightIntensity: observable,
            lightColor: observable,
            spotLight: observable,
            setIsLocalUpload: action,
            rotating: observable,
            setRotating: action,
            cameras: observable,
            setCamerasList: action,
            cameraDollies: observable,
            currentDollyIndex: observable,
            setCurrentDollyIndex: action,
            animationSpeed: observable,
            animations: observable,
            setAnimationList: action,
            setAnimationSpeed: action,
            currentCameraIndex: observable,
            setCurrentCameraIndex: action,
            sceneVersion: observable,
            setSceneVersion: action,
            animationsNeedUpdate: observable,
            setAnimationsNeedUpdate: action
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
    setIsRecordingVideo(newState: boolean) {
        this.isRecordingVideo = newState
    }
    setLightColor(newColor: Color) {
        this.lightColor = newColor
    }
    setBackgroundColor(newColor: Color) {
        this.backgroundColor = newColor
    }
    setUseTexture(useTexture: boolean) {
        this.useTexture = useTexture
    }
    setFloorTextureIndex(newIndex: number) {
        this.textureIndex = newIndex
    }
    setFloorHeight(newHeight: number) {
        this.floorHeight = newHeight
    }
    setFloorRound(isRound: boolean) {
      this.floorRound = isRound
    }
    setLightIntensity(newLight: number) {
        this.lightIntensity = newLight
    }
    setSkyTextureIndex(newIndex: number) {
        this.skyTextureIndex = newIndex
        if (newIndex === -1) 
            this.skyVisible = false
        else
            this.skyVisible = true
    }
    setRotating(newState: boolean) {
        this.rotating = newState
    }
    handleKey(key: string) {
        this.pending_key = key
    }
    setUserPreferencesJsonPath(path: string) {
      this.userPreferencesJsonPath = path
    }
    setCamerasList(cameras: Camera[]) {
        this.cameras=cameras
    }
    setCurrentCameraIndex(newIndex: number) {
        this.currentCameraIndex = newIndex
    }
    setCurrentDollyIndex(newIndex: number) {
        this.currentDollyIndex = newIndex
    }
    setLookAtTarget(target_uuid: string) {
      this.lookAtTarget = target_uuid
    }
    addCameraDolly(newSequence:CameraDolly){
        this.cameraDollies.push(newSequence);
        this.animations.push(this.createAnimationClipFromSequence(newSequence));
        this.setCurrentAnimationIndex(this.animations.length - 1);
        this.setCurrentDollyIndex(this.cameraDollies.length - 1);
        this.animationChange = {index:this.currentDollyIndex, operation:"add"};
        this.setAnimationsNeedUpdate(true);

    }
    updateCameraDolly(newSequence:CameraDolly){
        // update entry at  this.currentDollyIndex
        this.cameraDollies.splice(this.currentDollyIndex, 1, newSequence);
        const theClip = this.createAnimationClipFromSequence(newSequence);
        this.animations.splice(this.currentDollyIndex, 1, theClip);
        this.animationChange = {index:this.currentDollyIndex, operation:"update"};
        this.setAnimationsNeedUpdate(true);
    }
    setAnimationList(animations: AnimationClip[]) {
        this.animations=animations
    }
    setAnimationSpeed(newSpeed: number) {
        this.animationSpeed = newSpeed
    }
    setAnimating(newState: boolean){
        this.animating = newState
    }
    setCurrentAnimationIndex(newIndex: number) {
        this.currentAnimationIndex = newIndex
    }
    createAnimationClipFromSequence(newSequence: CameraDolly): AnimationClip {
        const numFrames = newSequence.cameraFrames.length
        const duration = newSequence.cameraFrames[numFrames-1].time
        const positions: number[] = []
        const orientations: number[] = []
        const keyFrameTimes: number[] = []
        for (let i=0; i< newSequence.cameraFrames.length; i++){
            const frame = newSequence.cameraFrames[i]
            const cam = this.cameras.find(cam => cam.uuid === frame.cam_uuid) as Camera;
            cam.position.toArray(positions, 3*i)
            cam.quaternion.toArray(orientations, 4*i)
            keyFrameTimes.push(frame.time)
        }
        // Create 2 keyframetracks one for camera, 2nd for target
        const positionKF = new VectorKeyframeTrack( '.position', keyFrameTimes, positions );
        const orientationKF = new QuaternionKeyframeTrack( '.quaternion', keyFrameTimes, orientations );

        // Create an AnimationClip from saved KeyFrameCameras, add to ui
        return new AnimationClip(newSequence.name!, duration, [positionKF, orientationKF])
    }
    async loadUserPreferences() {
        try {
            const response = await fetch(this.userPreferencesJsonPath);
            if (!response.ok) throw new Error(`Failed to load preferences from ${this.userPreferencesJsonPath}`);
            const data = await response.json();

            runInAction(() => {
                // Update the observable properties
                if (data['sky-texture-path']) {
                    this.userPreferences.skyTexturePath = data['sky-texture-path'];
                }
                if (data['floor-texture-path']) {
                    this.userPreferences.floorTexturePath = data['floor-texture-path'];
                }
            });
        } catch (error) {
            console.error("Error loading user preferences:", error);
        }
    }
    addCamera(camera: PerspectiveCamera, target: Vector3, suggestedName: string | undefined, setCurrent: boolean | undefined = true) {
        const camClone = camera.clone()
        if (suggestedName === undefined) 
            camClone.name = "Camera_"+this.cameras.length
        else
            camClone.name = suggestedName;
        
        this.cameras.push(camClone);
        this.targets.push(target.clone())
        this.environmentGroup?.add(camClone);
        if (setCurrent!== false)
            this.currentCameraIndex = (this.cameras.length - 1);
        this.setSceneVersion(this.sceneVersion +1);
        return camClone;
    }
    deleteCurrentCamera() {
        const idx = this.currentCameraIndex;
        const cam = this.cameras[idx];
        // Remove from scene
        if (cam !== undefined) {
            cam.removeFromParent();
            // remove from cached arrays
            this.cameras.splice(idx, 1);
            this.targets.splice(idx,1);
            // Fix current if needed
            if (idx > this.cameras.length-1) 
                this.setCurrentCameraIndex(this.cameras.length-1)
        }
        this.setSceneVersion(this.sceneVersion +1);
    }    
    deleteCurrentDolly() {
        const idx = this.currentDollyIndex;
        const dolly = this.cameraDollies[idx];
        if (dolly !== undefined) {
            // remove from cached arrays
            this.cameraDollies.splice(idx, 1);
           // Fix current if needed
            if (idx > this.cameraDollies.length-1) 
                this.setCurrentDollyIndex(this.cameraDollies.length-1)
        }
        this.animations.splice(idx, 1);
        if (this.currentAnimationIndex === idx) {
            this.setCurrentAnimationIndex(-1);
        }
        this.animationChange = {index:idx, operation:"delete"};
        this.setAnimationsNeedUpdate(true);
    }
    addDollyAndCameras(newSequenceJson:CameraDolly, camerasJson: any[], targetsJson: any[]) {
        // Add any cameras not already in list
        let mapUuidToCam = new Map<string, Camera>();
        camerasJson.forEach((camData:CamData, index: number) => {
            const data = camData;
            const existing = this.cameras.find(c => c.uuid === data.object.uuid);
            if (!existing) {
                let camera = new PerspectiveCamera();
                camera.name = data.object.name
                camera.matrix.fromArray(data.object.matrix)
                camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
                this.addCamera(camera, new Vector3(targetsJson[index]), camera.name, false);
                mapUuidToCam.set(data.object.uuid, camera);
            }
        });
        // Add the dolly
        const newDolly = new CameraDolly(newSequenceJson.name, newSequenceJson.desc);
        for (let i=0; i<newSequenceJson.cameraFrames.length; i++){
            const frameJson = newSequenceJson.cameraFrames[i];
            const camName = mapUuidToCam.get(frameJson.cam_uuid)?.name
            const cam = this.cameras.find(c => c.name === camName);
            if (cam) {
                const newFrame = new CameraFrame(cam.uuid, frameJson.time);
                newDolly.cameraFrames.push(newFrame);
            }
        }
        this.addCameraDolly(newDolly);
    }
    saveCamerasToJson() {
        const camerasJson = this.cameras.map(cam => ({
            object: {
                uuid: cam.uuid,
                name: cam.name,
                position: cam.position.toArray(),
                rotation: cam.rotation.toArray(),
                scale: cam.scale.toArray()
            }
        }));
        const targetsJson = this.targets.map(tgt => tgt.toArray());
        // For now just log to console
        console.log("Cameras to save:", camerasJson);
        console.log("Targets to save:", targetsJson);
        // Save camerasJson to a file or database
        const jsonSave = {
            cameras: camerasJson,
            targets: targetsJson
        }
        return jsonSave;
    }
    loadCamerasFromFile() {
        // Load camerasJson from a file or database
        const camerasJson: any[] = []; // Replace with actual loading logic
        camerasJson.forEach(camData => {
            const camera = new PerspectiveCamera();
            camera.name = camData.object.name;
            camera.uuid = camData.object.uuid;
            camera.position.fromArray(camData.object.position);
            camera.rotation.fromArray(camData.object.rotation);
            camera.scale.fromArray(camData.object.scale);
            //this.addCamera(camera);
        });
    }
    setEnvironmentGroup(grp: Group) {
        this.environmentGroup = grp;
    }
    setSceneVersion(version: number) {
        this.sceneVersion = version;
    }
    setAnimationsNeedUpdate(needsUpdate: boolean) {
        this.animationsNeedUpdate = needsUpdate;
    }
}

export default ViewerState
