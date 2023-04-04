
import { OrbitControls } from '@react-three/drei';

interface ControlProps {
    autoRotate: boolean;

};
function OpenSimControl(props: ControlProps) {
    if (props.autoRotate)
       return <OrbitControls autoRotate makeDefault />
    else
        return <OrbitControls makeDefault />
}

export default OpenSimControl;