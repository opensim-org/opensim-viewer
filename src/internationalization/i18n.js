import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector'

i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        fallbackLng: 'en',
        lng: 'en',
        resources: {
            en: {
                translation: {
                    welcome_title: "OpenSim Online Viewer",
                    viewer: "Viewer",
                    models: "Models",
                    app: {
                        switch_landscape: "Please switch to landscape mode for a better experience."
                    },
                    dropFile: {
                        unsuportedTypes_one: "The file has an unsupported type. Accepted file types are: {{file_formats}}",
                        unsuportedTypes_other: "One or more files have unsupported types. Accepted file types are: {{file_formats}}",
                        dragAndDropMessage: "Drag and drop your files, or click here to select files.",
                        uploadCompleted_one: "File Uploaded.",
                        uploadCompleted_other: "Files Uploaded.",
                        progress: "Progress: {{percentage}}%",
                        removeFiles_one: "Remove File",
                        removeFiles_other: "Remove Files",
                        uploading_files: "Uploading Files...",
                    },
                    modelList: {
                        moreInfo: "More Info",
                        by: "By",
                        modelGalleryTitle: "Model Gallery"
                    },
                    modelView: {
                        file: "File",
                        sceneTree: "Scene Tree View",
                        visualizationControl: "Layers View",
                        share: "Share",
                        record: "Record",
                        animation: "Animation"
                    },
                    topBar: {
                        switchTheme: "Switch Theme",
                        info: "Info",
                        logIn: "Log In",
                        logOut: "Log Out",
                        viewer: "Viewer",
                        models: "Models",
                        enterFullScreen: "Enter Fullscreen",
                        exitFullScreen: "Exit Fullscreen"
                    },
                    bottomBar: {
                        autoRotate: "Auto-rotate",
                        zoomIn: "Zoom In",
                        zoomOut: "Zoom Out",
                        measure: "Measure",
                        annotate: "Annotate",
                        snapshot: "Snapshot",
                        fit: "Fit Model",
                        record: "Record",
                        camera: "Camera"
                    },
                    login: {
                        title: "Login",
                        loginButton: "Login",
                        username: "Username",
                        password: "Password",
                        loginError: 'An error occurred during login.',
                        notSignedUp: 'Don\'t have an account? Register here.'
                    },
                    logout: {
                        success: "You have successfully logged out.",
                        mainPage: "Go back to main page.",
                        logoutError: 'An error occurred during logout.',
                    },
                    register: {
                        title: 'Sign Up',
                        registerButton: "Sign Up",
                        firstName: 'First Name',
                        lastName: 'Last Name',
                        email: 'Email',
                        username: 'Username',
                        password: 'Password',
                        registerError: 'An error occurred during sign up.',
                        alreadySignedUp: 'Already have an account? Go to Login.'
                    },
                    fileView: {
                        importFile: 'Import File',
                        downloadGLTFFile: 'Download GLTF file',
                    },
                    visualizationControl: {
                        animate: "Animate",
                        visibility: "Visible Layers",
                        wcs: "WCS",
                        wcsTooltip: "World Coordinate System",
                        joints: "Joints",
                        bodies: "Bodies",
                        wrapObjects: "WrapObjects",
                        contactObjects: "Contacts",
                        markers: "Markers",
                        speed: "Speed"
                    },
                    shareView: {
                        share: "Share",
                        shareOnTwitter: "Share on Twitter",
                        twitterShareText: "Check out my OpenSim model at: ",
                        shareOnFacebook: "Share on Facebook",
                        shareOnLinkedIn: "Share on LinkedIn"
                    },
                    recordView: {
                        output_format_video: "Video Format",
                        output_format_image: "Image Format",
                        video_name_label: "Video Name",
                        image_name_label: "Image Name",
                        video_default_name: "opensim-viewer-video",
                        image_default_name: "opensim-viewer-snapshot"
                    },
                    snackbars: {
                        recording_video: "Recording Video...",
                        processing_video: "Processing video...",
                        no_animation_selected: "Select an animation to record."
                    },
                    floatingButton: {
                        model_info: "Model info",
                    },
                    contextMenu: {
                        add_camera: "Add Camera",
                        add_light: "Add Light",
                        remove_node: "Remove Node",
                        remove_confirmation_text: "Are you sure you want to remove this node?",
                        remove_confirmation: "Remove",
                        remove_cancel: "Cancel"
                    },
                    captureSnapshotOptions: {
                        capture_snapshot_title: "Take a Snapshot",
                        size: "Size",
                        default_size: "Default Size",
                        custom_size: "Custom Size",
                        width: "Width",
                        height: "Height",
                        preserve_aspect_ratio: "Preserve Aspect Ratio",
                        make_background_transparent: "Make Background Transparent",
                        capture: "Capture",
                        cancel: "Cancel"
                    },
                    captureVideoOptions: {
                        capture_video_title: "Record a Video",
                        video_format: "Video Format",
                        quality_level: "Quality Level",
                        aspect_ratio: "Aspect Ratio",
                        fps: "FPS",
                        capture: "Record",
                        cancel: "Cancel"
                    },
                    nodeSettingsPanel: {
                        selected_node_title: "{{title}} Settings",
                        select_node: "Select a node to show its settings…",
                        reserved_word_warning: "{{value}} is a reserved word. Please, use a different name.",
                        name: "Name",
                        lightSettings: {
                          color: "Color",
                          intensity: "Intensity",
                          angle_rad: "Angle (rad)",
                          distance: "Distance",
                          penumbra: "Penumbra",
                          cast_shadow: "Cast Shadow"
                        },
                        cameraSettings: {
                          field_of_view: "Field of View (°)"
                        },
                        floorSettings: {
                          height: "Height",
                          texture: "Texture",
                          round_floor: "Circular Floor"
                        },
                        backgroundSettings: {
                          color: "Color",
                        },
                        locationSettings: {
                          transform: "Transforms",
                          position_x: "Position X",
                          position_y: "Position Y",
                          position_z: "Position Z",
                          rotation_x: "Rotation X (°)",
                          rotation_y: "Rotation Y (°)",
                          rotation_z: "Rotation Z (°)",
                        }
                    },
                    addCameraDialog: {
                      add_camera_from_view: "Add Camera from Current View",
                      camera_name: "Name",
                      cancel: "Cancel",
                      add_camera: "Add Camera"
                    },
                    addLightDialog: {
                      add_new_light: "Add New Light Source",
                      light_name: "Name",
                      light_type: "Type",
                      cancel: "Cancel",
                      add_light: "Add Light"
                    }
                }
            },
            es: {
                translation: {
                    welcome_title: "OpenSim Online Viewer",
                    viewer: "Visor",
                    models: "Modelos",
                    app: {
                        switch_landscape: "Por favor, cambie a modo paisaje para una mejor experiencia."
                    },
                    dropFile: {
                        unsuportedTypes_one: "No se soporta el formato del archivo. Los formatos soportados son: {{file_formats}}",
                        unsuportedTypes_other: "No se soporta el formato de uno o mas archivos. Los formatos soportados son: {{file_formats}}",
                        dragAndDropMessage: "Arrastra y suelta tus archivos, o haz click aquí para seleccionar archivos.",
                        uploadCompleted_one: "Archivo Subido.",
                        uploadCompleted_other: "Archivos Subidos.",
                        progress: "Progreso: {{percentage}}%",
                        removeFiles_one: "Eliminar Archivo",
                        removeFiles_other: "Eliminar Archivos",
                        uploading_files: "Subiendo Archivos..."
                    },
                    modelList: {
                        moreInfo: "Mas Información",
                        by: "Por",
                        modelGalleryTitle: "Galería de Modelos"
                    },
                    modelView: {
                        file: "Archivo",
                        sceneTree: "Árbol de Escena",
                        visualizationControl: "Vista de Capas",
                        share: "Compartir",
                        record: "Grabación"
                    },
                    topBar: {
                        switchTheme: "Cambiar Tema",
                        info: "Info",
                        logIn: "Log In",
                        logOut: "Log Out",
                        viewer: "Visualizador",
                        models: "Modelos",
                        enterFullScreen: "Entrar Pantalla Completa",
                        exitFullScreen: "Salir Pantalla Completa"
                    },
                    bottomBar: {
                        autoRotate: "Auto-rotar",
                        zoomIn: "Acercar",
                        zoomOut: "Alejar",
                        measure: "Medir",
                        annotate: "Anotar",
                        snapshot: "Capturar Pantalla",
                        fit: "Encajar Modelo",
                        record: "Grabar",
                        camera: "Cámara"
                    },
                    login: {
                        title: "Iniciar Sesión",
                        loginButton: "Iniciar Sesión",
                        username: "Nombre de Usuario",
                        password: "Contraseña",
                        loginError: 'Se produjo un error al iniciar sesión.',
                        notSignedUp: '¿No tienes una cuenta? Registrate aquí.'
                    },
                    logout: {
                        success: "Las sesión se cerró correctamente.",
                        mainPage: "Volver a la página principal.",
                        logoutError: 'Se produjo un error al cerrar sesión.'
                    },
                    register: {
                        title: "Registrarse",
                        registerButton: "Registrarse",
                        firstName: 'Nombre',
                        lastName: 'Apellido',
                        email: 'Email',
                        username: "Nombre de Usuario",
                        password: "Contraseña",
                        registerError: 'Se produjo un error al iniciar sesión.',
                        alreadySignedUp: '¿Ya tienes una cuenta? Inicia sesión aquí.'
                    },
                    fileView: {
                        importFile: 'Importar Archivo',
                        downloadGLTFFile: 'Descargar Archivo GLTF'
                    },
                    visualizationControl: {
                        animate: "Animar",
                        visibility: "Capas Visibles",
                        wcs: "SCM",
                        wcsTooltip: "Sistema de Coordenadas de Mundo",
                        joints: "Articulaciones",
                        bodies: "Cuerpos",
                        wrapObjects: "Envolturas",
                        contactObjects: "Contactos",
                        markers: "Marcadores",
                        speed: "Velocidad"
                    },
                    shareView: {
                        share: "Compartir",
                        shareOnTwitter: "Compartir en Twitter",
                        twitterShareText: "Mira mi modelo de OpenSim!: ",
                        shareOnFacebook: "Compartir en Facebook",
                        shareOnLinkedIn: "Compartir en LinkedIn"
                    },
                    recordView: {
                        output_format_video: "Formato de Vídeo",
                        output_format_image: "Formato de Imagen",
                        video_name_label: "Nombre de Vídeo",
                        image_name_label: "Nombre de Imagen",
                        video_default_name: "opensim-viewer-video",
                        image_default_name: "opensim-viewer-captura"
                    },
                    snackbars: {
                        recording_video: "Grabando Video...",
                        processing_video: "Procesando video..."
                    },
                    floatingButton: {
                        model_info: "Info modelo",
                    },
                    contextMenu: {
                        add_camera: "Añadir Cámara",
                        add_light: "Añadir Luz",
                        remove_node: "Eliminar Nodo",
                        remove_node: "Eliminar Nodo",
                        remove_confirmation_text: "¿Seguro que quieres eliminar ese nodo?",
                        remove_confirmation: "Eliminar",
                        remove_cancel: "Cancelar"
                    },
                    captureSnapshotOptions: {
                        capture_snapshot_title: "Captura de Pantalla",
                        size: "Tamaño",
                        default_size: "Tamaño predeterminado",
                        custom_size: "Tamaño personalizado",
                        width: "Ancho",
                        height: "Alto",
                        preserve_aspect_ratio: "Conservar Relación de Aspecto",
                        make_background_transparent: "Hacer Fondo Transparente",
                        capture: "Capturar",
                        cancel: "Cancelar"
                    },
                    captureVideoOptions: {
                        capture_video_title: "Grabar Video",
                        video_format: "Formato de Video",
                        quality_level: "Nivel de Calidad",
                        aspect_ratio: "Relación de Aspecto",
                        fps: "FPS",
                        capture: "Grabar",
                        cancel: "Cancelar"
                    },
                    nodeSettingsPanel: {
                        selected_node_title: "Parámetros de {{title}}",
                        select_node: "Selecciona un nodo para mostrar su configuración…",
                        reserved_word_warning: "{{value}} es una palabra reservada. Por favor, usa un nombre diferente.",
                        name: "Nombre",
                        lightSettings: {
                          color: "Color",
                          intensity: "Intensidad",
                          angle_rad: "Ángulo (rad)",
                          distance: "Distancia",
                          penumbra: "Penumbra",
                          cast_shadow: "Produce Sombra"
                        },
                        cameraSettings: {
                          field_of_view: "Campo de Visión (°)"
                        },
                        floorSettings: {
                          height: "Altura",
                          texture: "Textura",
                          round_floor: "Suelo Circular"
                        },
                        backgroundSettings: {
                          color: "Color",
                        },
                        locationSettings: {
                          transform: "Ubicación",
                          position_x: "Posición X",
                          position_y: "Posición Y",
                          position_z: "Posición Z",
                          rotation_x: "Rotación X (°)",
                          rotation_y: "Rotación Y (°)",
                          rotation_z: "Rotación Z (°)",
                        }
                    },
                    addCameraDialog: {
                      add_camera_from_view: "Añadir Camara en Posición Actual",
                      camera_name: "Nombre",
                      cancel: "Cancelar",
                      add_camera: "Añadir Camara"
                    },
                    addLightDialog: {
                      add_new_light: "Añadir Nueva Fuente de Luz",
                      light_name: "Nombre",
                      light_type: "Tipo",
                      cancel: "Cancelar",
                      add_light: "Añadir Luz"
                    }
                }
            }
        }
})
