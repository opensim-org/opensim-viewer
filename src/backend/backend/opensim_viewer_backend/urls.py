from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('', include("backend.urls")),
    path('admin/doc/', include('django.contrib.admindocs.urls')),  # Must be before "admin/".
    path("admin/", admin.site.urls),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Add a URL pattern to serve the 'model_files/' directory during testing
# This is not for production use, only for testing purposes
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_ROOT, document_root=settings.MEDIA_ROOT)
