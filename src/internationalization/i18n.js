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
                    dropFile: {
                        unsuportedTypes_one: "The file has an unsupported type. Accepted file types are: {{file_formats}}",
                        unsuportedTypes_other: "One or more files have unsupported types. Accepted file types are: {{file_formats}}",
                        dragAndDropMessage: "Drag and drop your files, or click here to select files.",
                        uploadCompleted_one: "File Uploaded.",
                        uploadCompleted_other: "Files Uploaded.",
                        progress: "Progress: {{percentage}}%",
                        removeFiles_one: "Remove File",
                        removeFiles_other: "Remove Files"
                    },
                    modelList: {
                        moreInfo: "More Info",
                        by: "By",
                        modelGalleryTitle: "Model Gallery"
                    },
                    topBar: {
                        switchTheme: "Switch Theme",
                        info: "Info",
                        share: "Share",
                        shareOnTwitter: "Share on Twitter",
                        logIn: "Log In",
                        logOut: "Log Out"
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
                    }
                }
            },
            es: {
                translation: {
                    viewer: "Visor",
                    models: "Modelos",
                    dropFile: {
                        unsuportedTypes_one: "No se soporta el formato del archivo. Los formatos soportados son: {{file_formats}}",
                        unsuportedTypes_other: "No se soporta el formato de uno o mas archivos. Los formatos soportados son: {{file_formats}}",
                        dragAndDropMessage: "Arrastra y suelta tus archivos, o haz click aquí para seleccionar archivos.",
                        uploadCompleted_one: "Archivo Subido.",
                        uploadCompleted_other: "Archivos Subidos.",
                        progress: "Progreso: {{percentage}}%",
                        removeFiles_one: "Eliminar Archivo",
                        removeFiles_other: "Eliminar Archivos"
                    },
                    modelList: {
                        moreInfo: "Mas Información",
                        by: "Por",
                        modelGalleryTitle: "Galería de Modelos"
                    },
                    topBar: {
                        switchTheme: "Cambiar Tema",
                        info: "Info",
                        share: "Compartir",
                        shareOnTwitter: "Compartir en Twitter",
                        logIn: "Log In",
                        logOut: "Log Out"
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
                    }
                }
            }
        }
})