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
                        snapshoot: "Snapshoot",
                        record: "record",
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
                        processing_video: "Processing video..."
                    },
                    floatingButton: {
                        model_info: "Model info.",
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
                        snapshoot: "Instantánea",
                        record: "Grabar",
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
                        model_info: "Info modelo.",
                    }
                }
            }
        }
})
