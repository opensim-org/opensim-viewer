// Get host name. If the url is "http://localhost:3000/path/" this will return "localhost".
export function getHostName() {
    return window.location.hostname;
}

// Get host name. If the url is "http://localhost:3000/path/" this will return "http".
export function getProtocol() {
    return window.location.protocol;
}

// Get host name. If the url is "http://localhost:3000/path/" this will return "3000".
export function getPort() {
    return window.location.port;
}

// Get host name. If the url is "http://localhost:3000/path/" this will return "http://localhost:3000/path".
export function getCurrentFullURL() {
    return window.location.href;
}

// Get host name. If the url is "http://localhost:3000/path/" this will return "path".
export function getPathName() {
    return window.location.pathname;
}

// Get host name. If the url is "http://localhost:3000/path/" this will return "http://localhost:3000".
export function getFrontendOrigin() {
    return window.location.origin;
}

// Get host name. If the url is "http://localhost:3000/path/", ant the server url is in the same host,
// this will return "http://localhost:8000", with the port set by the developer.
export function getBackendOrigin() {
    return getProtocol() + "//" + getHostName() + ":8000"
}

// Get a specific backend url, the path is set by user.
export function getBackendURL(path:string) {
    return getBackendOrigin() + "/" + path
}