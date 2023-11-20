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
# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],


def convertMotForce2Gltf(motFilePath, shape) :
    path = Path(motFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    table = osim.TimeSeriesTable(motFilePath)
    timeSeriesTableVec3 = table.packVec3()
    # osim.STOFileAdapterVec3.write(timeSeriesTableVec3, 'packedForcesOnly.sto')
    labels = timeSeriesTableVec3.getColumnLabels()
    # Based on column labels and assuming grouping was done properly by .pack call
    # Will add entry for force_point pair of columns with common prefix
    forcesDictionary = dict()
    createForceDictionary(labels, forcesDictionary)

    if (len(forcesDictionary.keys())==0) :
       raise  IndexError("Input file has no forces or labels not following OpenSim convention.", table)
    numDataFrames = timeSeriesTableVec3.getNumRows()
    if numDataFrames==0:
        raise IndexError("Input file has no data", table)
    # Units
    unitConversionToMeters = 1.0
    scaleData = False
    if (table.hasTableMetaDataKey("Units")) :
        unitString = table.getTableMetaDataString("Units")
        if (unitString=="mm"):
            unitConversionToMeters = .001
            scaleData = True
    else:
        print("File has no Units specifications, NMS assumed.")

    forceScale = getForceMeshScale()
    firstDataFrame = timeSeriesTableVec3.getRowAtIndex(0)
    gltf = initGltf()

    # create node for the force mesh, refer to it from all force nodes
    topNode = Node()
    topNode.name = 'ForceData'
    gltf.nodes.append(topNode)
    # make children exclusively be node 0
    sceneNodes = gltf.scenes[0].nodes
    sceneNodes.append(0) # ForceData topNode
    sceneNodeIndex = len(sceneNodes)
    if (shape == None): #if  unspecified forces default to arrow
       shape = 'arrow'

    # Create nodes for the experimental forces, 1 node per force
    firstNodeIndex = createForceNodes(shape, forcesDictionary, unitConversionToMeters, scaleData, forceScale, firstDataFrame, gltf, topNode)
    convertForcesTableToGltfAnimation(gltf, timeSeriesTableVec3, unitConversionToMeters, forcesDictionary, firstNodeIndex)
    return gltf


# def main():
#     import argparse

#     ## Input parsing.
#     ## =============
#     parser = argparse.ArgumentParser(
#         description="Generate a gltf file corresponding to the passed in trc file.")
#     # Required arguments.
#     parser.add_argument('mot_file_path',
#                         metavar='motfilepath', type=str,
#                         help="filename for trc file (including path).")
#     parser.add_argument('--shape', type=str,
#                         help="Pick shape to use for displaying forces.")
#     parser.add_argument('--output', type=str,
#                         help="Write the result to this filepath. "
#                              "Default: the report is named "
#                              "<mot_file_path>.gltf")
#     args = parser.parse_args()
#     # print(args)
#     infile = args.mot_file_path
#     if (args.output == None) :
#         outfile = infile.replace('.mot', '.gltf')
#     else:
#         outfile = args.output
    
#     resultGltf = convertMotForce2Gltf(infile, args.shape)
#     resultGltf.save(outfile)

# main()