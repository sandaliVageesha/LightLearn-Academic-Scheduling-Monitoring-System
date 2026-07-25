from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from institutions.models import Complaint, ContactInquiry
from institutions.notification_service import NotificationService

TYPE_VALUES   = {c[0] for c in Complaint.TYPE_CHOICES}
STATUS_VALUES = {c[0] for c in Complaint.STATUS_CHOICES}

INQUIRY_TYPE_VALUES   = {c[0] for c in ContactInquiry.ENQUIRY_CHOICES}
INQUIRY_STATUS_VALUES = {c[0] for c in ContactInquiry.STATUS_CHOICES}


class ComplaintService:

    @staticmethod
    def list_for_user(user):
        return Complaint.objects.filter(submitted_by=user).select_related(
            'submitted_by', 'submitted_by__role', 'replied_by'
        )

    @staticmethod
    def list_all(status=None, type=None):
        complaints = Complaint.objects.select_related(
            'submitted_by', 'submitted_by__role', 'replied_by'
        )
        if status:
            complaints = complaints.filter(status=status.upper())
        if type:
            complaints = complaints.filter(type=type.upper())
        return complaints

    @staticmethod
    def stats():
        counts = dict(
            Complaint.objects.values_list('status').annotate(count=Count('id'))
        )
        return {
            'open':        counts.get('OPEN', 0),
            'in_progress': counts.get('IN_PROGRESS', 0),
            'resolved':    counts.get('RESOLVED', 0),
            'total':       sum(counts.values()),
        }

    @staticmethod
    @transaction.atomic
    def create(data, user):
        complaint_type = (data.get('type') or 'HELP').upper()
        if complaint_type not in TYPE_VALUES:
            raise ValueError("Invalid message type.")

        subject = (data.get('subject') or '').strip()
        message = (data.get('message') or '').strip()
        if not subject or not message:
            raise ValueError("Subject and message are required.")

        complaint = Complaint.objects.create(
            type=complaint_type,
            subject=subject,
            message=message,
            submitted_by=user,
        )

        NotificationService.notify_super_admins(
            title='New help request' if complaint_type == 'HELP' else 'New complaint',
            message=f"{user.username}: {subject}",
            link='/superadmin/messages',
        )

        return complaint

    @staticmethod
    @transaction.atomic
    def respond(complaint, data, user):
        if 'status' in data and data.get('status'):
            status = data['status'].upper()
            if status not in STATUS_VALUES:
                raise ValueError("Invalid status.")
            complaint.status = status

        if 'reply' in data:
            reply = (data.get('reply') or '').strip()
            complaint.reply = reply
            if reply:
                complaint.replied_by = user
                complaint.replied_at = timezone.now()

        complaint.save()

        if 'reply' in data and (data.get('reply') or '').strip():
            NotificationService.notify(
                complaint.submitted_by,
                title='Your message received a reply',
                message=complaint.subject,
                link='/help',
            )

        return complaint


class ContactInquiryService:

    @staticmethod
    def list_all(status=None):
        inquiries = ContactInquiry.objects.all()
        if status:
            inquiries = inquiries.filter(status=status.upper())
        return inquiries

    @staticmethod
    def stats():
        counts = dict(
            ContactInquiry.objects.values_list('status').annotate(count=Count('id'))
        )
        return {
            'new':      counts.get('NEW', 0),
            'reviewed': counts.get('REVIEWED', 0),
            'total':    sum(counts.values()),
        }

    @staticmethod
    @transaction.atomic
    def create(data):
        first_name = (data.get('first_name') or '').strip()
        last_name  = (data.get('last_name') or '').strip()
        email      = (data.get('email') or '').strip()
        message    = (data.get('message') or '').strip()

        if not first_name or not last_name or not email or not message:
            raise ValueError("First name, last name, email and message are required.")

        enquiry_type = (data.get('enquiry_type') or 'GENERAL').upper()
        if enquiry_type not in INQUIRY_TYPE_VALUES:
            raise ValueError("Invalid enquiry type.")

        return ContactInquiry.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            institution_name=(data.get('institution_name') or '').strip(),
            enquiry_type=enquiry_type,
            message=message,
        )

    @staticmethod
    @transaction.atomic
    def mark_status(inquiry, status):
        status = (status or '').upper()
        if status not in INQUIRY_STATUS_VALUES:
            raise ValueError("Invalid status.")
        inquiry.status = status
        inquiry.save(update_fields=['status'])
        return inquiry
