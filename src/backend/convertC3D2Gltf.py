"""
Created on Mon Apr 24 14:37:54 2023

@author: ayman
"""

import opensim as osim
from pygltflib import *
import numpy as np
import json
from pathlib import Path
import openSimData2Gltf as os2Gltf

# format is
#
# "scenes": [...], will populate 0 only
# "nodes" : [...],
# "meshes" : [...],
# "animations" : [...],


def convertC3D2Gltf(c3dFilePath, shape) :

    path = Path(c3dFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    adapter = osim.C3DFileAdapter()
    tables = adapter.read(c3dFilePath)
    markerDataTable = adapter.getMarkersTable(tables)
    hasMarkerData = markerDataTable.getNumRows()>0
    if (hasMarkerData):
      markersFlat = markerDataTable.flatten()
      osim.STOFileAdapter_write(markersFlat, 'markersFlat.sto')
    forcesDataTable = adapter.getForcesTable(tables)
    hasForceData = forcesDataTable.getNumRows()>0
    if (hasForceData) :
      forcesFlat = forcesDataTable.flatten()
      osim.STOFileAdapter_write(forcesFlat, 'forcesOnly.sto')

    #Underlying assumption here is that .c3d file always has marker data but may not
    # have force data, need to verify this to be the case for OpenSim use cases
    numDataFrames = markerDataTable.getNumRows()
    if numDataFrames==0:
        raise IndexError("Input file has no data", markerDataTable)
    # instead of creating the GLTF2 structure from scratch and programmatically adding basic
    # shapes (Sphere, Cube, brick, axes, arrows etc.) instead we load a file with these meshes
    # baked in and use these meshes as needed. 
    gltf = os2Gltf.initGltf()

    # create node for the marker mesh, refer to it from all marker nodes
    os2Gltf.convertMarkersTimeSeries2Gltf(gltf, shape, markerDataTable)

    return gltf

def main():
    import argparse

    ## Input parsing.
    ## =============
    parser = argparse.ArgumentParser(
        description="Generate a gltf file corresponding to the passed in c3d file.")
    # Required arguments.
    parser.add_argument('c3d_file_path',
                        metavar='c3dfilepath', type=str,
                        help="filename for c3d file (including path).")
    parser.add_argument('--shape', type=str,
                        help="Pick shape to use for displaying markers.")
    parser.add_argument('--output', type=str,
                        help="Write the result to this filepath. "
                             "Default: the report is named "
                             "<c3d_file_path>.gltf")
    args = parser.parse_args()
    # print(args)
    infile = args.c3d_file_path
    if (args.output == None) :
        outfile = infile.replace('.c3d', '.gltf')
    else:
        outfile = args.output
    
    resultGltf = convertC3D2Gltf(infile, args.shape)
    resultGltf.save(outfile)

main()