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


def convertOsimZip2Gltf(osimzFilePath) :
    path = Path(osimzFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())
    folderName = osimzFilePath.replace('.osimz', '/')
    with zipfile.ZipFile(osimzFilePath, 'r') as zip_ref:
        zip_ref.extractall(folderName)
    viewerSpecFolder = locateFolderContainingFile(folderName, 'opensim-viewer.json')
    if (viewerSpecFolder is None):
        # Try to locate the file sessionMetadata
        sessionFolder = locateFolderContainingFile(folderName, 'sessionMetadata.yaml')
        if (sessionFolder is not None):
            # Create a default opensim-viewer.json
            viewerSpecFolder = createOpenSimViewerJson4OpenCap(sessionFolder)
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
        gltfFile, gltfJson = convertOsim2Gltf(fullOsimPath, geometryFolder, motions)
        
        outfile = osimzFilePath.replace('.osimz', '.gltf')
        gltfJson.save(outfile)
        return outfile

def locateFolderContainingFile(folderName, searchForFile):
    for dirpath, dirnames, filenames in os.walk(folderName):
        if (searchForFile in filenames):
            return dirpath
    return None


def createOpenSimViewerJson4OpenCap(folderName):
    # create dictionary to contain scene spec before writing
    # opensim-viewer.json
    dict = {}
    dict['metadata'] = {'version': 0.1}
    dict['scene'] = []
    animationSpec = {}
    # Not clear if other models are used  TODO make it more general
    animationSpec['osimFile'] = 'OpenSimData/Model/LaiArnoldModified2017_poly_withArms_weldHand_scaled.osim'
    animationSpec['motionFiles'] = [f'OpenSimData/Kinematics/{fil}' for fil in os.listdir(folderName+'/OpenSimData/Kinematics')]
    modelMotionSpec = {}
    modelMotionSpec['model'] = animationSpec
    dict['scene'].append(modelMotionSpec)
    viewerFile = os.path.join(folderName, 'opensim-viewer.json')
    with open(viewerFile, 'w') as outfile:
        json.dump(dict, outfile)
    return folderName