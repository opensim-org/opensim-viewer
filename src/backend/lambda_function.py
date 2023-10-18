from __future__ import print_function
import boto3
import json
import opensim as osim
import pygltflib
from osimConverters import *
import time, urllib
import json
from pathlib import Path
"""Code snippet for copying the objects from AWS source S3 bucket to target S3 bucket as soon as objects uploaded on source S3 bucket
"""
s3 = boto3.client('s3')

def handler(event, context):
    print(event)
    print(context)
    source_bucket = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']
    target_bucket = 'opensim-viewer-public-download'
    copy_source = {'Bucket': source_bucket, 'Key': object_key}
    
    print ("Source bucket : ", source_bucket)
    print ("Target bucket : ", target_bucket)
    print ("key : ", object_key)
    print ("Log Stream name: ", context.log_stream_name)
    print ("Log Group name: ", context.log_group_name)
    print ("Request ID: ", context.aws_request_id)
    print ("Mem. limits(MB): ", context.memory_limit_in_mb)
    # Construct urls for input, output files and call convertUserFileToGLTF
    try:
        print ("Using waiter to waiting for object to persist through s3 service")
        waiter = s3.get_waiter('object_exists')
        waiter.wait(Bucket=source_bucket, Key=object_key)
        workFolder = "/tmp/"
        s3.download_file(source_bucket, object_key, workFolder+object_key)
        gltfJson = convertNativeFileToGLTF(workFolder+object_key)
        destinationFile = Path(workFolder+object_key).with_suffix('.gltf')
        print ("output file", destinationFile)
        gltfJson.save(destinationFile)
        print("Gltf file saved")
        destinationFileName = Path(object_key).with_suffix('.gltf')
        strDestinationFileName = str(destinationFileName)
        print("DestinationFile string", strDestinationFileName)
        s3.upload_file(destinationFile, target_bucket, strDestinationFileName)
        print("File upload launched")
        result_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': target_bucket,
                    'Key': strDestinationFileName },
            ExpiresIn=3600)
        print("Gltf file uploaded to ", result_url)
        waiter = s3.get_waiter('object_exists')
        waiter.wait(Bucket=target_bucket, Key=strDestinationFileName) 
        print("File upload finished, url returned", result_url)       # s3.copy_object(Bucket=target_bucket, Key=object_key, CopySource=copy_source)
        return {
        'statusCode': 200,
        'body': json.dumps('Success'),
        'result_url': result_url
        }
    except Exception as err:
        print ("Error -"+str(err))
        return err
    

def convertUserFileToGLTF(inFilePathOrURL, outFilePathOrURL):
    gltfJson = convertNativeFileToGLTF(inFilePathOrURL)
    gltfJson.save(outFilePathOrURL)


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