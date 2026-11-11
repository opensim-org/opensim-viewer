from .openSimData2Gltf import *
from .convertTrc2Gltf import *
from .convertC3D2Gltf import *
from .convertMotForce2Gltf import *
from .convertOsim2Gltf import *
from .convertOsimZip2Gltf import *
from .convertOpenCapZip2Gltf import *
from .osimCamera import *

def convertNativeFileToGLTF(inFilePathOrURL, options, startingGltf=None):
        filename, file_extension = os.path.splitext(inFilePathOrURL)

        if (file_extension==".trc" or ".trc." in inFilePathOrURL):
            gltfJson = convertTrc2Gltf(inFilePathOrURL, options, startingGltf)
        elif (file_extension==".c3d" or ".c3d." in inFilePathOrURL):
            gltfJson = convertC3D2Gltf(inFilePathOrURL, options, startingGltf)
        elif (file_extension==".mot" or ".mot." in inFilePathOrURL):
            gltfJson = convertMotForce2Gltf(inFilePathOrURL, options, startingGltf)
        elif (file_extension==".osim" or ".osim." in inFilePathOrURL):
            gltfJson = convertOsim2Gltf(inFilePathOrURL, 'Geometry', [], options, startingGltf)
        elif (file_extension==".osimz" or ".osimz." in inFilePathOrURL):
            gltfJson = convertOsimZip2Gltf(inFilePathOrURL, options)

        return gltfJson
        
def convertNativeFileSetToGLTF(inFilePathOrURL, motions, options, startingGltf=None):
    gltfJson = convertOsim2Gltf(inFilePathOrURL, '', motions, options, startingGltf)
    return gltfJson

def convertForceFileToGltf(inFilePathOrURL, options, startingGltf=None):
    gltfJson = convertMotForce2Gltf(inFilePathOrURL, None, options, startingGltf)
    return gltfJson