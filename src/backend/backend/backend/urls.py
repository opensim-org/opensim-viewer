from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

from . import views

app_name = 'opensim-viewer'

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
