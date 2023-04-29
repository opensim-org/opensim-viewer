"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
import pygltflib as pygltf
import numpy as np
from pathlib import Path
from pygltflib.utils import (
    add_primitive,
    add_indexed_geometry,
)
# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],
        
    
def convertTrc2Gltf(trcFilePath) :
    path = Path(trcFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    table = osim.TimeSeriesTableVec3(trcFilePath)
    numMarkers = table.getNumColumns()
    numDataFrames = table.getNumRows()
    firstDataFrame = table.getRowAtIndex(0)
    gltf = pygltf.GLTF2().load('basicShapes.gltf')

    offset = 3
    current_scene  = gltf.scenes[0]
    
    # create node for the marker mesh, refer to it from all marker nodes
    topNode = pygltf.Node()
    topNode.name = 'MarkerData'
    gltf.nodes.clear()
    gltf.nodes.append(topNode)
 
    for markerIndex in range(numMarkers):
      # Create node for the marker
      nextMarkerNode = pygltf.Node()
      nextMarkerNode.name = table.getColumnLabel(markerIndex)
      # 0 cube, 1 sphere, 2 brick
      nextMarkerNode.mesh = 1
      nextMarkerNode.translation = firstDataFrame.getElt(0, markerIndex).to_numpy().tolist()
      gltf.nodes.append(nextMarkerNode)
      topNode.children.append(markerIndex+offset+1)
      
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
    # args = parser.parse_args()
    # print(args)
    convertTrc2Gltf("arm26_elbow_flex.trc").save('converted.gltf')
    

main()