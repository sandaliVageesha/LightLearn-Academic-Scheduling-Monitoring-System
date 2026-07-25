import uuid
from django.db import transaction
from institutions.models import Student, Guardian, StudentGuardian
from institutions.models import User
from institutions.models import ActivityLog
from institutions.models import Role
from institutions.models import Institution
from institutions.notification_service import NotificationService

class StudentService:

    @staticmethod
    @transaction.atomic
    def register_student(data):
        """
        Self-service signup: a prospective student creates their own login
        account and picks which institution to enroll in. No batch yet —
        a manager assigns one later from that institution's batch list.
        """
        name            = (data.get('name') or '').strip()
        email           = (data.get('email') or '').strip().lower()
        password        = data.get('password') or ''
        institution_id  = data.get('institution_id')

        if not all([name, email, password, institution_id]):
            raise ValueError('name, email, password, and institution_id are all required.')

        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters.')

        try:
            institution = Institution.objects.get(id=institution_id, is_deleted=False)
        except Institution.DoesNotExist:
            raise ValueError('Selected institution does not exist.')

        if User.objects.filter(email=email).exists():
            raise ValueError('An account with this email already exists.')
        if Student.objects.filter(email=email, is_deleted=False).exists():
            raise ValueError('A student with this email already exists.')

        student_role, _ = Role.objects.get_or_create(name='STUDENT')
        user = User(
            username=email,
            email=email,
            role=student_role,
            is_active=True,
            is_email_verified=True,
        )
        user.set_password(password)
        user.save()

        registration_no = f"STU-{uuid.uuid4().hex[:10].upper()}"
        while Student.objects.filter(registration_no=registration_no).exists():
            registration_no = f"STU-{uuid.uuid4().hex[:10].upper()}"

        student = Student.objects.create(
            name=name,
            email=email,
            registration_no=registration_no,
            institution=institution,
            user=user,
        )

        ActivityLog.objects.create(
            module='STUDENT', action='CREATE',
            description=f"Student '{student.name}' self-registered at {institution.name}."
        )

        NotificationService.notify_institution_staff(
            institution.id,
            title='Student needs approval',
            message=f"'{student.name}' self-registered at {institution.name} and needs a batch assigned.",
            link='/students',
        )

        return student, user

    @staticmethod
    def list_guardians_for_student(student):
        return [
            link.guardian
            for link in StudentGuardian.objects
                .filter(student=student)
                .select_related('guardian')
        ]

    @staticmethod
    @transaction.atomic
    def add_guardian_for_student(student, data):
        """
        Self-service: a student adds a guardian's details from their own
        dashboard. If a guardian with this email already exists (e.g. a
        sibling already added them), we link the existing record instead
        of creating a duplicate — that's what makes both siblings show up
        on the same parent dashboard.
        """
        name  = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        phone = (data.get('phone') or '').strip()

        if not name or not email:
            raise ValueError('Guardian name and email are required.')

        guardian = Guardian.objects.filter(email__iexact=email).first()

        if guardian is None:
            password = data.get('password') or ''
            if len(password) < 8:
                raise ValueError(
                    "This guardian doesn't have an account yet — a password "
                    "(min 8 characters) is required to create one."
                )

            parent_role, _ = Role.objects.get_or_create(name='PARENT')
            user = User(
                username=email,
                email=email,
                role=parent_role,
                is_active=True,
                is_email_verified=True,
            )
            user.set_password(password)
            user.save()

            guardian = Guardian.objects.create(
                name=name, email=email, phone=phone, user=user,
            )
            created = True
        else:
            created = False

        _, linked = StudentGuardian.objects.get_or_create(
            student=student, guardian=guardian,
        )

        ActivityLog.objects.create(
            module='STUDENT', action='UPDATE',
            description=f"Guardian '{guardian.name}' linked to student '{student.name}'."
        )

        return guardian, created, linked

    @staticmethod
    @transaction.atomic
    def create_student(data, guardian_ids=None):
        # Validate unique registration_no
        if Student.objects.filter(
            registration_no=data.get('registration_no'),
            is_deleted=False
        ).exists():
            raise ValueError(
                f"Registration number '{data.get('registration_no')}' already exists."
            )

        # Validate unique email
        if Student.objects.filter(
            email=data.get('email'),
            is_deleted=False
        ).exists():
            raise ValueError(
                f"A student with email '{data.get('email')}' already exists."
            )

        # Create login user account for the student
        student_role, _ = Role.objects.get_or_create(name='STUDENT')
        user = User(
            username=data.get('email'),
            email=data.get('email'),
            role=student_role,
            is_active=True,
            is_email_verified=True,
        )
        user.set_password(data.get('password', data.get('registration_no')))
        user.save()

        # Keep institution in sync with the assigned batch, so every
        # student (regardless of creation path) can be scoped by
        # institution_id directly, without a batch join.
        batch_id = data.get('batch_id')
        institution_id = data.get('institution_id')
        if batch_id and not institution_id:
            from institutions.models import Batch
            institution_id = Batch.objects.filter(id=batch_id).values_list('institution_id', flat=True).first()

        # Create student
        student = Student.objects.create(
            name            = data.get('name'),
            email           = data.get('email'),
            phone           = data.get('phone', ''),
            registration_no = data.get('registration_no'),
            batch_id        = batch_id,
            institution_id  = institution_id,
            user            = user,
        )

        # Link guardians
        if guardian_ids:
            for guardian_id in guardian_ids:
                StudentGuardian.objects.create(
                    student_id  = student.id,
                    guardian_id = guardian_id,
                )

        ActivityLog.objects.create(
            module='STUDENT', action='CREATE',
            description=f"Student '{student.name}' was registered."
        )

        NotificationService.notify_institution_staff(
            institution_id,
            title='Student added',
            message=f"'{student.name}' was added as a student.",
            link='/students',
        )

        return student

    @staticmethod
    @transaction.atomic
    def update_student(student_id, data, guardian_ids=None):
        try:
            student = Student.objects.get(id=student_id, is_deleted=False)
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        # Check registration_no uniqueness (excluding current student)
        if Student.objects.filter(
            registration_no=data.get('registration_no', student.registration_no),
            is_deleted=False
        ).exclude(id=student_id).exists():
            raise ValueError('Registration number already in use.')

        # Check email uniqueness (excluding current student)
        if Student.objects.filter(
            email=data.get('email', student.email),
            is_deleted=False
        ).exclude(id=student_id).exists():
            raise ValueError('Email already in use by another student.')

        # Update fields
        student.name            = data.get('name',            student.name)
        student.email           = data.get('email',           student.email)
        student.phone           = data.get('phone',           student.phone)
        student.registration_no = data.get('registration_no', student.registration_no)

        new_batch_id = data.get('batch_id', student.batch_id)
        if new_batch_id != student.batch_id:
            from institutions.models import Batch
            student.institution_id = Batch.objects.filter(
                id=new_batch_id
            ).values_list('institution_id', flat=True).first()
        student.batch_id = new_batch_id
        student.save()

        # Update linked user email/username too
        if student.user:
            student.user.email    = student.email
            student.user.username = student.email
            student.user.save()

        # Replace guardian links
        if guardian_ids is not None:
            StudentGuardian.objects.filter(student=student).delete()
            for guardian_id in guardian_ids:
                StudentGuardian.objects.create(
                    student_id  = student.id,
                    guardian_id = guardian_id,
                )

        ActivityLog.objects.create(
            module='STUDENT', action='UPDATE',
            description=f"Student '{student.name}' was updated."
        )

        return student

    @staticmethod
    @transaction.atomic
    def delete_student(student_id):
        try:
            student = Student.objects.get(id=student_id, is_deleted=False)
        except Student.DoesNotExist:
            raise ValueError('Student not found.')

        # Soft delete student
        student.is_deleted = True
        student.save()

        # Deactivate login account
        if student.user:
            student.user.is_active = False  # we'll add is_active to User model
            student.user.save()

        ActivityLog.objects.create(
            module='STUDENT', action='DELETE',
            description=f"Student '{student.name}' was deleted."
        )

        return True

    @staticmethod
    @transaction.atomic
    def create_guardian(data):
        # Create login user account for the guardian
        # create_guardian — fix
        parent_role, _ = Role.objects.get_or_create(name='PARENT')
        user = User(
            username=data.get('email', data.get('name')),
            email=data.get('email', ''),
            role=parent_role,
            is_active=True,
            is_email_verified=True,
        )
        user.set_password(data.get('password', 'guardian123'))
        user.save()

        guardian = Guardian.objects.create(
            name  = data.get('name'),
            email = data.get('email', ''),
            phone = data.get('phone', ''),
            user  = user,
        )
        return guardian