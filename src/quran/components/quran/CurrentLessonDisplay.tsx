
import React from 'react';
import { useState } from "react";

import { LessonForm } from "./LessonForm";
import { LessonStatus } from "./LessonStatus";
import { LessonTypeSelector } from "./LessonTypeSelector";
import { GoalSettingForm } from "./GoalSettingForm";
import { GoalStatus } from "./GoalStatus";
import { useIsMobile } from "@/quran/hooks/use-mobile";
import { formatLessonDisplay } from "@/quran/lib/utils";
import { useLessonWeeks } from "@/quran/hooks/useLessonWeeks";

type LessonType = 'current_lesson' | 'goal_setting' | 'ahsanul_qawaid_book_1' | 'noor_al_bayan' | 'full_quran';

interface CurrentLessonDisplayProps {
  currentLesson: { surah: string; verses: string } | null;
  currentPage: number;
  onLessonComplete: () => void;
  studentId?: string;
  onLessonUpdate?: (lesson: { surah: string; verses: string }) => void;
  selectedType: LessonType;
  onTypeChange: (type: LessonType) => void;
  selectedStartVerse?: string | null;
  selectedEndVerse?: string | null;
  onNavigateToVerse?: (verseKey: string) => void;
  restrictedMode?: boolean;
  classId?: string;
  onDone?: () => void;
  onFormStartChange?: (startValue: string) => void;
}

export const CurrentLessonDisplay = ({
  currentLesson,
  currentPage,
  studentId,
  onLessonUpdate,
  selectedType,
  onTypeChange,
  selectedStartVerse,
  selectedEndVerse,
  onNavigateToVerse,
  restrictedMode = false,
  classId,
  onDone,
  onFormStartChange
}: CurrentLessonDisplayProps) => {
  const isMobile = useIsMobile();
  const { data: lessonWeeks } = useLessonWeeks(studentId, classId);
  
  const renderForm = () => {
    if (!studentId || !onLessonUpdate) return null;

    switch (selectedType) {
      case 'current_lesson':
      case 'ahsanul_qawaid_book_1':
      case 'noor_al_bayan':
      case 'full_quran':
        return (
          <LessonForm
            studentId={studentId}
            onLessonUpdate={onLessonUpdate}
            currentLesson={currentLesson}
            selectedStartVerse={selectedStartVerse}
            selectedEndVerse={selectedEndVerse}
            onNavigateToVerse={onNavigateToVerse}
            lessonType={selectedType}
            classId={classId}
            onDone={onDone}
            onFormStartChange={onFormStartChange}
          />
        );
      case 'goal_setting':
        return (
          <GoalSettingForm
            studentId={studentId}
            onGoalSet={() => onLessonUpdate(currentLesson || { surah: '', verses: '' })}
          />
        );
    }
  };

  const renderStatus = () => {
    if (!studentId || !currentLesson) return null;

    switch (selectedType) {
      case 'current_lesson':
      case 'ahsanul_qawaid_book_1':
      case 'noor_al_bayan':
      case 'full_quran':
        return (
          <LessonStatus 
            studentId={studentId}
            currentLesson={currentLesson}
            onStatusUpdate={(lesson) => onLessonUpdate?.(lesson)}
            classId={classId}
            onDone={onDone}
          />
        );
      case 'goal_setting':
        return (
          <GoalStatus 
            studentId={studentId}
            onStatusUpdate={() => onLessonUpdate?.(currentLesson)}
          />
        );
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4 bg-white rounded-lg p-2 sm:p-3 md:p-6 shadow-md">
      <div className="space-y-2 sm:space-y-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4">
          <div className="w-full xs:w-auto xs:flex-1">
            <LessonTypeSelector
              selectedType={selectedType}
              onTypeChange={onTypeChange}
              restrictedMode={restrictedMode}
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full xs:w-auto justify-between xs:justify-end">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-xs sm:text-sm text-gray-900 whitespace-nowrap font-medium">
                {currentLesson ? formatLessonDisplay(currentLesson.surah, currentLesson.verses) : "Not set"}
              </span>
              {currentLesson && lessonWeeks && lessonWeeks.weeks > 0 && (
                <span
                  className="text-[11px] sm:text-xs font-semibold text-amber-700 whitespace-nowrap"
                  title={`First given on ${lessonWeeks.assignedOn}`}
                >
                  {lessonWeeks.weeks} week{lessonWeeks.weeks !== 1 ? 's' : ''} on this
                </span>
              )}
            </div>
            {renderStatus()}
          </div>
        </div>
        
        {renderForm()}
      </div>
    </div>
  );
};
