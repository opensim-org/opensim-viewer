"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
from pygltflib import *
import numpy as np
import json
from pathlib import Path
from .openSimData2Gltf import *
from .convertOsim2Gltf import *
import zipfile

# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],
# "animations refer to channels and samplers"


def convertOsimZip2Gltf(osimzFilePath) :
    path = Path(osimzFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())
    folderName = osimzFilePath.replace('.osimz', '/')
    with zipfile.ZipFile(osimzFilePath, 'r') as zip_ref:
        zip_ref.extractall(folderName)
    viewerSpecFolder = locateFolderContainingFile(folderName, 'opensim-viewer.json')
    # Assume OpenCap Layout
    if (viewerSpecFolder is not None):
        viewerSpecFile = os.path.join(viewerSpecFolder, 'opensim-viewer.json')
        jsonPath = Path(viewerSpecFile)
        with jsonPath.open() as f:
            data = json.load(f)
        sceneInfo = data['scene']
        # cycle thru sceneInfo get models and motions
        mdlWithMotions = sceneInfo[0]['model']
        osimFile = mdlWithMotions['osimFile']
        fullOsimPath = os.path.join(viewerSpecFolder, osimFile)
        motions = mdlWithMotions['motionFiles']
        for motIndex in range(len(motions)):
            motions[motIndex] = os.path.join(viewerSpecFolder, motions[motIndex])
        geometryFolder = os.path.join(viewerSpecFolder, 'OpenSimData/Model/Geometry')
        gltfJson = convertOsim2Gltf(fullOsimPath, geometryFolder, motions)
        
        return gltfJson

def locateFolderContainingFile(folderName, searchForFile):
    for dirpath, dirnames, filenames in os.walk(folderName):
        if (searchForFile in filenames):
            return dirpath
    return None
