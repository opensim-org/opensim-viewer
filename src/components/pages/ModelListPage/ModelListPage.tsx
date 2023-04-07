import React from 'react';

import Typography from '@mui/material/Typography';

import ResponsiveContainer from '../../ResponsiveContainer/ResponsiveContainer';
import GridList from './GridList';

type ModelMetadataType = {
  id: number;
  name: string;
  description: string;
  author: string;
  image: string;
  path: string;
  link: string;
  license: string;
  licenseLink: string;
}  

// TODO: Hardcoded data. At some point data should be retrieved from elsewhere, maybe a database or a storage system, cached,
//       and passed to ModelListPage.
const data:ModelMetadataType[] = [
  {
    id: 1,
    name: 'Arm26',
    description: 'A right upper extremity model with 2 degrees of freedom and 6 muscles. This is a simplified model of the extremity, intended primarily for education and demonstrations.',
    author: 'Jeff Reinbolt, Ajay Seth, Sam Hamner and Ayman Habib',
    image: '/builtin/images/arm26.png',
    path: '/builtin/arm26.gltf',
    link: '',
    license: 'CC BY 3.0',
    licenseLink: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 2,
    name: 'Gait10dof',
    description: 'Trunk, pelvis and leg segments. 10 degrees of freedom, 18 muscles. This model is a simplified model focused on the lower extremity. It demonstrates the use of the new Millard muscles in OpenSim. It is intended for education, demonstration, and for initial prototyping of simulations when fast simulation times are needed.',
    author: 'Ajay Seth, Darryl Thelen, Frank C. Anderson and Scott L. Delp',
    image: '/builtin/images/gait10dof.png',
    path: '/builtin/gait10dof.gltf',
    link: '',
    license: 'CC BY 3.0',
    licenseLink: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 3,
    name: 'Leg39_nomusc',
    description: 'Pelvis and leg segments. 3 degrees of freedom, 9 muscles. This is a simplified model of the extremity, intended primarily for education and demonstrations.',
    author: '',
    image: '/builtin/images/leg39_nomusc.png',
    path: '/builtin/leg39_nomusc.gltf',
    link: '',
    license: 'CC BY 3.0',
    licenseLink: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 4,
    name: 'Pendulum',
    description: 'A double pendulum, formed by two bodies, with two degrees of freedom.',
    author: 'Ajay Seth',
    image: '/builtin/images/pendulum.png',
    path: '/builtin/pendulum.gltf',
    link: '',
    license: 'CC BY 3.0',
    licenseLink: 'https://creativecommons.org/licenses/by/3.0/'
  },
];

interface ModelListPageProps {
    modelPath: string;
}
  
const ModelListPage: React.FC<ModelListPageProps> = ({ modelPath }) => {
  return (
      <>
          <Typography variant="h3" style={{ marginTop: 100, marginBottom: 100}} > Model Gallery </Typography>

          <ResponsiveContainer>
            <GridList modelMetadata={data}/>
          </ResponsiveContainer>
      </>
  );
}
export default ModelListPage;
export type { ModelMetadataType };