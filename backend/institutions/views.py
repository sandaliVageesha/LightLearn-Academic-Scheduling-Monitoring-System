from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse as DjangoJsonResponse, HttpResponse
from django.db import models
from django.utils import timezone
import csv
import json
from .models import Institution, User, ActivityLog, LoginActivity, StudentGuardian, Manager, Educator, Student, Guardian, Course, Batch
from .serializers import InstitutionListSerializer, ActivityLogSerializer, LoginActivitySerializer
from managers.serializers import ManagerListSerializer
from educators.serializers import EducatorSerializer
from students.serializers import StudentListSerializer, GuardianSerializer
from .services import InstitutionService
from .jwt_utils import decode_token
from .access import (
    load_permissions, has_permission, resolve_institution_id, scoped_institution_filter,
    is_institution_allowed, owned_institution_ids, institution_member_user_ids,
)
import jwt


# ---------------------------------------------------------------------------
# Base class — replaces ProtectedView
# Reads the access_token cookie, decodes it, sets request.current_user.
# Override allowed_roles = [...] in subclasses to restrict by role.
# Override permission_map = {'GET': 'view_x', 'POST': 'create_x', ...} to
# additionally require a specific permission (from roles_permissions) per
# HTTP method — checked after allowed_roles, before the view method runs.
# SUPER_ADMIN always bypasses both checks.
# ---------------------------------------------------------------------------

class JWTView(APIView):
    allowed_roles = None
    permission_map = None

    def dispatch(self, request, *args, **kwargs):
        # Header takes priority over the cookie so that multiple tabs of the
        # same browser (which share one cookie jar) can each act as a
        # different logged-in user via their own per-tab bearer token.
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
        else:
            token = request.COOKIES.get('access_token')

        if not token:
            return DjangoJsonResponse(
                {'error': 'Authentication required.'},
                status=401
            )

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return DjangoJsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return DjangoJsonResponse({'error': 'Invalid token.'}, status=401)

        if payload.get('token_type') != 'access':
            return DjangoJsonResponse({'error': 'Invalid token type.'}, status=401)

        if self.allowed_roles:
            user_role = payload.get('role', '').upper()
            allowed = [r.upper() for r in self.allowed_roles]
            if user_role not in allowed:
                return DjangoJsonResponse({'error': 'Permission denied.'}, status=403)

        try:
            user = User.objects.select_related('role').get(id=payload['user_id'])
        except User.DoesNotExist:
            return DjangoJsonResponse({'error': 'User not found.'}, status=401)

        # Attach institution_id from JWT payload so services can read it
        # without an extra DB query
        user.institution_id = payload.get('institution_id')
        user.permissions = load_permissions(user)

        if self.permission_map:
            required = self.permission_map.get(request.method)
            if required and not has_permission(user, required):
                return DjangoJsonResponse({'error': 'Permission denied.'}, status=403)

        request.current_user = user
        return super().dispatch(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Institution views
# ---------------------------------------------------------------------------

class InstitutionPublicListView(APIView):
    """
    Public, unauthenticated: the institution picker on the student signup
    page. Deliberately exposes only id/name — nothing sensitive.
    """

    def get(self, request):
        institutions = Institution.objects.filter(is_deleted=False).order_by('name')
        return Response([{'id': i.id, 'name': i.name} for i in institutions])


class InstitutionRegisterView(APIView):
    """
    Public, unauthenticated: a prospective institution owner registers their
    institution from the landing page. Unlike student signup, this does NOT
    log the user in — the institution is created with status=PENDING and a
    super admin must approve it (see InstitutionStatusView) before the owner
    can log in (enforced in auth.views.login_view).
    """

    def post(self, request):
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        try:
            institution = InstitutionService.create_institution(
                data=data, logo=logo, status='PENDING',
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'message': 'Registration submitted. A super admin will review it shortly.',
                'data': InstitutionListSerializer(institution, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class InstitutionStatusView(JWTView):
    """Super admin approves or rejects a pending institution registration."""
    allowed_roles = ['SUPER_ADMIN']

    def patch(self, request, pk):
        try:
            institution = Institution.objects.get(pk=pk, is_deleted=False)
        except Institution.DoesNotExist:
            return Response({'error': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = (request.data.get('status') or '').upper()
        try:
            updated = InstitutionService.set_status(institution, new_status, actor=request.current_user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InstitutionListSerializer(updated, context={'request': request})
        return Response({'message': f'Institution {new_status.lower()}.', 'data': serializer.data})


class InstitutionListCreateView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    # No create_institution/delete_institution permission exists in the
    # permissions table yet — POST stays gated by allowed_roles only.
    # GET is authorized manually below: view_institution holders get the
    # full (role-scoped) list; everyone else (MANAGER/EDUCATOR/STUDENT —
    # whose forms need to know their *own* institution for dropdowns, even
    # without the staff browsing permission) gets just their own institution.

    def get(self, request):
        user = request.current_user
        institutions = Institution.objects.filter(is_deleted=False).select_related('owner')

        if has_permission(user, 'view_institution'):
            institutions = institutions.filter(**scoped_institution_filter(user, field='id'))
        else:
            inst_id = resolve_institution_id(user)
            institutions = institutions.filter(id=inst_id) if inst_id else institutions.none()

        serializer = InstitutionListSerializer(
            institutions,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        # current_user is now a real User object
        data['owner_id'] = request.current_user.id

        try:
            institution = InstitutionService.create_institution(
                data=data,
                logo=logo,
                actor=request.current_user,
            )
            serializer = InstitutionListSerializer(
                institution,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class InstitutionDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER']
    # No delete_institution permission exists yet — DELETE stays
    # gated by allowed_roles only. GET is authorized manually (see below).
    permission_map = {'PUT': 'edit_institution'}

    def get_object(self, pk):
        try:
            return Institution.objects.select_related('owner').get(
                pk=pk, is_deleted=False
            )
        except Institution.DoesNotExist:
            return None

    def get(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.current_user
        can_view = has_permission(user, 'view_institution') or is_institution_allowed(user, institution.id)
        if not can_view:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = InstitutionListSerializer(
            institution, context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        logo = request.FILES.get('logo')

        try:
            updated = InstitutionService.update_institution(
                institution, data=data, logo=logo, actor=request.current_user,
            )
            serializer = InstitutionListSerializer(
                updated, context={'request': request}
            )
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, pk):
        institution = self.get_object(pk)
        if not institution:
            return Response(
                {'error': 'Institution not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        InstitutionService.soft_delete_institution(institution, actor=request.current_user)
        return Response(
            {'message': 'Institution deleted successfully.'},
            status=status.HTTP_200_OK
        )


# ---------------------------------------------------------------------------
# Owner Users — every user enrolled in an OWNER's institution(s), grouped
# by category. Powers the Owner dashboard's Users page.
# ---------------------------------------------------------------------------

class OwnerUsersListView(JWTView):
    allowed_roles = ['OWNER']

    def get(self, request):
        institution_ids = owned_institution_ids(request.current_user)

        managers = Manager.objects.filter(
            institution_id__in=institution_ids
        ).select_related('user', 'institution')

        educators = Educator.objects.filter(
            institution_id__in=institution_ids
        ).select_related('institution', 'user')

        students = Student.objects.filter(
            institution_id__in=institution_ids, is_deleted=False
        ).select_related('batch', 'institution')

        guardian_ids = StudentGuardian.objects.filter(
            student__institution_id__in=institution_ids, student__is_deleted=False,
        ).values_list('guardian_id', flat=True).distinct()
        guardians = Guardian.objects.filter(id__in=guardian_ids)

        course_count = Course.objects.filter(
            institution_id__in=institution_ids, is_deleted=False
        ).count()
        batch_count = Batch.objects.filter(institution_id__in=institution_ids).count()

        return Response({
            'managers':     ManagerListSerializer(managers, many=True).data,
            'educators':    EducatorSerializer(educators, many=True, context={'request': request}).data,
            'students':     StudentListSerializer(students, many=True).data,
            'guardians':    GuardianSerializer(guardians, many=True).data,
            'course_count': course_count,
            'batch_count':  batch_count,
        })


# ---------------------------------------------------------------------------
# Maintenance — Audit Logs & Login Activity (super admin only)
# ---------------------------------------------------------------------------

class AuditLogListView(JWTView):
    """
    Audit trail of create/update/delete actions. Optional ?search= filters
    by actor username/email.

    SUPER_ADMIN sees the platform-wide institution-approval trail. OWNER
    sees activity across every module, scoped to the users enrolled in
    their own institution(s) (managers, educators, students, guardians).
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER']

    def get(self, request):
        user = request.current_user
        logs = ActivityLog.objects.select_related('actor')

        if user.role.name.upper() == 'OWNER':
            member_ids = institution_member_user_ids(owned_institution_ids(user))
            logs = logs.filter(actor_id__in=member_ids)
        else:
            logs = logs.filter(module='INSTITUTION')

        search = request.query_params.get('search', '').strip()
        if search:
            logs = logs.filter(
                models.Q(actor__username__icontains=search) |
                models.Q(actor__email__icontains=search) |
                models.Q(description__icontains=search)
            )

        serializer = ActivityLogSerializer(logs[:500], many=True)
        return Response(serializer.data)


class LoginActivityListView(JWTView):
    """
    Login/logout audit trail. Optional ?search= filters by email.

    SUPER_ADMIN sees every account platform-wide. OWNER only sees logins
    from users enrolled in their own institution(s).
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER']

    def get(self, request):
        user = request.current_user
        logins = LoginActivity.objects.all()

        if user.role.name.upper() == 'OWNER':
            member_ids = institution_member_user_ids(owned_institution_ids(user))
            logins = logins.filter(user_id__in=member_ids)

        search = request.query_params.get('search', '').strip()
        if search:
            logins = logins.filter(email__icontains=search)

        action = request.query_params.get('action', '').strip().upper()
        if action in ('LOGIN', 'LOGOUT'):
            logins = logins.filter(action=action)

        serializer = LoginActivitySerializer(logins[:500], many=True)
        return Response(serializer.data)


INSTITUTION_REPORT_HEADERS = [
    'Institution', 'Owner Name', 'Owner Email', 'Status',
    'Managers', 'Educators', 'Students', 'Parents', 'Courses', 'Created At',
]
AUDIT_LOG_REPORT_HEADERS = ['Actor', 'Actor Email', 'Action', 'Module', 'Description', 'Date & Time']
LOGIN_ACTIVITY_REPORT_HEADERS = ['Email', 'Action', 'IP Address', 'Date & Time']


def _collect_institution_details(institution_ids=None):
    """
    Institution details (owner + head counts) — shared by the Analytics
    page's table (JSON, via InstitutionDetailsListView) and the CSV/PDF
    maintenance report (MaintenanceReportView). Pass institution_ids to
    restrict to a single OWNER's own institution(s).
    """
    rows = []
    institutions = Institution.objects.filter(is_deleted=False).select_related('owner')
    if institution_ids is not None:
        institutions = institutions.filter(id__in=institution_ids)
    for inst in institutions:
        parent_count = StudentGuardian.objects.filter(
            student__institution_id=inst.id, student__is_deleted=False,
        ).values('guardian_id').distinct().count()
        rows.append({
            'id':          inst.id,
            'name':        inst.name,
            'owner_name':  inst.owner.username if inst.owner else '',
            'owner_email': inst.owner.email if inst.owner else '',
            'status':      inst.status,
            'managers':    inst.managers.count(),
            'educators':   inst.educators.count(),
            'students':    inst.students.filter(is_deleted=False).count(),
            'parents':     parent_count,
            'courses':     inst.courses.filter(is_deleted=False).count(),
            'created_at':  inst.created_at,
        })
    return rows


class InstitutionDetailsListView(JWTView):
    """Institution details (owner + head counts) for the Analytics page table."""
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        rows = _collect_institution_details()
        for row in rows:
            row['created_at'] = row['created_at'].isoformat()
        return Response(rows)


class MaintenanceReportView(JWTView):
    """
    Downloadable report (CSV or PDF, via ?format=) bundling institution
    details (owner + head counts), audit logs, and login activity — for
    offline record-keeping.

    SUPER_ADMIN gets the platform-wide report. OWNER gets a report scoped
    to their own institution(s) and its enrolled users.
    """
    allowed_roles = ['SUPER_ADMIN', 'OWNER']

    def _collect_report_data(self, user):
        is_owner = user.role.name.upper() == 'OWNER'
        institution_ids = owned_institution_ids(user) if is_owner else None

        institutions_rows = [
            [
                inst['name'], inst['owner_name'], inst['owner_email'], inst['status'],
                inst['managers'], inst['educators'], inst['students'], inst['parents'],
                inst['courses'], inst['created_at'].strftime('%Y-%m-%d %H:%M'),
            ]
            for inst in _collect_institution_details(institution_ids)
        ]

        logs = ActivityLog.objects.select_related('actor').order_by('-timestamp')
        if is_owner:
            member_ids = institution_member_user_ids(institution_ids)
            logs = logs.filter(actor_id__in=member_ids)
        else:
            logs = logs.filter(module='INSTITUTION')
        audit_rows = []
        for log in logs[:500]:
            audit_rows.append([
                log.actor.username if log.actor else 'System',
                log.actor.email if log.actor else '',
                log.action,
                log.module,
                log.description,
                log.timestamp.strftime('%Y-%m-%d %H:%M'),
            ])

        logins = LoginActivity.objects.order_by('-timestamp')
        if is_owner:
            logins = logins.filter(user_id__in=member_ids)
        login_rows = []
        for entry in logins[:500]:
            login_rows.append([
                entry.email,
                entry.action,
                entry.ip_address or '',
                entry.timestamp.strftime('%Y-%m-%d %H:%M'),
            ])

        return institutions_rows, audit_rows, login_rows

    def _render_csv(self, institutions_rows, audit_rows, login_rows):
        response = HttpResponse(content_type='text/csv')
        writer = csv.writer(response)

        writer.writerow(['INSTITUTION DETAILS'])
        writer.writerow(INSTITUTION_REPORT_HEADERS)
        writer.writerows(institutions_rows)

        writer.writerow([])
        writer.writerow(['AUDIT LOGS (INSTITUTION ACTIVITY)'])
        writer.writerow(AUDIT_LOG_REPORT_HEADERS)
        writer.writerows(audit_rows)

        writer.writerow([])
        writer.writerow(['LOGIN ACTIVITY'])
        writer.writerow(LOGIN_ACTIVITY_REPORT_HEADERS)
        writer.writerows(login_rows)

        return response

    def _render_pdf(self, institutions_rows, audit_rows, login_rows):
        from io import BytesIO
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.units import cm
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=landscape(A4),
            topMargin=1.5 * cm, bottomMargin=1.5 * cm, leftMargin=1.5 * cm, rightMargin=1.5 * cm,
        )
        styles = getSampleStyleSheet()
        cell_style = ParagraphStyle('cell', parent=styles['BodyText'], fontSize=7, leading=9)

        elements = [
            Paragraph('LightLearn Maintenance Report', styles['Title']),
            Paragraph(timezone.now().strftime('Generated %d %b %Y, %I:%M %p'), styles['Normal']),
            Spacer(1, 0.6 * cm),
        ]

        def add_section(title, headers, rows):
            elements.append(Paragraph(title, styles['Heading2']))
            elements.append(Spacer(1, 0.2 * cm))
            if not rows:
                elements.append(Paragraph('No records.', styles['Normal']))
            else:
                body = [[Paragraph(str(cell), cell_style) for cell in row] for row in rows]
                table = Table([headers] + body, repeatRows=1)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ]))
                elements.append(table)
            elements.append(Spacer(1, 0.8 * cm))

        add_section('Institution Details', INSTITUTION_REPORT_HEADERS, institutions_rows)
        add_section('Audit Logs (Institution Activity)', AUDIT_LOG_REPORT_HEADERS, audit_rows)
        add_section('Login Activity', LOGIN_ACTIVITY_REPORT_HEADERS, login_rows)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return HttpResponse(pdf_bytes, content_type='application/pdf')

    def get(self, request):
        # Note: deliberately named "type", not "format" — DRF reserves the
        # "format" query param for its own content-negotiation and 404s
        # when the value doesn't match a registered renderer (e.g. "csv").
        fmt = (request.query_params.get('type') or 'csv').lower()
        institutions_rows, audit_rows, login_rows = self._collect_report_data(request.current_user)

        if fmt == 'pdf':
            response = self._render_pdf(institutions_rows, audit_rows, login_rows)
            ext = 'pdf'
        else:
            response = self._render_csv(institutions_rows, audit_rows, login_rows)
            ext = 'csv'

        filename = f"lightlearn-maintenance-report-{timezone.now().strftime('%Y%m%d-%H%M%S')}.{ext}"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response