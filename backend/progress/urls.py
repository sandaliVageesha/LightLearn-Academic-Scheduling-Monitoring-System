from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ActivitiesViewSet,
    ProgressViewSet,
    ActivityStudentProgressView,
    CourseActivityProgressView,
)

router = DefaultRouter()
router.register(r'activities', ActivitiesViewSet, basename='activities')
router.register(r'progress', ProgressViewSet, basename='progress')

urlpatterns = [
    # Router Endpoints
    path('', include(router.urls)),

    # Custom Endpoints
    path(
        'activities/student/<int:student_id>/',
        ActivityStudentProgressView.as_view(),
        name='student-activities-progress',
    ),
    path(
        'activities/course/<int:course_id>/progress/',
        CourseActivityProgressView.as_view(),
        name='course-activity-progress',
    ),
]
