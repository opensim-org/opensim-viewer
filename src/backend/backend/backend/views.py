import os
import pathlib
from urllib.parse import urlparse
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from rest_framework import viewsets, permissions
from rest_framework import status as htttp_status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
import urllib3

from opensim_viewer_backend import settings
from .serializers import UserCreateSerializer, ModelCreateSerializer, ModelRetrieveSerializer, LoginSerializer
from .models import Model, User
import json
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth import logout
from rest_framework.authtoken.models import Token
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .osimConverters import *

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that returns the list of users in the database. Requires authentication.
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Returns a list of users in the database.
        :param request: The request object. Empty since we want a list with all the users.
        :param args: Additional positional arguments. Empty since we want a list with all the users.
        :param kwargs: Additional keyword arguments. Empty since we want a list with all the users.
        :return: Response containing the serialized list of users.
        """
        return super().list(request, *args, **kwargs)


class UserCreate(viewsets.ModelViewSet):
    """
    API endpoint to create users (sign up). Anyone can sign up.
    """
    def create_user(self, request):
        """
        Create a new user based on the provided request data.

        :param request: The request object. Should include 'username', 'email', 'password', 'first_name' and 'last_name'.
        :return: Response containing the result of the user creation or an error message.
        """
        error_message = ''
        status = None

        serializer = UserCreateSerializer(data=request.data, context={'request': request})

        try:
            # Serialize data, validate and save.
            serializer.is_valid(raise_exception=True)

            # Check if the username or email already exists
            username = serializer.validated_data.get('username')
            email = serializer.validated_data.get('email')
            if User.objects.filter(username=username).exists():
                error_message = _("Username already exists.")
                status = htttp_status.HTTP_400_BAD_REQUEST
            elif User.objects.filter(email=email).exists():
                error_message = _("Email already exists.")
                status = htttp_status.HTTP_400_BAD_REQUEST
            else:
                serializer.save()
                status = htttp_status.HTTP_201_CREATED

        except ValidationError as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"object_name": "user", "error_message": str(e)}
            status = htttp_status.HTTP_400_BAD_REQUEST

        except Exception as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"object_name": "user",
                                                          "error_message": json.dumps(serializer.errors)}
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response(error_message, status=status)


class ModelViewSet(viewsets.ModelViewSet):
    """
    API endpoint that returns the list of models in the database. Requires authentication.
    """
    queryset = Model.objects.all()
    serializer_class = ModelCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Returns a list of models in the database.
        :param request: The request object. Empty since we want a list with all the models.
        :param args: Additional positional arguments. Empty since we want a list with all the models.
        :param kwargs: Additional keyword arguments. Empty since we want a list with all the models.
        :return: Response containing the serialized list of models.
        """
        return super().list(request, *args, **kwargs)


class ModelCreate(viewsets.ModelViewSet):
    """
    API endpoint to create models. Needs to be authenticated since a model must be associated to a user.
    """
    serializer_class = ModelCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create_model(self, request, format='json'):
        """
        Create a new model based on the provided request data.

        :param request: The request object. Should include 'name', 'description', 'owner', 'authors', 'model_folder', 'link', 'license' and 'license_link'.
        :return: Response containing the result of the user creation or an error message.
        """
        error_message = ''

        try:
            # Serialize data, validate and save.
            serializer = ModelCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()

            # Status: Object created.
            status = htttp_status.HTTP_201_CREATED
        except ValidationError as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"object_name": "model", "error_message": json.dumps(serializer.errors)}

            # Status: Bad request because it was a problem while validating request values.
            status = htttp_status.HTTP_400_BAD_REQUEST
        except Exception as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"object_name": "model", "error_message": json.dumps(serializer.errors)}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response(error_message, status=status)

    def upload_file(self, request):
        """
        Create a new model based on the provided request data.

        :param request: The request object. Should include 'name', 'description', 'owner', 'authors', 'model_folder', 'link', 'license' and 'license_link'.
        :return: Response containing the result of the user creation or an error message.
        """
        error_message = ''
        filedata = request.data['files']
        filename, file_extension = os.path.splitext(filedata.name)
        validFile = file_extension in ['.trc', '.mot', '.c3d', '.osim', '.osimz', '.gltf'] 
        try:
            if (validFile):
                pathOnServer = os.path.join(settings.STATIC_ROOT, filedata.name)
                savedFilePath = default_storage.save(pathOnServer, ContentFile(filedata.read()))

                if (file_extension==".trc"):
                #invoke converter on trc file, then generate url from path
                    generatedFile = convertTrc2Gltf(savedFilePath, 'sphere')
                elif (file_extension==".c3d"):
                    generatedFile = convertC3D2Gltf(savedFilePath, 'sphere')
                elif (file_extension==".mot"):
                   generatedFile = convertMotForce2Gltf(savedFilePath, 'arrow')
                elif (file_extension==".osim"):
                   generatedFile, gltf = convertOsim2Gltf(savedFilePath, 'Geometry')
                elif (file_extension==".osimz"):
                   generatedFile = convertOsimZip2Gltf(savedFilePath)
                elif (file_extension==".gltf"):
                    generatedFile = savedFilePath
                # Serialize data, validate and save.
                status = htttp_status.HTTP_200_OK
                return Response({
                    'status': status,
                    'model_gltf_file': generatedFile,
                    'error_message': error_message,
                    }, status=status)
        except ValidationError as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"object_name": "model", "error_message": "Error"}

            # Status: Bad request because it was a problem while validating request values.
            status = htttp_status.HTTP_400_BAD_REQUEST
        except Exception as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"object_name": "model", "error_message": "Error"}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response(error_message, status=status)


class ModelRetrieve(viewsets.ModelViewSet):
    """
    API endpoint to retrieve a model. No need to be authenticated since a model should be public to any user.
    """
    serializer_class = ModelRetrieveSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve_model(self, request, format='json'):
        """
        Given a model name, retrieves it.
        :param request: The request object. Should include 'name'.
        :return: Response containing information about the requested model or an error message.
        @return:
        """
        error_message = ''
        model_name = None
        model_description = None
        model_owner_username = None
        model_authors = None
        model_file_link = None
        model_link = None
        model_license = None
        model_license_link = None

        try:
            # Serialize data and validate.
            serializer = ModelRetrieveSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)

            # Extract model by name.
            model_name = serializer.validated_data['name']
            model = get_object_or_404(Model, name=model_name)

            # Extract model elements.
            model_name = model.name
            model_description = model.description
            model_owner_username = model.owner.username
            model_authors = model.authors
            model_file_link = request.build_absolute_uri(model.model_gltf_file.url)
            model_link = model.link
            model_license = model.license
            model_license_link = model.license_link

            # Default status if no errors occur.
            status = htttp_status.HTTP_200_OK
        except Http404 as e:
            # Format error message.
            error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

            # Status: Not found because the model could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except FileNotFoundError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "gltf file", "error_message": str(e)}

            # Status: Not found because the gltf file could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except ValueError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: There was an error in a value of an object. Maybe cause because a bad request.
            status = htttp_status.HTTP_400_BAD_REQUEST

        except ValidationError as e:
            if "does_not_exist" in str(e):
                # Format error message.
                error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

                # Status: Not found because the gltf file could not be found.
                status = htttp_status.HTTP_404_NOT_FOUND
            else:
                # Format error message.
                error_message = _("problemWithObject") % {"object_name": "request", "error_message": str(e)}

                # Status: Bad request because it was a problem while validating request values.
                status = htttp_status.HTTP_400_BAD_REQUEST

        except Exception as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response({
            'status': status,
            'model_name': model_name,
            'model_description': model_description,
            'owner': model_owner_username,
            'model_authors': model_authors,
            'model_gltf_file': model_file_link,
            'model_link': model_link,
            'model_license': model_license,
            'model_license_link': model_license_link,
            'error_message': error_message,
        }, status=status)
    
    def retrieve_model_by_id(self, request, id, format='json'):
        """
        Given a model name, retrieves it.
        :param request: The request object. Should include 'name'.
        :return: Response containing information about the requested model or an error message.
        @return:
        """
        error_message = ''
        model_name = None
        model_description = None
        model_owner_username = None
        model_authors = None
        model_file_link = None
        model_link = None
        model_license = None
        model_license_link = None

        try:
            # Serialize data and validate.
            serializer = ModelRetrieveSerializer(data=request.data, context={'request': request})
            #serializer.is_valid(raise_exception=True)

            # Extract model by id.
            #model_name = serializer.validated_data['name']
            model = get_object_or_404(Model, id=id)

            # Extract model elements.
            model_name = model.name
            model_description = model.description
            model_owner_username = model.owner.username
            model_authors = model.authors
            model_file_link = request.build_absolute_uri(model.model_gltf_file.url)
            model_link = model.link
            model_license = model.license
            model_license_link = model.license_link

            # Default status if no errors occur.
            status = htttp_status.HTTP_200_OK
        except Http404 as e:
            # Format error message.
            error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

            # Status: Not found because the model could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except FileNotFoundError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "gltf file", "error_message": str(e)}

            # Status: Not found because the gltf file could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except ValueError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: There was an error in a value of an object. Maybe cause because a bad request.
            status = htttp_status.HTTP_400_BAD_REQUEST

        except ValidationError as e:
            if "does_not_exist" in str(e):
                # Format error message.
                error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

                # Status: Not found because the gltf file could not be found.
                status = htttp_status.HTTP_404_NOT_FOUND
            else:
                # Format error message.
                error_message = _("problemWithObject") % {"object_name": "request", "error_message": str(e)}

                # Status: Bad request because it was a problem while validating request values.
                status = htttp_status.HTTP_400_BAD_REQUEST

        except Exception as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response({
            'status': status,
            'model_name': model_name,
            'model_description': model_description,
            'owner': model_owner_username,
            'model_authors': model_authors,
            'model_gltf_file': model_file_link,
            'model_link': model_link,
            'model_license': model_license,
            'model_license_link': model_license_link,
            'error_message': error_message,
        }, status=status)

    def retrieve_model_viz_by_id(self, request, id, format='json'):
        """
        Given a model id, retrieves its corresponding visuals.
        :param request: The request object. Should include 'name'.
        :return: Response containing information about the requested model or an error message.
        @return:
        """
        error_message = ''
        model_file_link = None

        try:
            # Serialize data and validate.
            serializer = ModelRetrieveSerializer(data=request.data, context={'request': request})
            #serializer.is_valid(raise_exception=True)

            # Extract model by id.
            #model_name = serializer.validated_data['name']
            model = get_object_or_404(Model, id=id)

            # Extract model elements.
            model_file_link = request.build_absolute_uri(model.model_gltf_file.url)

            # Default status if no errors occur.
            status = htttp_status.HTTP_200_OK
        except Http404 as e:
            # Format error message.
            error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

            # Status: Not found because the model could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except FileNotFoundError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "gltf file", "error_message": str(e)}

            # Status: Not found because the gltf file could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except ValueError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: There was an error in a value of an object. Maybe cause because a bad request.
            status = htttp_status.HTTP_400_BAD_REQUEST

        except ValidationError as e:
            if "does_not_exist" in str(e):
                # Format error message.
                error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

                # Status: Not found because the gltf file could not be found.
                status = htttp_status.HTTP_404_NOT_FOUND
            else:
                # Format error message.
                error_message = _("problemWithObject") % {"object_name": "request", "error_message": str(e)}

                # Status: Bad request because it was a problem while validating request values.
                status = htttp_status.HTTP_400_BAD_REQUEST

        except Exception as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response({
            'status': status,
            'model_gltf_file': model_file_link,
            'error_message': error_message,
        }, status=status)

    def retrieve_default_model_gltf(self, request, format='json'):
        """
        Given a model name, retrieves its corresponding visuals.
        :param request: The request object. Should include 'name'.
        :return: Response containing information about the requested model or an error message.
        @return:
        """
        error_message = ''
        model_file_link = None
        user = request.user
        # Find first model for user (owner=user) once login/auth in place
        dModel = Model.objects.all().first()

        try:
            model = dModel
            # Extract model by id.
            #model_name = serializer.validated_data['name']
            if (model==None):
                model = get_object_or_404(Model, id=0)

            # Extract model elements.
            model_file_link = request.build_absolute_uri(model.model_gltf_file.url)

            # Default status if no errors occur.
            status = htttp_status.HTTP_200_OK
            
        except Http404 as e:
            # Format error message.
            error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

            # Status: Not found because the model could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except FileNotFoundError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "gltf file", "error_message": str(e)}

            # Status: Not found because the gltf file could not be found.
            status = htttp_status.HTTP_404_NOT_FOUND

        except ValueError as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: There was an error in a value of an object. Maybe cause because a bad request.
            status = htttp_status.HTTP_400_BAD_REQUEST

        except ValidationError as e:
            if "does_not_exist" in str(e):
                # Format error message.
                error_message = _("objectNotFound") % {"object_name": "model", "error_message": str(e)}

                # Status: Not found because the gltf file could not be found.
                status = htttp_status.HTTP_404_NOT_FOUND
            else:
                # Format error message.
                error_message = _("problemWithObject") % {"object_name": "request", "error_message": str(e)}

                # Status: Bad request because it was a problem while validating request values.
                status = htttp_status.HTTP_400_BAD_REQUEST

        except Exception as e:
            # Format error message.
            error_message = _("problemRetrievingObject") % {"object_name": "model", "error_message": str(e)}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
            status = htttp_status.HTTP_500_INTERNAL_SERVER_ERROR

        return Response({
            'status': status,
            'model_gltf_file': model_file_link,
            'error_message': error_message,
        }, status=status)

class Login(viewsets.ModelViewSet):
    """
    API endpoint that allows users to log in.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    @csrf_exempt
    def login_view(self, request, format='json'):
        if request.method == 'POST':
            serializer = LoginSerializer(data=request.data)

            if serializer.is_valid():
                username = serializer.validated_data['username']
                password = serializer.validated_data['password']

                user = authenticate(request, username=username, password=password)

                if user is not None:
                    token, created = Token.objects.get_or_create(user=user)
                    return Response({'token': token.key})
                else:
                    return Response({'detail': 'Invalid credentials'}, status=htttp_status.HTTP_401_UNAUTHORIZED)
            else:
                return Response(serializer.errors, status=htttp_status.HTTP_400_BAD_REQUEST)

class Logout(viewsets.ModelViewSet):
    """
    API endpoint that allows users to log out.
    """
    permission_classes = [permissions.IsAuthenticated]

    @csrf_exempt
    def logout_view(self, request, format='json'):
        user = request.user
        Token.objects.filter(user=user).delete()
        return Response({}, status=htttp_status.HTTP_200_OK)
