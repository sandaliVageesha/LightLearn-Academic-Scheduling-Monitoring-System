from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from .views import JWTView


class NotificationListView(JWTView):
    """
    A user's own notifications for the dashboard navbar bell. No
    allowed_roles restriction — every authenticated role has its own
    notifications (see NotificationService trigger points).
    """

    def get(self, request):
        all_notifications = Notification.objects.filter(recipient=request.current_user)
        unread_count = all_notifications.filter(is_read=False).count()
        serializer = NotificationSerializer(all_notifications[:50], many=True)
        return Response({'unread_count': unread_count, 'results': serializer.data})


class NotificationMarkReadView(JWTView):
    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, recipient=request.current_user,
        ).update(is_read=True)
        if not updated:
            return Response({'error': 'Notification not found.'}, status=404)
        return Response({'message': 'Marked as read.'})


class NotificationMarkAllReadView(JWTView):
    def post(self, request):
        Notification.objects.filter(
            recipient=request.current_user, is_read=False,
        ).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})
