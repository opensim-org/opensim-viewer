import React, { useState, useRef, useEffect } from 'react';

import { Container, Button  } from '@mui/material'

import ChartJSWrapper from "chartjs-wrapper"

import { ThemeProvider, CssBaseline } from '@mui/material'
import lightTheme from '../../LightTheme'

// I provide this as an example, but we should adapt this to the real data and allow users to change some options
// (like title, data shown, maybe colors and font properties...) in the GUI.
const Chart = () => {
    // Reference to the chart wrapper element.
    const chartRef = useRef(null);

    // Instance of the specific chart retrieved from the chart ref.
    const chartInstance = chartRef.current as any;

    // State to start/stop vertical bar.
    const [isAnimationRunning, setIsAnimationRunning] = useState(true);

    // Duration of animation for the annotation plugin, that must be the same of update speed for annotationX. In this
    // case, since I am updating it in the useRef using a interval, this is the interval duration.
    const animationDuration = 100

    // Example of annotation that can be used as vertical bar indicating time of animation. The state is used to update
    // the x position.\
    // Documentation and configuration: https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/
    const [annotationX, setAnnotationX] = useState(0);
    const annotation1 = {
        type: 'line',
        xMin: annotationX,
        xMax: annotationX,
        backgroundColor: 'rgba(255, 99, 132, 0.25)'
    }

    // Example of a legend.
    // Documentation and configuration: https://www.chartjs.org/docs/latest/configuration/legend.html
    const legend = {
        display: true,
        labels: {
            color: 'rgb(0, 0, 0)'
        },
        position: 'right',
        align:'center'
    }



    // The following components are plugins to chartjs: title, subtitle, zoom, annotations. Title and subtitle come with
    // chartjs, but zoom and annotation need to be installed separately (the wrapper takes care of it).

    // Example of title.
    // Documentation and configuration: https://www.chartjs.org/docs/latest/configuration/title.html
    const title = {
          display: true,
          text: 'Chart Title',
          font: {
            size: 24,
          }
        }

    // Example of subtitle.
    // Documentation and configuration: https://www.chartjs.org/docs/latest/configuration/subtitle.html
    const subtitle = {
          display: true,
          text: 'Chart Subtitle',
        }

    // Example of annotation plugin (the annotation was defined above).
    // Documentation and configuration: https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/
    const annotationPlugin = {
            animation: {
                duration: animationDuration
            },
            annotations: {
              line1: annotation1,
            }
          }

    // Example of zoom plugin. This configuration allows to zoom in by selecting an area in the chart. The wheel can be
    // used over the axis to zoom in/out over that specific axis. You can move around using ctrl+left-click.be
    // To reset zoom, I added a button. We may need to change controls in phone/tablets.
    // Documentation and configuration: https://www.chartjs.org/chartjs-plugin-zoom/latest/guide/
    const zoomPlugin = {
            pan: {
              enabled: true,
              mode: 'xy',
              modifierKey: 'ctrl',
            },
            zoom: {
              mode: 'xy',
              overScaleMode: 'xy',
              drag: {
                enabled: true,
              },
              wheel: {
                enabled: true,
              }
            }
          }

    // All plugins area added here to the plugins object.
    const plugins = {
        annotation: annotationPlugin,
        legend: legend,
        title: title,
        subtitle: subtitle,
        zoom: zoomPlugin
      }


    // The following components are configuration options. They are added to the options object.
    // Documentation and configuration: https://www.chartjs.org/docs/latest/

    // Animation time of the chart when appearing for first time or modifying things like zoom. This is not the same
    // as the animation time of the annotation plugin.
    const animation = {
        duration: 250
      }

    // Properties about scales. Here I set the Y axis to begin at zero.
    const scales = {
        y: {
          beginAtZero: true,
        },
      }

    // Every configuration option goes here. That includes the plugins.
    const options = {
      animation: animation,
      scales: scales,
      plugins: plugins,
    };


    // The follosing components are related to the data represented in the chart.be

    // Labels for the X axis. This could be numbers if representing time or frames of an animation.
    const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', "September", "October", "November", "December"];

    // Examples of datasets. In this case, I added some random data for each label.
    const dataset1 = {
                label: 'Sample Data', // Name of this dataset.
                data: [65, 59, 80, 81, 56, 55, 40, 23, 34, 22, 53, 33], // Random data to be represented.
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Line fill color
                borderColor: 'rgba(75, 192, 192, 1)', // Line border color
                borderWidth: 1, // Line border width
            }
    const dataset2 = {
                label: 'Sample Data2', // Name of this dataset.
                data: [12, 32, 65, 84, 44, 56, 21, 75, 84, 57, 25, 77], // Random data to be represented.
                backgroundColor: 'rgba(121, 1, 22, 0.2)', // Line fill color
                borderColor: 'rgba(121, 1, 22, 1)', // Line border color
                borderWidth: 1, // Line border width
            }

    // All data to be represented is added to the data object.
    const data = {
        labels: labels,
        datasets: [
            dataset1,
            dataset2
        ],
    };

    // Style of the chart. The
    const style = {
        width: '80vw', // Width of the chart.
        margin: '0 auto', // Center the chart within the container.
        display: 'inline-block' // To allow the element to resize with window size.
    };


    // This useEffect is only here to demonstrate how the annotations can be used to show time over the chart.
    useEffect(() => {
      let interval: NodeJS.Timeout | undefined;

      if (isAnimationRunning) {
        interval = setInterval(() => {
          setAnnotationX((prevX) => (prevX === 11 ? 0 : prevX + 1));
        }, animationDuration);
      }

      return () => {
        clearInterval(interval);
      };
    }, [isAnimationRunning]); // Update the effect when isAnimationRunning changes

    // Start/Stop interval updating the position of the annotation vertical bar.
    const toggleAnimation = () => {
      setIsAnimationRunning((prev) => !prev); // Toggle animation state
    };

    // Reset zoom using the reference to the chart.
    const resetZoom = () => {
        if (chartRef.current) {
            // Reset both the x and y axes to their original scales.
            chartInstance.resetZoom('xy');
        }
    };

    // Note how we pass the chartRef object to the wrapper to get a reference to the chart. We also pass the
    // elements mentioned above to set chart configuration and data.
    return (
        <Container>
          <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <ChartJSWrapper ref={chartRef} type='line' data={data} options={options} style={style}/>
          </ThemeProvider>
          <Button variant="contained" onClick={toggleAnimation}>
              {isAnimationRunning ? 'Stop' : 'Start'}
          </Button>
          <Button variant="contained" onClick={resetZoom}>
              Reset Zoom
          </Button>
        </Container>
    )
}

export default Chart
