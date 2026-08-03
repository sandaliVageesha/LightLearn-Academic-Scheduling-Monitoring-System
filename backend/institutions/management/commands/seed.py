from django.core.management.base import BaseCommand

from institutions.models import User, Institution
from educators.models import Educator
from course.models import Course, CourseBatch, Allocation
from batches.models import Batch


class Command(BaseCommand):
    help = "Seed the database with sample data"

    def handle(self, *args, **kwargs):

        self.stdout.write(self.style.WARNING("Deleting old data..."))

        Allocation.objects.all().delete()
        CourseBatch.objects.all().delete()
        Course.objects.all().delete()
        Educator.objects.all().delete()
        Batch.objects.all().delete()
        Institution.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("Creating Users..."))

        owner = User(
            username="owner",
            email="owner@test.com",
            role="OWNER",
            is_active=True,
            is_email_verified=True
        )
        owner.set_password("123456")
        owner.save()

        edu_user1 = User(
            username="educator1",
            email="educator1@test.com",
            role="EDUCATOR",
            is_active=True,
            is_email_verified=True
        )
        edu_user1.set_password("123456")
        edu_user1.save()

        edu_user2 = User(
            username="educator2",
            email="educator2@test.com",
            role="EDUCATOR",
            is_active=True,
            is_email_verified=True
        )
        edu_user2.set_password("123456")
        edu_user2.save()

        self.stdout.write(self.style.SUCCESS("Creating Institution..."))

        institution = Institution.objects.create(
            name="ABC Institute",
            owner=owner
        )

        self.stdout.write(self.style.SUCCESS("Creating Educators..."))

        educator1 = Educator.objects.create(
            user=edu_user1,
            edu_id="ED001",
            name="John Silva",
            institution=institution,
            email="educator1@test.com",
            phone="0711111111"
        )

        educator2 = Educator.objects.create(
            user=edu_user2,
            edu_id="ED002",
            name="Mary Perera",
            institution=institution,
            email="educator2@test.com",
            phone="0722222222"
        )

        self.stdout.write(self.style.SUCCESS("Creating Courses..."))

        course1 = Course.objects.create(
            name="Database Systems",
            code="DB101",
            institution=institution
        )

        course2 = Course.objects.create(
            name="Web Development",
            code="WD102",
            institution=institution
        )

        course3 = Course.objects.create(
            name="Software Engineering",
            code="SE103",
            institution=institution
        )

        self.stdout.write(self.style.SUCCESS("Creating Batches..."))

        batch1 = Batch.objects.create(
            name="Batch 2025",
            institution=institution
        )

        batch2 = Batch.objects.create(
            name="Batch 2026",
            institution=institution
        )

        self.stdout.write(self.style.SUCCESS("Assigning Courses to Batches..."))

        CourseBatch.objects.create(course=course1, batch=batch1)
        CourseBatch.objects.create(course=course2, batch=batch1)
        CourseBatch.objects.create(course=course3, batch=batch2)

        self.stdout.write(self.style.SUCCESS("Allocating Educators..."))

        Allocation.objects.create(course=course1, educator=educator1)
        Allocation.objects.create(course=course2, educator=educator2)
        Allocation.objects.create(course=course3, educator=educator1)

        self.stdout.write(
            self.style.SUCCESS("\nDatabase seeded successfully!")
        )