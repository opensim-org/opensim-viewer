import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Link from '@mui/material/Link';
import { Canvas } from '@react-three/fiber'
import { useTheme } from '@mui/material'
import { GizmoHelper, GizmoViewport, Bounds, Environment } from '@react-three/drei'
import Typography from '@mui/material/Typography';

import OpenSimControl from '../OpenSimControl';
import OpenSimModel from '../OpenSimModel';
import { ModelMetadataType } from './ModelListPage';

interface GridListProps {
    modelMetadata: ModelMetadataType[];
}

const GridList = ({ modelMetadata }: GridListProps) => {

    const theme = useTheme();
    return (
      <Grid container spacing={2}>
        {modelMetadata.map((element) => (
          <Grid key={element.id} xs={12} md={4} component="div">
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div id="canvas-container">
                <Canvas gl={{ preserveDrawingBuffer: true }} shadows 
                    style={{ width: "100%", height: "40vh" }}
                    camera={{ position: [1500, 2000, 1000], fov: 75, far: 10000}}>
                  <color attach="background" 
                      args={(theme.palette.mode==='dark')?['#151518']:['#cccccc']} />
                  <directionalLight position={[1500, 2000, 1000]} intensity={0.05} shadow-mapSize={128} castShadow />
                  <Bounds fit clip>
                    <OpenSimModel modelPath={element.path}/>
                  </Bounds>
                  <Environment preset='city' />
                  <GizmoHelper alignment="bottom-right" margin={[50, 50]}>
                    <GizmoViewport labelColor="white" axisHeadScale={1} />
                  </GizmoHelper>
                  <OpenSimControl />
                </Canvas>
              </div>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {element.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{textAlign: 'left'}}>
                  {element.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{textAlign: 'left', width: '60%', margin: "1em"}}><strong>By </strong>{element.author}</Typography>
                <Link href="#" variant="subtitle2" sx={{textAlign: 'right', margin: "1em"}}>
                  More Info
                </Link>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
export default GridList;