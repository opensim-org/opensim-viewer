  /** download GLTF file for Model nodes */
  const downloadFile = (modelPath: string) => {
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = modelPath;
    a.download = modelPath.split('/').pop() || 'model.gltf';

    // Simulate a click on the anchor element to trigger the download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


export default downloadFile;