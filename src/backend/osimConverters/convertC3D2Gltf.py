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


def convertC3D2Gltf(c3dFilePath, options) :

    path = Path(c3dFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    adapter = osim.C3DFileAdapter()
    adapter.setLocationForForceExpression(osim.C3DFileAdapter.ForceLocation_CenterOfPressure)
    tables = adapter.read(c3dFilePath)
    markerDataTable = adapter.getMarkersTable(tables)
    hasMarkerData = markerDataTable.getNumRows()>0

      # osim.STOFileAdapter_write(markersFlat, 'markersFlat.sto')
    forcesDataTable = adapter.getForcesTable(tables)
    hasForceData = forcesDataTable.getNumRows()>0
 
    #Underlying assumption here is that .c3d file always has marker data but may not
    # have force data, need to verify this to be the case for OpenSim use cases
    numMarkerFrames = markerDataTable.getNumRows()
    if numMarkerFrames==0:
        raise IndexError("Input file has no data", markerDataTable)
    # instead of creating the GLTF2 structure from scratch and programmatically adding basic
    # shapes (Sphere, Cube, brick, axes, arrows etc.) instead we load a file with these meshes
    # baked in and use these meshes as needed. 
    gltf = initGltf()

    # create node for the marker mesh, refer to it from all marker nodes
    convertMarkersTimeSeries2Gltf(gltf, options.getExperimentalMarkerShape(), markerDataTable)

    # now the forces
    if (hasForceData):
        forcesDictionary = dict()
        labels = forcesDataTable.getColumnLabels()
        createForceDictionary(labels, forcesDictionary)
        if (len(forcesDictionary.keys())>0) :
          forceScale = getForceMeshScale()
          firstForceFrame = forcesDataTable.getRowAtIndex(0)
          topForcesNode = Node()
          topForcesNode.name = 'ForceData'
          gltf.nodes.append(topForcesNode)
          gltf.scenes[0].nodes.append(len(gltf.nodes)-1)
          shape = options.getForceShape()
          unitConversionToMeters = .001
          scaleData = True
          if (forcesDataTable.hasTableMetaDataKey("Units")) :
              unitString = forcesDataTable.getTableMetaDataString("Units")
              if (unitString=="mm"):
                  unitConversionToMeters = .001
                  scaleData = True
          else:
              print("File has no Units specifications, NMS assumed.")

          firstForceIndex = createForceNodes(shape, forcesDictionary, unitConversionToMeters, scaleData, forceScale, firstForceFrame, gltf, topForcesNode)
          convertForcesTableToGltfAnimation(gltf, forcesDataTable, unitConversionToMeters, forcesDictionary, firstForceIndex)

    return gltf

# def main():
#     import argparse

#     ## Input parsing.
#     ## =============
#     parser = argparse.ArgumentParser(
#         description="Generate a gltf file corresponding to the passed in c3d file.")
#     # Required arguments.
#     parser.add_argument('c3d_file_path',
#                         metavar='c3dfilepath', type=str,
#                         help="filename for c3d file (including path).")
#     parser.add_argument('--shape', type=str,
#                         help="Pick shape to use for displaying markers.")
#     parser.add_argument('--output', type=str,
#                         help="Write the result to this filepath. "
#                              "Default: the report is named "
#                              "<c3d_file_path>.gltf")
#     args = parser.parse_args()
#     # print(args)
#     infile = args.c3d_file_path
#     if (args.output == None) :
#         outfile = infile.replace('.c3d', '.gltf')
#     else:
#         outfile = args.output
    
#     resultGltf = convertC3D2Gltf(infile, args.shape)
#     resultGltf.save(outfile)

# main()
