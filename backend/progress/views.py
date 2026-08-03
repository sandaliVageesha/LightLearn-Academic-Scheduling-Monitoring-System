from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q, Count
from django.utils import timezone

from .models import Activities, Progress
from .serializers import (
    ActivitiesSerializer, ProgressSerializer,
    ActivityWithProgressSerializer, BulkProgressUpdateSerializer
)


class ActivitiesViewSet(viewsets.ModelViewSet):
    """
    Activities CRUD Operations
    Endpoints:
    - GET /api/activities/ - List all activities
    - POST /api/activities/ - Create activity
    - GET /api/activities/{id}/ - Get activity details
    - PUT /api/activities/{id}/ - Update activity
    - DELETE /api/activities/{id}/ - Delete activity
    """
    queryset = Activities.objects.all()
    serializer_class = ActivitiesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by course (ER Diagram එකට අනුව courses_id)
        course_id = self.request.query_params.get('courseId')
        if course_id:
            queryset = queryset.filter(courses_id=course_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            now = timezone.now()
            if status_filter == 'upcoming':
                queryset = queryset.filter(due_date__gte=now)
            elif status_filter == 'overdue':
                queryset = queryset.filter(due_date__lt=now)
            elif status_filter == 'completed':
                # Completed activities - all progress >= 100
                queryset = queryset.annotate(
                    total=Count('progress'),
                    completed=Count('progress', filter=Q(progress__value__gte=100))
                ).filter(total__gt=0, total=completed)
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Activity එක progress data එකත් එක්ක ගන්න"""
        instance = self.get_object()
        serializer = ActivityWithProgressSerializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def progress_summary(self, request, pk=None):
        """Activity එකේ progress summary එක ගන්න"""
        activity = self.get_object()
        summary = activity.progress_summary
        return Response(summary)

    @action(detail=True, methods=['post'])
    def bulk_update_progress(self, request, pk=None):
        """Multiple students ගේ progress update කරන්න"""
        activity = self.get_object()
        serializer = BulkProgressUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        updates = serializer.validated_data['updates']
        updated_records = []
        
        for update in updates:
            progress_obj, created = Progress.objects.update_or_create(
                students_id=update['student_id'],
                activities=activity,
                defaults={'value': update['value']}
            )
            updated_records.append(ProgressSerializer(progress_obj).data)
        
        return Response({
            'message': f'Updated {len(updated_records)} progress records',
            'updated': updated_records
        }, status=status.HTTP_200_OK)


class ProgressViewSet(viewsets.ModelViewSet):
    """
    Progress CRUD Operations
    Endpoints:
    - GET /api/progress/ - List all progress
    - POST /api/progress/ - Create/Update progress (upsert)
    - GET /api/progress/{id}/ - Get progress details
    - PUT /api/progress/{id}/ - Update progress
    - DELETE /api/progress/{id}/ - Delete progress
    """
    queryset = Progress.objects.all()
    serializer_class = ProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by student (ER Diagram එකට අනුව students_id)
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(students_id=student_id)
        
        # Filter by activity (ER Diagram එකට අනුව activities_id)
        activity_id = self.request.query_params.get('activity_id')
        if activity_id:
            queryset = queryset.filter(activities_id=activity_id)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create or Update progress (UPSERT)
        ER Diagram එකට අනුව: students_id, activities_id, value
        """
        student_id = request.data.get('students_id') or request.data.get('students')
        activity_id = request.data.get('activities_id') or request.data.get('activities')
        value = request.data.get('value')
        
        if not all([student_id, activity_id, value is not None]):
            return Response(
                {'error': 'students_id, activities_id, and value are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        progress_obj, created = Progress.objects.update_or_create(
            students_id=student_id,
            activities_id=activity_id,
            defaults={'value': value}
        )
        
        serializer = self.get_serializer(progress_obj)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class ActivityStudentProgressView(generics.GenericAPIView):
    """
    Student එකෙකුගේ activities සහ progress ගන්න
    GET /api/activities/student/{student_id}/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        course_id = request.query_params.get('courseId')
        
        # Activities ගන්න
        activities = Activities.objects.all()
        if course_id:
            activities = activities.filter(courses_id=course_id)
        
        # Student ගේ progress data එක ගන්න
        progress_records = Progress.objects.filter(students_id=student_id)
        
        result = []
        for activity in activities:
            progress = progress_records.filter(activities=activity).first()
            result.append({
                'activity': ActivitiesSerializer(activity).data,
                'progress': ProgressSerializer(progress).data if progress else None
            })
        
        return Response(result)


class CourseActivityProgressView(generics.GenericAPIView):
    """
    Course එකක activities සහ progress ගන්න
    GET /api/activities/course/{course_id}/progress
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        activities = Activities.objects.filter(courses_id=course_id)
        
        result = []
        for activity in activities:
            progress = Progress.objects.filter(activities=activity)
            result.append({
                'activity': ActivitiesSerializer(activity).data,
                'progress': ProgressSerializer(progress, many=True).data,
                'summary': activity.progress_summary
            })
        
        return Response(result)