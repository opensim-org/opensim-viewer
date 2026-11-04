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
# "animations refer to channels and samplers"


def convertTrc2Gltf(trcFilePath, options) :
    path = Path(trcFilePath)
    if not path.exists():
        raise NotADirectoryError("Unable to find file ", path.absolute())

    gltfJson = initGltf()
    timeSeriesTableMarkers = osim.TimeSeriesTableVec3(trcFilePath)
    convertMarkersTimeSeries2Gltf(gltfJson, options.getExperimentalMarkerShape(), timeSeriesTableMarkers)
    return gltfJson

# def main():
"""     import argparse

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
    
    resultGltf = convertTrc2Gltf(infile, args.shape)
    resultGltf.save(outfile)
 """
# main()