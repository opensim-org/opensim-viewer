
import { OrbitControls } from '@react-three/drei';

interface ControlProps {
    autoRotate: boolean;

};
function OpenSimControl(props: ControlProps) {

    if (props.autoRotate)
       return <OrbitControls autoRotate />
    else
        return <OrbitControls />
}

export default OpenSimControl;