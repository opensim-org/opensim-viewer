import { OrbitControls } from '@react-three/drei'
import { observer } from 'mobx-react'
import viewerState from '../../state/ViewerState'

function OpenSimControl() {
    //console.log(viewerState.rotating);
    return <OrbitControls autoRotate autoRotateSpeed={viewerState.rotating ? 2 : 0.0} makeDefault />
}

export default observer(OpenSimControl)
