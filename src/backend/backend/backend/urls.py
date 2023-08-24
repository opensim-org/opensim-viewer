from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

from . import views

app_name = 'opensim-viewer'

urlpatterns = [
    # Get list of users.
    path("users/", views.UserViewSet.as_view({'get': 'list'}), name="UserViewSet"),
    # Get specific model record.
    path("models/<int:id>/", views.ModelRetrieve.as_view({'get': 'retrieve_model_by_id'}), name="ModelRetrieveById"),
    # Get specific model only gltf file link.
    path("models/viz/<int:id>/", views.ModelRetrieve.as_view({'get': 'retrieve_model_viz_by_id'}), name="ModelRetrieveById"),
    # Get default model gltf file link.
    path("models/viz/default/", views.ModelRetrieve.as_view({'get': 'retrieve_default_model_gltf'}), name="ModelRetrieveById"),
    # Get list of models.
    path("models/", views.ModelViewSet.as_view({'get': 'list'}), name="ModelViewSet"),
    # Sign up by creating a user.
    path("sign_up/", views.UserCreate.as_view({'post': 'create_user'}), name="UserCreate"),
    # Create a new model by uploading a gltf file.
    path("create_model/", views.ModelCreate.as_view({'post': 'create_model'}), name="ModelCreate"),
    # Upload file, create model in backend and return url of gltf resulting from upload
    path("upload_file/", views.ModelCreate.as_view({'post': 'upload_file'}), name="FileUpload"),
    # Retrieve information and file of an existing model.
    path("retrieve_model/", views.ModelRetrieve.as_view({'post': 'retrieve_model'}), name="ModelRetrieve"),
    # Login with user and password.
    path('login/', views.Login.as_view({'post': 'login_view'}), name='login'),
    # Logout with user and password.
    path('logout/', views.Logout.as_view({'post': 'logout_view'}), name='logout'),

]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
