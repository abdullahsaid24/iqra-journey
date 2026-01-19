import { useState, useEffect } from "react";
import { CalendarDays, Calendar } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/quran/lib/supabase";
import { Button } from "@/quran/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/quran/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/quran/components/ui/table";
import { Badge } from "@/quran/components/ui/badge";
interface AttendanceHistoryProps {
  classId: string;
}
interface AttendanceDay {
  date: string;
  count: number;
}
interface AttendanceDayDetail {
  student_name: string;
  status: 'present' | 'absent';
  note?: string;
}

// Define a proper type for the students response
interface StudentResponse {
  name?: string;
}
export const AttendanceHistory = ({
  classId
}: AttendanceHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<AttendanceDayDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the days when attendance was recorded
  useEffect(() => {
    const fetchAttendanceDays = async () => {
      if (!classId) return;
      try {
        // Use a different approach to get the count by date
        const {
          data,
          error
        } = await supabase.from('weekday_attendance').select('attendance_date, count').eq('class_id', classId).select('attendance_date');
        if (error) throw error;

        // Process the data to count occurrences of each date
        const dateCountMap: Record<string, number> = {};
        data.forEach(item => {
          if (dateCountMap[item.attendance_date]) {
            dateCountMap[item.attendance_date]++;
          } else {
            dateCountMap[item.attendance_date] = 1;
          }
        });

        // Convert the map to our desired format and sort by date
        const formattedDays = Object.entries(dateCountMap).map(([date, count]) => ({
          date,
          count
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendanceDays(formattedDays);
      } catch (error) {
        console.error('Error fetching attendance days:', error);
      }
    };
    if (isOpen) {
      fetchAttendanceDays();
    }
  }, [classId, isOpen]);

  // Fetch details for a specific day
  const fetchDayDetails = async (date: string) => {
    setIsLoading(true);
    setSelectedDate(date);
    try {
      const {
        data,
        error
      } = await supabase.from('weekday_attendance').select(`
          students(name),
          status,
          note
        `).eq('class_id', classId).eq('attendance_date', date);
      if (error) throw error;

      // Safely access the student name with proper type handling
      setDayDetails(data.map(item => {
        // Handle the case where students could be an object or an array
        let studentName = 'Unknown';
        if (item.students) {
          if (Array.isArray(item.students)) {
            // If it's an array, try to get the first element's name
            studentName = item.students[0]?.name || 'Unknown';
          } else if (typeof item.students === 'object') {
            // If it's an object, get the name property directly
            studentName = (item.students as StudentResponse).name || 'Unknown';
          }
        }
        return {
          student_name: studentName,
          status: item.status as 'present' | 'absent',
          note: item.note
        };
      }));
    } catch (error) {
      console.error('Error fetching day details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20">
        <CalendarDays className="h-4 w-4" />
        Attendance History
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-neutral-50">
          <DialogHeader>
            <DialogTitle className="text-neutral-950">Attendance History</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-4 h-[400px] overflow-y-auto">
              <h3 className="font-medium mb-2 text-neutral-950">Attendance Days</h3>
              
              {attendanceDays.length > 0 ? <div className="space-y-2">
                  {attendanceDays.map(day => <Button key={day.date} variant={selectedDate === day.date ? "default" : "outline"} className="w-full justify-between" onClick={() => fetchDayDetails(day.date)}>
                      <span className="flex items-center text-neutral-950">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(day.date), 'MMM dd, yyyy')}
                      </span>
                      <Badge variant="secondary" className="bg-neutral-950">{day.count}</Badge>
                    </Button>)}
                </div> : <p className="text-gray-500 text-center mt-8">No attendance records found</p>}
            </div>
            
            <div className="md:col-span-2 border rounded-md p-4 h-[400px] overflow-y-auto">
              {selectedDate ? <>
                  <h3 className="font-medium mb-4">
                    Details for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
                  </h3>
                  
                  {isLoading ? <div className="flex justify-center items-center h-64">
                      <p>Loading...</p>
                    </div> : dayDetails.length > 0 ? <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayDetails.map((detail, index) => <TableRow key={index}>
                            <TableCell className="font-medium">{detail.student_name}</TableCell>
                            <TableCell>
                              {detail.status === 'present' ? <Badge variant="success">Present</Badge> : <Badge variant="destructive">Absent</Badge>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {detail.note || '-'}
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table> : <p className="text-gray-500 text-center mt-8">No details available</p>}
                </> : <p className="text-gray-500 text-center mt-8">Select a date to view details</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};
