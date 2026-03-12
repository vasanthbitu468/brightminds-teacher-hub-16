import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface ClassConfig {
  class_id: string;
  class_name: string;
  grade: string;
  section: string;
  school_id: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface Teacher {
  id: string;
  full_name: string;
  school_id: string;
}

interface AcademicYear {
  academic_year_id: string;
  year_name: string;
}

interface ScheduleEntry {
  class_schedule_id: string;
  class_id: string;
  subject_id: string;
  subject_teacher_id: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  period_num: number;
  school_id: string;
  academic_year_id: string;
  subject_name?: string;
  teacher_name?: string;
}

const WEEKDAYS = [
  { label: 'MON', value: 'MON' },
  { label: 'TUE', value: 'TUE' },
  { label: 'WED', value: 'WED' },
  { label: 'THU', value: 'THU' },
  { label: 'FRI', value: 'FRI' },
  { label: 'SAT', value: 'SAT' },
];

const ClassSchedule = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassConfig[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    teacher_id: '',
    start_time: '',
    duration: '',
    period_num: '',
    weekdays: [] as string[],
  });

  // Top filters
  const [filterClass, setFilterClass] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['ALL']);
  const [selectedActiveYear, setSelectedActiveYear] = useState<string>('');

  // UI states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);
  const [conflict, setConflict] = useState<string>('');

  const fetchSchedule = useCallback(async (academicYearId: string) => {
    try {
      // First, get the schedule data with basic joins
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('class_subject_schedule')
        .select('*')
        .eq('academic_year_id', academicYearId);

      if (scheduleError) throw scheduleError;

      // Enrich the data with subject and teacher names
      const transformedData = await Promise.all(
        (scheduleData || []).map(async (entry: Record<string, unknown>) => {
          let subject_name = 'N/A';
          let teacher_name = 'N/A';

          // Fetch subject name
          if (entry.subject_id) {
            const { data: subjectData } = await supabase
              .from('subjects')
              .select('subject_name')
              .eq('id', entry.subject_id)
              .single();
            subject_name = subjectData?.subject_name || 'N/A';
          }

          // Fetch teacher name from the teacher ID stored in subject_teacher_id
          // subject_teacher_id might be the teacher ID directly
          if (entry.subject_teacher_id) {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('full_name')
              .eq('id', entry.subject_teacher_id)
              .single();
            teacher_name = teacherData?.full_name || 'N/A';
          }

          return {
            ...entry,
            subject_name,
            teacher_name,
          } as ScheduleEntry;
        })
      );

      setSchedule(transformedData);
    } catch (error: unknown) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_configurations')
        .select('class_id, class_name, grade, section, school_id')
        .order('grade', { ascending: true });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .order('subject_name', { ascending: true });

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('id, full_name, school_id')
        .order('full_name', { ascending: true });

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Fetch academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('academic_year_id, year_name')
        .order('year_name', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);

      // Set default academic year
      if (yearsData && yearsData.length > 0) {
        setSelectedActiveYear(yearsData[0].academic_year_id);
      }

      // Fetch schedule
      if (yearsData && yearsData.length > 0) {
        await fetchSchedule(yearsData[0].academic_year_id);
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchSchedule]);

  useEffect(() => {
    fetchData();
  }, [user, fetchData]);

  const checkConflicts = (
    classId: string,
    teacherId: string,
    startTime: string,
    endTime: string,
    weekdays: string[]
  ): string => {
    // Convert times to minutes for comparison
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startTotalMins = startHour * 60 + startMin;
    const [endHour, endMin] = endTime.split(':').map(Number);
    const endTotalMins = endHour * 60 + endMin;

    for (const day of weekdays) {
      // Check class conflict (same class can't have two schedules at same time)
      const classConflict = schedule.find((entry) => {
        if (entry.class_id !== classId || entry.day_of_week !== day) {
          return false;
        }

        const [entryStartHour, entryStartMin] = entry.start_time
          .split(':')
          .map(Number);
        const entryStartMins = entryStartHour * 60 + entryStartMin;
        const [entryEndHour, entryEndMin] = entry.end_time
          .split(':')
          .map(Number);
        const entryEndMins = entryEndHour * 60 + entryEndMin;

        // Check for overlap
        return startTotalMins < entryEndMins && endTotalMins > entryStartMins;
      });

      if (classConflict) {
        return `This class already has a schedule for the selected time on ${day}.`;
      }

      // Check teacher conflict (teacher can't teach two classes at same time)
      const teacherConflict = schedule.find((entry) => {
        if (entry.subject_teacher_id !== teacherId || entry.day_of_week !== day) {
          return false;
        }

        const [entryStartHour, entryStartMin] = entry.start_time
          .split(':')
          .map(Number);
        const entryStartMins = entryStartHour * 60 + entryStartMin;
        const [entryEndHour, entryEndMin] = entry.end_time
          .split(':')
          .map(Number);
        const entryEndMins = entryEndHour * 60 + entryEndMin;

        // Check for overlap
        return startTotalMins < entryEndMins && endTotalMins > entryStartMins;
      });

      if (teacherConflict) {
        return `Teacher already assigned for this time slot on ${day}.`;
      }
    }

    return '';
  };

  const handleOpenForm = () => {
    if (!filterClass) {
      toast.error('Please select a class from the filters');
      return;
    }
    setFormData({
      class_id: filterClass,
      subject_id: '',
      teacher_id: '',
      start_time: '',
      duration: '',
      period_num: '',
      weekdays: [],
    });
    setConflict('');
    setIsFormOpen(true);
  };

  const calculateEndTime = (startTime: string, duration: string): string => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [durationHour, durationMin] = duration.split(':').map(Number);
    
    const totalMins = startHour * 60 + startMin + durationHour * 60 + durationMin;
    const endHour = Math.floor(totalMins / 60);
    const endMin = totalMins % 60;
    
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  const handleWeekdayChange = (day: string, checked: boolean) => {
    if (day === 'ALL') {
      if (checked) {
        setFormData({
          ...formData,
          weekdays: WEEKDAYS.map((d) => d.value),
        });
      } else {
        setFormData({
          ...formData,
          weekdays: [],
        });
      }
    } else {
      const newWeekdays = checked
        ? [...formData.weekdays, day]
        : formData.weekdays.filter((d) => d !== day);
      setFormData({
        ...formData,
        weekdays: newWeekdays,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.class_id ||
        !formData.subject_id ||
        !formData.teacher_id ||
        !formData.start_time ||
        !formData.duration ||
        !formData.period_num ||
        formData.weekdays.length === 0
      ) {
        toast.error('Please fill all required fields');
        return;
      }

      // Calculate end_time from start_time + duration
      const endTime = calculateEndTime(formData.start_time, formData.duration);

      // Check for conflicts
      const conflictMsg = checkConflicts(
        formData.class_id,
        formData.teacher_id,
        formData.start_time,
        endTime,
        formData.weekdays
      );

      if (conflictMsg) {
        setConflict(conflictMsg);
        return;
      }

      setActionLoading(true);

      // Insert schedule entries for each weekday
      const scheduleEntries = formData.weekdays.map((day) => ({
        class_id: formData.class_id,
        subject_id: formData.subject_id,
        subject_teacher_id: formData.teacher_id,
        day_of_week: day,
        start_time: formData.start_time,
        end_time: endTime,
        period_num: parseInt(formData.period_num, 10),
        academic_year_id: selectedActiveYear,
      }));

      const { error } = await supabase
        .from('class_subject_schedule')
        .insert(scheduleEntries);

      if (error) throw error;

      toast.success('Schedule created successfully');
      setIsFormOpen(false);
      await fetchSchedule(selectedActiveYear);
    } catch (error: unknown) {
      console.error('Error saving schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save schedule';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (entry: ScheduleEntry) => {
    setDeleteTarget(entry);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('class_subject_schedule')
        .delete()
        .eq('class_schedule_id', deleteTarget.class_schedule_id);

      if (error) throw error;
      toast.success('Schedule removed successfully');
      setIsDeleteOpen(false);
      await fetchSchedule(selectedActiveYear);
    } catch (error: unknown) {
      console.error('Error deleting schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete schedule';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getScheduleForSlot = (classId: string, day: string, timeSlot: string) => {
    return schedule.find(
      (entry) =>
        entry.class_id === classId &&
        entry.day_of_week === day &&
        entry.start_time === timeSlot
    );
  };

  const getTimeSlots = () => {
    const slots = new Set<string>();
    schedule.forEach((entry) => {
      slots.add(entry.start_time);
    });
    return Array.from(slots).sort();
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      if (subjectId === 'ALL') {
        // Toggle ALL - either select all or deselect all
        return prev.includes('ALL') ? [] : ['ALL'];
      } else {
        // Remove ALL if it's selected and user selects a specific subject
        let updated = prev.filter((id) => id !== 'ALL');

        if (updated.includes(subjectId)) {
          updated = updated.filter((id) => id !== subjectId);
        } else {
          updated = [...updated, subjectId];
        }

        // If all subjects are selected, switch to ALL
        if (updated.length === subjects.length) {
          return ['ALL'];
        }

        // If nothing is selected, default to ALL
        return updated.length === 0 ? ['ALL'] : updated;
      }
    });
  };

  const isSubjectSelected = (subjectId: string) => {
    if (subjectId === 'ALL') {
      return selectedSubjects.includes('ALL');
    }
    return selectedSubjects.includes('ALL') || selectedSubjects.includes(subjectId);
  };

  const shouldShowEntry = (entrySubjectId: string) => {
    return selectedSubjects.includes('ALL') || selectedSubjects.includes(entrySubjectId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white pt-0 pb-4 shadow-sm">
        {/* Title and Add Button */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Weekly Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage subject and teacher schedules for classes
            </p>
          </div>
          <Button onClick={handleOpenForm} className="gap-2" size="lg">
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
        </div>

        {/* Class + Subject Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-class" className="text-sm font-medium">
                Class (Filter)
              </Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger id="filter-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} (Grade {cls.grade}-{cls.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-subject" className="text-sm font-medium">
                Subject (Filter)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-600"
                  >
                    {selectedSubjects.includes('ALL')
                      ? 'All Subjects'
                      : selectedSubjects.length === 1
                      ? subjects.find((s) => s.id === selectedSubjects[0])
                          ?.subject_name || 'Select subject'
                      : `${selectedSubjects.length} subjects`}
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {selectedSubjects.includes('ALL')
                        ? 'ALL'
                        : selectedSubjects.length}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-subjects"
                        checked={selectedSubjects.includes('ALL')}
                        onCheckedChange={() => toggleSubject('ALL')}
                      />
                      <Label htmlFor="all-subjects" className="font-semibold cursor-pointer">
                        All Subjects
                      </Label>
                    </div>
                    <div className="border-t pt-2 space-y-2 max-h-48 overflow-y-auto">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subject-${subject.id}`}
                            checked={isSubjectSelected(subject.id)}
                            onCheckedChange={() => toggleSubject(subject.id)}
                          />
                          <Label
                            htmlFor={`subject-${subject.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {subject.subject_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 pr-4">
          {/* Schedule Grid by Class */}
          {classes
            .filter((c) => !filterClass || c.class_id === filterClass)
            .map((classConfig) => {
              const classSchedule = schedule.filter(
                (s) =>
                  s.class_id === classConfig.class_id &&
                  shouldShowEntry(s.subject_id)
              );
              if (classSchedule.length === 0) return null;

              const timeSlots = getTimeSlots();

              return (
                <div key={classConfig.class_id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {classConfig.class_name} (Grade {classConfig.grade}-{classConfig.section})
                  </h2>

                  {/* Horizontal Scrollable Table Container */}
                  <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-5 bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 p-2 bg-gray-50 text-left font-semibold text-sm w-24 flex-shrink-0">
                            Time
                          </th>
                          {WEEKDAYS.map((day) => (
                            <th
                              key={day.value}
                              className="border border-gray-200 p-2 bg-gray-50 text-center font-semibold text-sm w-48 flex-shrink-0"
                            >
                              {day.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((time) => (
                          <tr key={time}>
                            <td className="border border-gray-200 p-2 bg-gray-50 font-semibold text-sm w-24 flex-shrink-0 sticky left-0 z-4">
                              {time}
                            </td>
                            {WEEKDAYS.map((day) => {
                              const entry = getScheduleForSlot(
                                classConfig.class_id,
                                day.value,
                                time
                              );
                              return (
                                <td key={`${day.value}-${time}`} className="border border-gray-200 p-2 w-48 flex-shrink-0">
                                  {entry && shouldShowEntry(entry.subject_id) ? (
                                    <div className="relative group p-2 bg-blue-50 rounded min-h-24 flex flex-col justify-between hover:shadow-md transition-shadow">
                                      <div>
                                        <p className="font-semibold text-sm text-gray-900">
                                          {entry.subject_name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {entry.teacher_name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 font-medium">
                                          Period {entry.period_num}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {entry.start_time} - {entry.end_time}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
                                        onClick={() => handleDeleteClick(entry)}
                                      >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="p-2 bg-gray-50 rounded min-h-24 border border-dashed border-gray-300" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

          {schedule.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <p className="text-gray-500">No schedules created yet. Click "Add Schedule" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add Schedule</DialogTitle>
            <DialogDescription>Create a new class schedule with teacher assignment</DialogDescription>
          </DialogHeader>

          {conflict && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{conflict}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Class */}
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select
                value={formData.class_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, class_id: value })
                }
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} (Grade {cls.grade}-{cls.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject_id: value })
                }
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher */}
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher *</Label>
              <Select
                value={formData.teacher_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacher_id: value })
                }
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time (HH:MM) *</Label>
              <Input
                id="start-time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (HH:MM) *</Label>
              <Input
                id="duration"
                type="text"
                placeholder="e.g., 01:00 or 00:45"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">Format: HH:MM (e.g., 01:00 = 1 hour, 00:45 = 45 minutes)</p>
            </div>

            {/* Period Number */}
            <div className="space-y-2">
              <Label htmlFor="period-num">Period Number *</Label>
              <Select
                value={formData.period_num}
                onValueChange={(value) =>
                  setFormData({ ...formData, period_num: value })
                }
              >
                <SelectTrigger id="period-num">
                  <SelectValue placeholder="Select period number" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <SelectItem key={period} value={String(period)}>
                      Period {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weekdays */}
            <div className="space-y-3">
              <Label>Week Days *</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all"
                    checked={formData.weekdays.length === 6}
                    onCheckedChange={(checked) =>
                      handleWeekdayChange('ALL', checked as boolean)
                    }
                  />
                  <label htmlFor="all" className="font-semibold cursor-pointer">
                    All Days
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3 ml-4">
                  {WEEKDAYS.map((day) => (
                    <div key={day.value} className="flex items-center gap-2">
                      <Checkbox
                        id={day.value}
                        checked={formData.weekdays.includes(day.value)}
                        onCheckedChange={(checked) =>
                          handleWeekdayChange(day.value, checked as boolean)
                        }
                      />
                      <label htmlFor={day.value} className="cursor-pointer">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.subject_name}</strong> by{' '}
              <strong>{deleteTarget?.teacher_name}</strong> from {deleteTarget?.day_of_week} at{' '}
              <strong>{deleteTarget?.start_time}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClassSchedule;
