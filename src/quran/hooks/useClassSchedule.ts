
export interface ScheduleResult {
  classId: string | null;
  fetchStudentsClassId: string | null; // The class ID to use when querying the students table
  needsLevelSelection: boolean;
  juniorClassId?: string;
  juniorFetchClassId?: string;
  seniorClassId?: string;
  seniorFetchClassId?: string;
  isWithinTimeWindow: boolean;
  timeWindowMessage: string;
  dayName: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Weekday class IDs (from WeekdayAttendance.tsx getClassNameFromId)
const WEEKDAY_CLASS_MAP: Record<number, string> = {
  1: 'a6184b1b-6299-4d0c-9f17-6cbf68591a35', // Monday
  3: '74410dba-7cee-41ab-81c0-a8bbe3e7a042', // Wednesday
  4: 'ee5cf54f-e467-4654-8d7e-051a259d27e4', // Thursday
  5: 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4', // Friday
};

// Weekend class IDs
const WEEKEND_CLASSES: Record<number, { junior: string; juniorFetch: string; senior: string; seniorFetch: string }> = {
  6: { // Saturday
    junior: '2dcc106b-adfe-4717-b64d-40135a32a5f1', // Saturday Junior Attendance
    juniorFetch: 'a6184b1b-6299-4d0c-9f17-6cbf68591a35', // Monday Class (Students)
    senior: '4c5c84f2-ddac-4e09-a92e-8537c5502降2e', // Saturday Senior Attendance
    seniorFetch: 'ee5cf54f-e467-4654-8d7e-051a259d27e4', // Thursday Class (Students)
  },
  0: { // Sunday
    junior: '5e8e9f3a-7b0d-4f1a-b8c9-6d2e1f3a4b5c', // Sunday Junior Attendance
    juniorFetch: 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4', // Friday Class (Students)
    senior: '3f96c141-b1ca-495c-9d36-f6c3768e4307', // Sunday Senior Attendance
    seniorFetch: '74410dba-7cee-41ab-81c0-a8bbe3e7a042', // Wednesday Class (Students)
  },
};

// Time windows
const WEEKDAY_START = 18; // 6:00 PM
const WEEKDAY_END = 21;   // 9:00 PM
const WEEKEND_START = 13; // 1:00 PM
const WEEKEND_END = 17;   // 5:00 PM

const formatHour = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
};

export const useClassSchedule = (): ScheduleResult => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday … 6=Saturday
  const currentHour = now.getHours();
  const dayName = DAY_NAMES[dayOfWeek];

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const startHour = isWeekend ? WEEKEND_START : WEEKDAY_START;
  const endHour = isWeekend ? WEEKEND_END : WEEKDAY_END;
  const isWithinTimeWindow = currentHour >= startHour && currentHour < endHour;

  // Build the time window message
  let timeWindowMessage: string;
  if (currentHour < startHour) {
    timeWindowMessage = `Check-in opens at ${formatHour(startHour)}`;
  } else if (currentHour >= endHour) {
    timeWindowMessage = `Check-in closed at ${formatHour(endHour)}. See you next time!`;
  } else {
    timeWindowMessage = `Check-in is open until ${formatHour(endHour)}`;
  }

  // Weekend → needs level selection
  if (isWeekend) {
    const weekendClasses = WEEKEND_CLASSES[dayOfWeek];
    return {
      classId: null,
      fetchStudentsClassId: null,
      needsLevelSelection: true,
      juniorClassId: weekendClasses.junior,
      juniorFetchClassId: weekendClasses.juniorFetch,
      seniorClassId: weekendClasses.senior,
      seniorFetchClassId: weekendClasses.seniorFetch,
      isWithinTimeWindow,
      timeWindowMessage,
      dayName,
    };
  }

  // Weekday → direct class mapping
  // TEMPORARY OVERRIDE FOR TESTING (fallback to Monday if no class today)
  const classId = WEEKDAY_CLASS_MAP[dayOfWeek] || 'a6184b1b-6299-4d0c-9f17-6cbf68591a35';

  if (!classId) {
    return {
      classId: null,
      fetchStudentsClassId: null,
      needsLevelSelection: false,
      isWithinTimeWindow: false,
      timeWindowMessage: 'No class scheduled for today',
      dayName,
    };
  }

  return {
    classId,
    fetchStudentsClassId: classId, // On weekdays, the attendance class ID and fetch class ID are the same
    needsLevelSelection: false,
    isWithinTimeWindow,
    timeWindowMessage,
    dayName,
  };
};
