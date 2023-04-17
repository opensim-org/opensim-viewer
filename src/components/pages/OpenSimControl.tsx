import { OrbitControls } from '@react-three/drei'
import { observer } from 'mobx-react'
import viewerState from '../../state/ViewerState'
import { Vector3 } from 'three'
import { useThree } from '@react-three/fiber'

function OpenSimControl() {
    const {
        gl, // WebGL renderer
        camera,
    } = useThree()

    window.addEventListener('keyup', (event) => {
        if (event.code === 'KeyP') {
            // P for print screen
            const link = document.createElement('a')
            link.setAttribute('download', 'viewer_snapshot.png')
            link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
            link.click()
            event.preventDefault()
        }
        if (event.code === 'KeyI') {
            // I for camera zoom in
            let v = new Vector3()
            camera.position.lerp(v.set(1, 0, 0), 0.025)
        }
        if (event.code === 'KeyO') {
            // O for camera zoom out
            let v = new Vector3()
            camera.position.lerp(v.set(1, 0, 0), -0.025)
        }
    })

    //console.log(viewerState.rotating);
    return <OrbitControls autoRotate autoRotateSpeed={viewerState.rotating ? 2 : 0.0} makeDefault />
}

export default observer(OpenSimControl)
