from django.db.models import Q
from .models import Notification, User


class NotificationService:
    """
    Thin wrapper around Notification creation. Called from the service
    layers of features whose lifecycle events matter to other roles
    (institution approval, complaints/help, student enrolment) — see
    institutions/services.py, complaints/services.py, and
    students/services.py for the actual trigger points.
    """

    @staticmethod
    def notify(recipient, title, message='', link=''):
        if recipient is None:
            return None
        return Notification.objects.create(
            recipient=recipient, title=title, message=message, link=link,
        )

    @staticmethod
    def notify_super_admins(title, message='', link=''):
        recipients = User.objects.filter(role__name__iexact='SUPER_ADMIN', is_active=True)
        Notification.objects.bulk_create([
            Notification(recipient=user, title=title, message=message, link=link)
            for user in recipients
        ])

    @staticmethod
    def notify_institution_staff(institution_id, title, message='', link=''):
        """
        Notify everyone who administers this institution — its owner and
        all of its managers — e.g. when a student is added or a
        self-registered student needs a batch assigned.
        """
        if not institution_id:
            return
        recipients = User.objects.filter(
            Q(owned_institutions__id=institution_id) |
            Q(manager_profile__institution_id=institution_id),
            is_active=True,
        ).distinct()
        Notification.objects.bulk_create([
            Notification(recipient=user, title=title, message=message, link=link)
            for user in recipients
        ])
