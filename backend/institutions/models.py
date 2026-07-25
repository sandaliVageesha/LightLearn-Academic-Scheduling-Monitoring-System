from django.db import models
import uuid
import hashlib


# ---------------------------------------------------------------------------
# Auth / RBAC
# ---------------------------------------------------------------------------

class Module(models.Model):
    """Top-level functional area e.g. 'Course Management'."""
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'modules'

    def __str__(self):
        return self.name


class Permission(models.Model):
    """A named permission scoped to a module."""
    name    = models.CharField(max_length=50)
    modules = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='permissions'
    )

    class Meta:
        db_table = 'permissions'

    def __str__(self):
        return self.name


class Role(models.Model):
    """
    Named role row — ADMIN, OWNER, MANAGER, EDUCATOR, STUDENT, PARENT.
    Replaces the old ROLE_CHOICES CharField on User.
    Seed with a data migration.
    """
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Many-to-many join: roles ↔ permissions."""
    role       = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name='role_permissions'
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name='role_permissions'
    )

    class Meta:
        db_table = 'roles_permissions'
        unique_together = ('role', 'permission')


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(models.Model):
    username              = models.CharField(max_length=150, unique=True)
    email                 = models.EmailField(unique=True)
    hashed_password       = models.CharField(max_length=256)
    salt                  = models.CharField(max_length=64)
    profile_picture       = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    role                  = models.ForeignKey(
        Role, on_delete=models.PROTECT, related_name='users'
    )
    is_active             = models.BooleanField(default=True)
    is_email_verified     = models.BooleanField(default=True)
    email_verify_token    = models.CharField(max_length=64, null=True, blank=True)
    password_reset_token  = models.CharField(max_length=64, null=True, blank=True)
    password_reset_expiry = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'user'

    def __str__(self):
        return self.username

    @staticmethod
    def hash_password(password: str, salt: str = None):
        """Hash a password with a salt. Returns (hashed_password, salt)."""
        if salt is None:
            salt = uuid.uuid4().hex
        hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
        return hashed, salt

    def set_password(self, raw_password: str):
        self.hashed_password, self.salt = self.hash_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        hashed, _ = self.hash_password(raw_password, self.salt)
        return hashed == self.hashed_password


# ---------------------------------------------------------------------------
# Institution
# ---------------------------------------------------------------------------

class Institution(models.Model):
    STATUS_CHOICES = [
        ('PENDING',  'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    name       = models.CharField(max_length=255)
    logo       = models.ImageField(upload_to='institution_logos/', null=True, blank=True)
    owner      = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_institutions'
    )
    # Self-registered institutions start PENDING until a super admin
    # approves them; institutions created by an already-authenticated
    # SUPER_ADMIN/OWNER/MANAGER default to APPROVED (no review needed).
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPROVED')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institutions'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Manager
# ---------------------------------------------------------------------------

class Manager(models.Model):
    name        = models.CharField(max_length=255)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='managers'
    )
    user        = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='manager_profile'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'managers'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Educator
# ---------------------------------------------------------------------------

class Educator(models.Model):
    user        = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='educator_profile'
    )
    edu_id      = models.CharField(max_length=50)
    name        = models.CharField(max_length=255)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='educators'
    )
    email       = models.EmailField()
    phone       = models.CharField(max_length=50, blank=True)
    photo       = models.ImageField(upload_to='educators/photos/', blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'educators'

    def __str__(self):
        return f"{self.edu_id} - {self.name}"


# ---------------------------------------------------------------------------
# Batch
# ---------------------------------------------------------------------------

class Batch(models.Model):
    name        = models.CharField(max_length=50)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='batches'
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'batches'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.institution.name}"


# ---------------------------------------------------------------------------
# Guardian
# ---------------------------------------------------------------------------

class Guardian(models.Model):
    name       = models.CharField(max_length=50)
    email      = models.EmailField(max_length=45, null=True, blank=True)
    phone      = models.CharField(max_length=20, null=True, blank=True)
    user       = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='guardian_profile'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guardians'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------

class Student(models.Model):
    name            = models.CharField(max_length=50)
    institution     = models.ForeignKey(
        Institution,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='students'
    )
    batch           = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='students'
    )
    email           = models.EmailField(max_length=45, unique=True)
    phone           = models.CharField(max_length=20, null=True, blank=True)
    registration_no = models.CharField(max_length=45, unique=True)
    user            = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='student_profile'
    )
    is_deleted      = models.BooleanField(default=False)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return f"{self.name} ({self.registration_no})"


class StudentGuardian(models.Model):
    """Many-to-many join: students ↔ guardians."""
    student  = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name='student_guardians'
    )
    guardian = models.ForeignKey(
        Guardian, on_delete=models.CASCADE, related_name='guardian_students'
    )

    class Meta:
        db_table        = 'students_guardians'
        unique_together = ('student', 'guardian')

    def __str__(self):
        return f"{self.student.name} ↔ {self.guardian.name}"


# ---------------------------------------------------------------------------
# Course, CourseBatch, Allocation
# ---------------------------------------------------------------------------

class Course(models.Model):
    name        = models.CharField(max_length=255)
    code        = models.CharField(max_length=50, unique=True)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='courses'
    )
    is_deleted  = models.BooleanField(default=False)

    class Meta:
        db_table = 'courses'

    def __str__(self):
        return f"{self.code} - {self.name}"


class CourseBatch(models.Model):
    """Join table: courses ↔ batches."""
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='course_batches'
    )
    batch  = models.ForeignKey(
        Batch, on_delete=models.CASCADE, related_name='course_batches'
    )

    class Meta:
        db_table        = 'courses_batch'
        unique_together = ('course', 'batch')


class Allocation(models.Model):
    """Which educator teaches which course."""
    course   = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='allocations'
    )
    educator = models.ForeignKey(
        Educator, on_delete=models.CASCADE, related_name='allocations'
    )

    class Meta:
        db_table        = 'allocations'
        unique_together = ('course', 'educator')


# ---------------------------------------------------------------------------
# Enrolment, Activity, Progress
# ---------------------------------------------------------------------------

class Enrolment(models.Model):
    student       = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name='enrolments'
    )
    course        = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='enrolments'
    )
    enrolled_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table        = 'enrollments'   
        unique_together = ('student', 'course')


class Activity(models.Model):
    name        = models.CharField(max_length=50)
    course      = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='activities'
    )
    due_date    = models.CharField(max_length=45, blank=True)
    description = models.CharField(max_length=45, blank=True)
    optional    = models.BooleanField(default=False)

    class Meta:
        db_table = 'activities'             

    def __str__(self):
        return self.name


class Progress(models.Model):
    student      = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name='progress_records'
    )
    activity     = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name='progress_records'
    )
    # Educator-assigned grade — nullable so a row can exist purely from a
    # student's own completed/completed_at self-report, before any grading.
    value        = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    # Student-controlled "I did this" flag — independent of the educator's
    # grade above; toggling it never touches `value`.
    completed    = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table        = 'progress'
        unique_together = ('student', 'activity')


# ---------------------------------------------------------------------------
# Event (calendar)
# ---------------------------------------------------------------------------

class Event(models.Model):
    """
    A calendar entry. If `course` is set, the event is visible to everyone
    enrolled in / teaching that course. If `course` is null, the event is
    personal — visible only to `created_by`.
    """
    EVENT_TYPES = [
        ('class',      'Class'),
        ('assignment', 'Assignment'),
        ('exam',       'Exam'),
        ('holiday',    'Holiday'),
        ('meeting',    'Meeting'),
        ('personal',   'Personal'),
    ]

    title       = models.CharField(max_length=150)
    description = models.CharField(max_length=500, blank=True)
    event_type  = models.CharField(max_length=20, choices=EVENT_TYPES, default='personal')
    start       = models.DateTimeField()
    end         = models.DateTimeField(null=True, blank=True)
    all_day     = models.BooleanField(default=False)

    course      = models.ForeignKey(
        Course, on_delete=models.CASCADE, null=True, blank=True, related_name='events'
    )
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name='events'
    )
    created_by  = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_events'
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'events'
        ordering = ['start']

    def __str__(self):
        return f"{self.title} ({self.start:%Y-%m-%d})"


# ---------------------------------------------------------------------------
# ActivityLog
# ---------------------------------------------------------------------------

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ]
    MODULE_CHOICES = [
        ('INSTITUTION', 'Institution'),
        ('COURSE',      'Course'),
        ('EDUCATOR',    'Educator'),
        ('BATCH',       'Batch'),
        ('STUDENT',     'Student'),
    ]

    # Who performed the action. Null for actions with no authenticated actor
    # (e.g. a prospective owner self-registering their institution).
    actor       = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='activity_logs',
    )
    module      = models.CharField(max_length=20, choices=MODULE_CHOICES)
    action      = models.CharField(max_length=10, choices=ACTION_CHOICES)
    description = models.CharField(max_length=255)
    timestamp   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.module}] {self.action} — {self.description}"


# ---------------------------------------------------------------------------
# LoginActivity — audit trail of login/logout events (super admin only)
# ---------------------------------------------------------------------------

class LoginActivity(models.Model):
    ACTION_CHOICES = [
        ('LOGIN',  'Login'),
        ('LOGOUT', 'Logout'),
    ]

    # Kept as a nullable FK + a plain email field: the user row could later
    # be deleted, but the audit trail should still show who it was.
    user       = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='login_activities',
    )
    email      = models.EmailField()
    action     = models.CharField(max_length=10, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'login_activities'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.email} — {self.action} @ {self.timestamp}"


# ---------------------------------------------------------------------------
# Complaint (Help / Complaints inbox for the super admin)
# ---------------------------------------------------------------------------

class Complaint(models.Model):
    """
    A help request or complaint filed by any non-super-admin user, answered
    by a super admin. Replies are in-app only (no outbound email).
    """
    TYPE_CHOICES = [
        ('COMPLAINT', 'Complaint'),
        ('HELP',      'Help Request'),
    ]
    STATUS_CHOICES = [
        ('OPEN',        'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED',    'Resolved'),
    ]

    type    = models.CharField(max_length=20, choices=TYPE_CHOICES, default='HELP')
    subject = models.CharField(max_length=150)
    message = models.TextField()
    status  = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')

    reply      = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    replied_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='complaint_replies',
    )

    submitted_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='complaints'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'complaints'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.subject}"


# ---------------------------------------------------------------------------
# ContactInquiry (public landing-page contact form -> super admin inbox)
# ---------------------------------------------------------------------------

class ContactInquiry(models.Model):
    """
    A message submitted through the public marketing site's contact form,
    from a visitor with no LightLearn account. Reviewed by super admins only.
    """
    ENQUIRY_CHOICES = [
        ('GENERAL',     'General Enquiry'),
        ('DEMO',        'Request a Demo'),
        ('PRICING',     'Pricing & Plans'),
        ('SUPPORT',     'Technical Support'),
        ('PARTNERSHIP', 'Partnership'),
    ]
    STATUS_CHOICES = [
        ('NEW',      'New'),
        ('REVIEWED', 'Reviewed'),
    ]

    first_name       = models.CharField(max_length=100)
    last_name        = models.CharField(max_length=100)
    email            = models.EmailField()
    institution_name = models.CharField(max_length=200, blank=True)
    enquiry_type     = models.CharField(max_length=20, choices=ENQUIRY_CHOICES, default='GENERAL')
    message          = models.TextField()
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contact_inquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"


# ---------------------------------------------------------------------------
# Notification — per-user alerts, surfaced in the dashboard navbar bell
# ---------------------------------------------------------------------------

class Notification(models.Model):
    recipient  = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications'
    )
    title      = models.CharField(max_length=150)
    message    = models.CharField(max_length=255, blank=True)
    # Frontend route to navigate to when the notification is clicked, e.g.
    # "/superadmin/messages". Blank if the notification isn't actionable.
    link       = models.CharField(max_length=255, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.recipient.email}] {self.title}"