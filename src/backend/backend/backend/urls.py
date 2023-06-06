from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

from . import views

app_name = 'opensim-viewer'
# On file system we'll have a folder per model containing gltf, possibly .osim file, data files, display preferences
# urls could be something like:
# Eventually we need to distnguish retrieve and view so that the Desktop Application can retrieve
# without necessarily viewing online
#
#/models/ show list personal models
#/models/id/ = retrieve_model(id) specfic model
#/models/upload = create_model
#/ = homepage with upload and login options
#/model_viewer/ show model gallery of personal models, or stock models if not logged-in
#/model_viewer/id  show model id in 3D view
#/viewer = redirect to model_viewer/DEFAULT_MODEL/ 
#/ current hoe page of opensim-viewer
urlpatterns = [
    # Get list of users.
    path("users/", views.UserViewSet.as_view({'get': 'list'}), name="UserViewSet"),
    # Get list of models.
    path("models/", views.ModelViewSet.as_view({'get': 'list'}), name="ModelViewSet"),
    # Sign up by creating a user.
    path("sign_up/", views.UserCreate.as_view({'post': 'create_user'}), name="UserCreate"),
    # Create a new model by uploading a gltf file.
    path("create_model/", views.ModelCreate.as_view({'post': 'create_model'}), name="ModelCreate"),
    # Retrieve information and file of an existing model.
    path("retrieve_model/", views.ModelRetrieve.as_view({'post': 'retrieve_model'}), name="ModelRetrieve"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
