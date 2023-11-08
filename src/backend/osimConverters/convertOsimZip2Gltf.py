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
    else: #Assume OpenCap layout, 1 model, separate kinemtics mot files, no other data
        rootFolder = locateFolderContainingFile(folderName, 'sessionMetadata.yaml')
        modelFile = locateOsimFile(rootFolder)
        motionFiles = locateFiles(rootFolder, '.mot')
        # trcFiles = locateFiles(rootFolder, '.trc')
        gltfJson = convertOsim2Gltf(modelFile, 'Geometry', motionFiles)

        return gltfJson

def locateFolderContainingFile(folderName, searchForFile):
    for dirpath, dirnames, filenames in os.walk(folderName):
        if (searchForFile in filenames):
            return dirpath
    return None

def locateOsimFile(folderName):
    for dirpath, dirnames, filenames in os.walk(folderName):
        for fileSpec in filenames:
            if (fileSpec.endswith('.osim')):
                return os.path.join(dirpath, fileSpec)
    return None

def locateFiles(folderName, extension):
    foundFiles = []
    for dirpath, dirnames, filenames in os.walk(folderName):
        for fileSpec in filenames:
            if (fileSpec.endswith(extension)):
                foundFiles.append(os.path.join(dirpath, fileSpec))
    return foundFiles