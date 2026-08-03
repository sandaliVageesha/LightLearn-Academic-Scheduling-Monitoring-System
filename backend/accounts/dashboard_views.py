from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def manager_dashboard(request):
    return Response({
        'message': 'Manager Dashboard',
        'data': {
            'total_courses': 0,
            'total_students': 0,
            'total_educators': 0,
            'total_batches': 0
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_admin_dashboard(request):
    return Response({
        'message': 'Super Admin Dashboard',
        'data': {
            'total_institutions': 0,
            'total_managers': 0,
            'total_users': 0
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def educator_dashboard(request):
    return Response({
        'message': 'Educator Dashboard',
        'data': {
            'my_courses': 0,
            'my_students': 0,
            'pending_activities': 0
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    return Response({
        'message': 'Student Dashboard',
        'data': {
            'my_courses': 0,
            'my_activities': 0,
            'completed_activities': 0,
            'pending_activities': 0
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_dashboard(request):
    return Response({
        'message': 'Parent Dashboard',
        'data': {
            'my_children': 0,
            'children_progress': 0
        }
    })