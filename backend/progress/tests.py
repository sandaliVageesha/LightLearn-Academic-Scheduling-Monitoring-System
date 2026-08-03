from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from .models import Activities, Progress


class ActivitiesModelTest(TestCase):
    def setUp(self):
        self.activity_data = {
            'name': 'Test Activity',
            'description': 'Test Description',
            'due_date': timezone.now() + timedelta(days=7),
            'courses_id': 1,
            'optional': False
        }

    def test_activity_creation(self):
        activity = Activities.objects.create(**self.activity_data)
        self.assertEqual(activity.name, 'Test Activity')
        self.assertFalse(activity.optional)

    def test_is_overdue_property(self):
        past_due = Activities.objects.create(
            name='Past Due',
            due_date=timezone.now() - timedelta(days=1),
            courses_id=1
        )
        self.assertTrue(past_due.is_overdue)
        
        future_due = Activities.objects.create(
            name='Future Due',
            due_date=timezone.now() + timedelta(days=1),
            courses_id=1
        )
        self.assertFalse(future_due.is_overdue)


class ProgressModelTest(TestCase):
    def test_progress_validation(self):
        with self.assertRaises(Exception):
            progress = Progress.objects.create(
                students_id=1,
                activities_id=1,
                value=150
            )