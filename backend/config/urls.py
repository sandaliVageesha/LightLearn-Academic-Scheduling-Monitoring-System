"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # existing apps
    path('api/institutions/', include('institutions.urls')),
    path('api/', include('batches.urls')),
    path('api/auth/', include('auth.urls')),
    
    # merged feature
    path('api/', include('course.urls')),
    path('api/', include('educators.urls')),
    path('api/', include('students.urls')),

    # Progress / Activity Management app
    path('api/', include('progress.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
