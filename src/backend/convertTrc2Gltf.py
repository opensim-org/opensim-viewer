"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
import pygltflib as pygltf
import numpy as np
import json
from pathlib import Path

# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],


def convertTrc2Gltf(trcFilePath, shape) :
    shape2Mesh = {
        'brick' : 0,
        'sphere' : 1,
        'cube' : 2
    }
    path = Path(trcFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    table = osim.TimeSeriesTableVec3(trcFilePath)
    numMarkers = table.getNumColumns()
    numDataFrames = table.getNumRows()
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
        print("File has no Units specifications, meters assumed.")
    firstDataFrame = table.getRowAtIndex(0)
    gltf = pygltf.GLTF2().load('basicShapes.gltf')

    # create node for the marker mesh, refer to it from all marker nodes
    topNode = pygltf.Node()
    topNode.name = 'MarkerData'
    gltf.nodes.clear()
    gltf.nodes.append(topNode)
    default_scene = gltf.scenes[0]
    # make children exclusively be node 0
    sceneNodes = default_scene.nodes
    sceneNodes.clear()
    sceneNodes.append(0) # MarkerData topNode
    for markerIndex in range(numMarkers):
      # Create node for the marker
      nextMarkerNode = pygltf.Node()
      nextMarkerNode.name = table.getColumnLabel(markerIndex)
      # 0 cube, 1 sphere, 2 brick
      desiredShape = shape2Mesh.get(shape)
      # Use cube if no shape is specified
      if (desiredShape==None):
        nextMarkerNode.mesh =  0
      else:
        nextMarkerNode.mesh = desiredShape

      # extras are place holder for application specific properties
      # for now we'll pass opensimType, may add layers, as needs arise....
      opensim_extras = {"opensimType": "experimental-marker"}
      nextMarkerNode.extras = opensim_extras
      translation = firstDataFrame.getElt(0, markerIndex).to_numpy()

      if (scaleData):
        nextMarkerNode.translation = (translation * unitConversionToMeters).tolist()
      else:
        nextMarkerNode.translation = translation.tolist()

      nextMarkerNode.scale = [.01, .01, .01]
      gltf.nodes.append(nextMarkerNode)
      topNode.children.append(markerIndex+1)

    return gltf

def main():
    import argparse

    ## Input parsing.
    ## =============
    parser = argparse.ArgumentParser(
        description="Generate a gltf file corresponding to the passed in trc file.")
    # Required arguments.
    parser.add_argument('trc_file_path',
                        metavar='trcfilepath', type=str,
                        help="filename for trc file (including path).")
    parser.add_argument('--shape', type=str,
                        help="Pick shape to use for displaying markers.")
    parser.add_argument('--output', type=str,
                        help="Write the result to this filepath. "
                             "Default: the report is named "
                             "<trc_file_path>.gltf")
    args = parser.parse_args()
    # print(args)
    infile = args.trc_file_path
    if (args.output == None) :
        outfile = infile.replace('.trc', '.gltf')
    else:
        outfile = args.output
    convertTrc2Gltf(infile, args.shape).save(outfile)


main()