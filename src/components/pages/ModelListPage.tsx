import * as React from 'react';
import { experimentalStyled as styled } from '@mui/material/styles';

import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const models= [ "Arm26.osim", "Pendulum.osim", "leg39.osim", "gait2354.osim", "gait2392.osim", "Rajagopal.osim"];

export default function ModelListPage() {
  return (
      <>
          <Typography variant="h3" style={{ marginTop: 100 }} > Model Gallery </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
              {Array.from(Array(6)).map((_, index) => (
                  <Grid xs={2} sm={4} md={4} key={index}>
                      <Item>{models[index]}</Item>
                  </Grid>
              ))}
          </Grid>
      </>
  );
}
