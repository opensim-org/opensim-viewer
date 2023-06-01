from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.test import APIRequestFactory, force_authenticate
from django.utils.translation import gettext as _
from django.utils.translation import override
from .models import User, Model
from .views import UserViewSet, UserCreate, ModelViewSet, ModelCreate


class LocalizationTestCase(TestCase):
    """
    Tests for localization.
    """
    order = 1

    def setUp(self):
        pass

    def test_english_localization(self):
        with override('en'):
            msg = _("problemCreatingObject") % {"object_name": "user", "error_message": "Error Message"}
            expected = "There was a problem while creating the object `user`: Error Message"
            self.assertEqual(msg, expected)

            msg = _("objectNotFound") % {"object_name": "model", "error_message": "Error Message"}
            expected = "The object `model` was not found: Error Message"
            self.assertEqual(msg, expected)

            msg = _("problemRetrievingObject") % {"object_name": "gltf file", "error_message": "Error Message"}
            expected = "There was a problem while retrieving the object `gltf file`: Error Message"
            self.assertEqual(msg, expected)

            msg = _("problemWithObject") % {"object_name": "request", "error_message": "Error Message"}
            expected = "There was a problem with the object `request`: Error Message"
            self.assertEqual(msg, expected)

    def test_spanish_localization(self):
        with override('es'):
            msg = _("problemCreatingObject") % {"object_name": "user", "error_message": "Error Message"}
            expected = "Hubo un problema al crear el objeto `user`: Error Message"
            self.assertEqual(msg, expected)

            msg = _("objectNotFound") % {"object_name": "model", "error_message": "Error Message"}
            expected = "No se encontro el objeto `model`: Error Message"
            self.assertEqual(msg, expected)

            msg = _("problemRetrievingObject") % {"object_name": "gltf file", "error_message": "Error Message"}
            expected = "Hubo un problema al obtener el objeto `gltf file`: Error Message"
            self.assertEqual(msg, expected)

            msg = _("problemWithObject") % {"object_name": "request", "error_message": "Error Message"}
            expected = "Hubo un problema con el objeto `request`: Error Message"
            self.assertEqual(msg, expected)


class UserCreateTestCase(TestCase):
    """
    Tests for creating users.
    """
    order = 2

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = UserCreate.as_view({'post': 'create_user'})

    def test_create_user(self):
        data = {
            'email': 'email@email.test',
            'username': 'testuser',
            'password': 'testpass',
            'first_name': 'First Name',
            'last_name': 'Last Name'
            # Add other required fields
        }
        request = self.factory.post('/sign_up/', data)
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class UserViewSetTestCase(TestCase):
    """
    Tests for obtaining a list of all users.
    """
    order = 3

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = UserViewSet.as_view({'get': 'list'})
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_list_users(self):
        # Ensure user is created
        self.assertEqual(User.objects.count(), 1)

        request = self.factory.get('/users/')
        force_authenticate(request, user=self.user)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Validate response data
        users_data = response.data
        self.assertEqual(len(users_data), 1)  # Check if it returns one user
        user_data = users_data[0]
        self.assertEqual(user_data['username'], self.user.username)


class ModelCreateTestCase(TestCase):
    """
    Tests for creating models.
    """
    order = 4

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = ModelCreate.as_view({'post': 'create_model'})
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_create_model(self):
        data = {
            'name': 'Test Model',
            'description': 'Test description',
            'owner': self.user.pk,
            'authors': 'Test author',
            'link': 'http://test_link.com',
            'license': 'Test license',
            'license_link': 'http://test_license_link.com',
        }
        file_data = {
            'model_gltf_file': SimpleUploadedFile('test_file.gltf', b'Test content'),
        }
        data.update(file_data)
        request = self.factory.post('/create_model/', data, format='multipart')
        force_authenticate(request, user=self.user)
        response = self.view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ModelViewSetTestCase(TestCase):
    """
    Tests for obtaining a list of all models.
    """
    order = 5

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = ModelViewSet.as_view({'get': 'list'})
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.model = Model.objects.create(
            name='Test Model',
            description='Test description',
            owner=self.user,
            authors='Test author',
            model_gltf_file='test_file.gltf',
            link='http://test_link.com',
            license='Test license',
            license_link='http://test_license_link.com'
        )

    def test_list_models(self):
        # Ensure model is created
        self.assertEqual(Model.objects.count(), 1)

        request = self.factory.get('/models/')
        force_authenticate(request, user=self.user)
        response = self.view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Validate response data
        models_data = response.data
        self.assertEqual(len(models_data), 1)  # Check if it returns one model
        model_data = models_data[0]
        self.assertEqual(model_data['name'], self.model.name)


class ModelRetrieveTestCase(TestCase):
    """
    Tests for retrieving a model.
    """
    order = 6

    def setUp(self):
        self.client = APIClient()

        # Create a test user
        self.user = User.objects.create_user(username='testuser', password='testpassword')

        # Create a test model
        self.model = Model.objects.create(
            name='Test Model',
            description='Test description',
            owner=self.user,
            authors='Test authors',
            model_gltf_file='path/to/model.gltf',
            link='https://example.com',
            license='Test license',
            license_link='https://example.com/license'
        )

    def test_retrieve_model_success(self):
        url = reverse('ModelRetrieve')
        data = {'name': 1}
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], status.HTTP_200_OK)
        self.assertEqual(response.data['model_name'], 'Test Model')
        self.assertEqual(response.data['model_description'], 'Test description')
        self.assertEqual(response.data['owner'], 'testuser')
        self.assertEqual(response.data['model_authors'], 'Test authors')
        self.assertEqual(response.data['model_gltf_file'], 'http://testserver/path/to/model.gltf')
        self.assertEqual(response.data['model_link'], 'https://example.com')
        self.assertEqual(response.data['model_license'], 'Test license')
        self.assertEqual(response.data['model_license_link'], 'https://example.com/license')
        self.assertEqual(response.data['error_message'], '')

    def test_retrieve_model_not_found(self):
        url = reverse('ModelRetrieve')
        data = {'name': 2}  # A model that does not exit.
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['status'], status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['model_name'], None)
        self.assertEqual(response.data['model_description'], None)
        self.assertEqual(response.data['owner'], None)
        self.assertEqual(response.data['model_authors'], None)
        self.assertEqual(response.data['model_gltf_file'], None)
        self.assertEqual(response.data['model_link'], None)
        self.assertEqual(response.data['model_license'], None)
        self.assertEqual(response.data['model_license_link'], None)

    def test_retrieve_model_file_not_found(self):
        # Remove the model file to simulate a file not found error
        self.model.model_gltf_file.delete()

        url = reverse('ModelRetrieve')
        data = {'name': 1}
        response = self.client.post(url, data)

        # Name, description, authors and owner are properly processed before failing the file, so they have
        # the correct values.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['model_name'], 'Test Model')
        self.assertEqual(response.data['model_description'], 'Test description')
        self.assertEqual(response.data['owner'], 'testuser')
        self.assertEqual(response.data['model_authors'], 'Test authors')
        self.assertEqual(response.data['model_gltf_file'], None)
        self.assertEqual(response.data['model_link'], None)
        self.assertEqual(response.data['model_license'], None)
        self.assertEqual(response.data['model_license_link'], None)
