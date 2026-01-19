
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/quran/components/ui/table";
import { Card } from "@/quran/components/ui/card";
import { Badge } from "@/quran/components/ui/badge";
import { format } from "date-fns";
import { formatLessonDisplay } from "@/quran/lib/utils";

interface Assignment {
  surah: string;
  verses: string;
  status?: string;
  created_at?: string;
  id?: string;
}

interface CurrentLessonsTableProps {
  currentLesson: Assignment | null;
  pastHomework: Assignment[];
}

export const CurrentLessonsTable = ({
  currentLesson,
  pastHomework = [],
}: CurrentLessonsTableProps) => {
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return <Badge className={`${variants[status] || ''}`}>
        {status === 'pending' || status === 'absent' ? 'Absent' : status.replace('_', ' ')}
      </Badge>;
  };

  // Organize homework attempts by surah:verses combination
  const homeworkAttempts: Record<string, Assignment[]> = {};
  
  pastHomework.forEach(assignment => {
    if (!assignment.surah || !assignment.verses) return;
    
    const key = `${assignment.surah}:${assignment.verses}`;
    homeworkAttempts[key] = homeworkAttempts[key] || [];
    homeworkAttempts[key].push(assignment);
  });
  
  // Find all assignments related to the current lesson
  let currentLessonAttempts: Assignment[] = [];
  if (currentLesson?.surah && currentLesson?.verses) {
    const key = `${currentLesson.surah}:${currentLesson.verses}`;
    // Get all attempts for the current lesson from past homework
    currentLessonAttempts = pastHomework.filter(
      hw => hw.surah === currentLesson.surah && hw.verses === currentLesson.verses
    );
    
    // Add the current lesson itself if it's not already in the attempts
    if (currentLesson.id && !currentLessonAttempts.some(hw => hw.id === currentLesson.id)) {
      currentLessonAttempts.push(currentLesson);
    }
    
    // Sort attempts by date (newest first)
    currentLessonAttempts.sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // Remove current lesson attempts from pastHomework groups
    if (homeworkAttempts[key]) {
      delete homeworkAttempts[key];
    }
  }

  // Sort attempts by date for each homework
  Object.keys(homeworkAttempts).forEach(key => {
    homeworkAttempts[key].sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-50">
        <h3 className="text-lg font-semibold mb-4 text-black">Current Homework</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-black">Type</TableHead>
              <TableHead className="text-black">Homework</TableHead>
              <TableHead className="text-black text-right">Status</TableHead>
              <TableHead className="text-black text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLesson ? (
              <TableRow>
                <TableCell className="text-black font-medium">Current Lesson</TableCell>
                <TableCell className="text-black">
                  <div className="flex items-center">
                    <span>{formatLessonDisplay(currentLesson.surah, currentLesson.verses)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-black text-right">
                  {getStatusBadge(currentLesson.status)}
                </TableCell>
                <TableCell className="text-black text-right">
                  {currentLesson.created_at && format(new Date(currentLesson.created_at), "MMM dd, yyyy")}
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell className="text-black font-medium">Current Lesson</TableCell>
                <TableCell className="text-black" colSpan={3}>Not assigned</TableCell>
              </TableRow>
            )}
            
            {/* Show previous attempts for the current lesson */}
            {currentLessonAttempts.length > 1 && 
              currentLessonAttempts.slice(1).map((attempt, index) => (
                <TableRow key={attempt.id || index}>
                  <TableCell className="text-black font-medium">Attempt {currentLessonAttempts.length - index - 1}</TableCell>
                  <TableCell className="text-black">
                    <div className="flex items-center">
                      <span>{formatLessonDisplay(attempt.surah, attempt.verses)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black text-right">
                    {getStatusBadge(attempt.status)}
                  </TableCell>
                  <TableCell className="text-black text-right">
                    {attempt.created_at && format(new Date(attempt.created_at), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6 bg-slate-50">
        <h3 className="text-lg font-semibold mb-4 text-black">Past Homework</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-black">Homework</TableHead>
              <TableHead className="text-black">Attempts</TableHead>
              <TableHead className="text-black text-right">Final Status</TableHead>
              <TableHead className="text-black text-right">Completion Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(homeworkAttempts)
              .sort(([, attemptsA], [, attemptsB]) => {
                const latestA = attemptsA[0];
                const latestB = attemptsB[0];
                if (!latestA?.created_at || !latestB?.created_at) return 0;
                return new Date(latestB.created_at).getTime() - new Date(latestA.created_at).getTime();
              })
              .map(([key, attempts]) => {
                const lastAttempt = attempts[0]; // Using index 0 because we sorted by newest first
                
                return (
                  <TableRow key={key}>
                    <TableCell className="text-black">
                      {formatLessonDisplay(lastAttempt.surah, lastAttempt.verses)}
                    </TableCell>
                    <TableCell className="text-black">
                      {attempts.map((attempt, idx) => (
                        <span key={idx} className="inline-block mr-2 mb-1">
                          Attempt {attempts.length - idx}: {getStatusBadge(attempt.status)}
                        </span>
                      )).reverse()}
                    </TableCell>
                    <TableCell className="text-black text-right">
                      {getStatusBadge(lastAttempt.status)}
                    </TableCell>
                    <TableCell className="text-black text-right">
                      {lastAttempt.created_at && format(new Date(lastAttempt.created_at), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
              
            {Object.keys(homeworkAttempts).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-black">
                  No past homework available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
