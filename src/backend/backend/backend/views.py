from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from rest_framework import viewsets, permissions
from rest_framework import status as htttp_status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .serializers import UserCreateSerializer, ModelCreateSerializer, ModelRetrieveSerializer
from .models import Model, User
import json


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
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create_user(self, request):
        """
        Create a new user based on the provided request data.

        :param request: The request object. Should include 'username', 'email', 'password', 'first_name' and 'last_name'.
        :return: Response containing the result of the user creation or an error message.
        """
        error_message = ''

        serializer = UserCreateSerializer(data=request.data, context={'request': request})

        try:
            # Serialize data, validate and save.
            serializer.is_valid(raise_exception=True)
            serializer.save()

            # Status: Object created.
            status = htttp_status.HTTP_201_CREATED

        except ValidationError as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"objectName": "user", "error_message": str(e)}

            # Status: Bad request because it was a problem while validating request values.
            status = htttp_status.HTTP_400_BAD_REQUEST
        except Exception as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"objectName": "user", "error_message": json.dumps(serializer.errors)}

            # Status: Internal server error since it is a generic error, probably not identified.
            # We should follow these since that could mean an unidentified bug.
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

        :param request: The request object. Should include 'name', 'description', 'owner', 'authors', 'model_gltf_file', 'link', 'license' and 'license_link'.
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
            error_message = _("problemCreatingObject") % {"objectName": "model", "error_message": json.dumps(serializer.errors)}

            # Status: Bad request because it was a problem while validating request values.
            status = htttp_status.HTTP_400_BAD_REQUEST
        except Exception as e:
            # Format error message.
            error_message = _("problemCreatingObject") % {"objectName": "model", "error_message": json.dumps(serializer.errors)}

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
        model_gltf_link = None
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
            model_gltf_link = request.build_absolute_uri(model.model_gltf_file.url)
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
            'model_gltf_file': model_gltf_link,
            'model_link': model_link,
            'model_license': model_license,
            'model_license_link': model_license_link,
            'error_message': error_message,
        }, status=status)
