from __future__ import print_function
import json
import opensim as osim
import pygltflib
from osimConverters import *
# import boto3
import time, urllib
import json
"""Code snippet for copying the objects from AWS source S3 bucket to target S3 bucket as soon as objects uploaded on source S3 bucket
"""

print ("Initializing..")

# s3 = boto3.client('s3')
def handler(event, context):
    print(event)
    print(context)
    source_bucket = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']
    target_bucket = 'opensim-viewer-public-download'
    copy_source = {'Bucket': source_bucket, 'Key': object_key}
    
    print ("Source bucket : ", source_bucket)
    print ("Target bucket : ", target_bucket)
    print ("Log Stream name: ", context.log_stream_name)
    print ("Log Group name: ", context.log_group_name)
    print ("Request ID: ", context.aws_request_id)
    print ("Mem. limits(MB): ", context.memory_limit_in_mb)
    # Construct urls for input, output files and call convertUserFileToGLTF
    return {
        'statusCode': 200,
        'body': json.dumps('Success')
    }

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