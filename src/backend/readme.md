General
-------
- This folder contains scripts to convert OpenSim based data files into gltf format
- We use third party library pygltflib to manipulate the gltf structure thus avoiding low level json file manipulation and encoding/decoding whenever possible.

Description of specific python files:
-------------------------------------
- openSimData2Gltf.py: gneric utilities that take columns of data and time stamps and create the corresponding Accessors in the passed in GLTF2 structure
- convert{xxx}2Gltf.py: Utilities for converting files with extension {xxx} to gltf, the convention is to produce a file with the same name but with different extension, unless an output file is specified
 