import json
from backend.backend.backend.osimConverters import *

def lambda_handler(event, context):
    print(event)
    print(context)
    return {
        'statusCode': 200,
        'body': json.dumps('Success')
    }

def test_lambda():
    gltf = initGltf()
    gltf.save('test.gltf')