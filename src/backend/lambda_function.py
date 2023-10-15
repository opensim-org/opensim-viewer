import json
import opensim as osim
import pygltflib
from osimConverters import *


def handler(event, context):
    print(event)
    print(context)
    return {
        'statusCode': 200,
        'body': json.dumps('Success')
    }

def convertUserFileToGLTF(filePathOrURL):
        filename, file_extension = os.path.splitext(filePathOrURL.name)
        if (file_extension==".trc"):
        #invoke converter on trc file, then generate url from path
            gltfJson = convertTrc2Gltf(filePathOrURL, 'sphere')
            outfile = filePathOrURL.replace('.trc', '.gltf')
            gltfJson.save(outfile)
        elif (file_extension==".c3d"):
            gltfJson = convertC3D2Gltf(filePathOrURL, 'sphere')
            outfile = filePathOrURL.replace('.c3d', '.gltf')
            gltfJson.save(outfile)
        elif (file_extension==".mot"):
            gltfJson = convertMotForce2Gltf(filePathOrURL, 'arrow')
            outfile = filePathOrURL.replace('.mot', '.gltf')
            gltfJson.save(outfile)
        elif (file_extension==".osim"):
            gltfJson = convertOsim2Gltf(filePathOrURL, 'Geometry')
            outfile = filePathOrURL.replace('.osim', '.gltf')
            gltfJson.save(outfile)
        elif (file_extension==".osimz"):
            gltfJson = convertOsimZip2Gltf(filePathOrURL)
            outfile = filePathOrURL.replace('.osimz', '.gltf')
            gltfJson.save(outfile)
         #elif (file_extension==".gltf"):
        #    generatedFile = filePathOrURL
        return gltfJson


def whatever():
    print('whatever has been successfully called')

def main():
    print('main was called')

main()
# from __future__ import print_function
# import boto3
# import time, urllib
# import json
# """Code snippet for copying the objects from AWS source S3 bucket to target S3 bucket as soon as objects uploaded on source S3 bucket
# """

# print ("Initializing..")

# s3 = boto3.client('s3')

# def lambda_handler(event, context):
#     # TODO implement
#     source_bucket = event['Records'][0]['s3']['bucket']['name']
#     object_key = event['Records'][0]['s3']['object']['key']
#     target_bucket = 'opensim-viewer-public-download'
#     copy_source = {'Bucket': source_bucket, 'Key': object_key}
    
#     print ("Source bucket : ", source_bucket)
#     print ("Target bucket : ", target_bucket)
#     print ("Log Stream name: ", context.log_stream_name)
#     print ("Log Group name: ", context.log_group_name)
#     print ("Request ID: ", context.aws_request_id)
#     print ("Mem. limits(MB): ", context.memory_limit_in_mb)
    
#     try:
#         print ("Using waiter to waiting for object to persist through s3 service")
#         waiter = s3.get_waiter('object_exists')
#         waiter.wait(Bucket=source_bucket, Key=object_key)
#         print ("converting file ")
#         s3.copy_object(Bucket=target_bucket, Key=object_key, CopySource=copy_source)
#         return response['ContentType']
#     except Exception as err:
#         print ("Error -"+str(err))
#         return e