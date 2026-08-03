from django.db import models
from django.utils import timezone


class Activities(models.Model):
    """
    Activities Model - ER Diagram එකට අනුව
    Table: activities
    Columns: id, name, courses_id, due_date, description, optional
    """
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=45, blank=True, null=True)
    due_date = models.DateTimeField()
    optional = models.BooleanField(default=False)
    
    # Foreign Key to Course (ER Diagram එකට අනුව)
    courses = models.ForeignKey(
        'course.Course',  # 'course' app එකේ Course model එක
        on_delete=models.CASCADE,
        related_name='activities'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'activities'
        verbose_name_plural = 'Activities'
        ordering = ['due_date']
    
    def __str__(self):
        return self.name
    
    @property
    def is_overdue(self):
        """Activity එක overdueද කියලා check කරනවා"""
        return self.due_date < timezone.now() if self.due_date else False
    
    @property
    def progress_summary(self):
        """Activity එකේ progress summary එක ගන්නවා"""
        progress_records = self.progress_set.all()
        total = progress_records.count()
        completed = progress_records.filter(value__gte=100).count()
        return {
            'total_count': total,
            'completed_count': completed
        }


class Progress(models.Model):
    """
    Progress Model - ER Diagram එකට අනුව
    Table: progress
    Columns: id, student_id, activities_id, value
    """
    students = models.ForeignKey(
        'students.Student',  # 'students' app එකේ Student model එක
        on_delete=models.CASCADE,
        related_name='progress'
    )
    activities = models.ForeignKey(
        Activities,
        on_delete=models.CASCADE,
        related_name='progress'
    )
    value = models.DecimalField(
        max_digits=3, 
        decimal_places=0,
        help_text="Progress value from 0 to 100"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'progress'
        verbose_name_plural = 'Progress'
        unique_together = ['students', 'activities']  # Duplicate records වළක්වන්න
    
    def __str__(self):
        return f"{self.students.name} - {self.activities.name}: {self.value}%"
    
    def clean(self):
        """Progress value එක 0-100 අතර වෙන්න ඕන"""
        from django.core.exceptions import ValidationError
        if self.value < 0 or self.value > 100:
            raise ValidationError('Progress value must be between 0 and 100')
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)