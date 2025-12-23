'use client';

import { useState } from 'react';
import { format, addDays, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Lightbulb, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OptimalTime {
  day: string;
  time: string;
  reason: string;
}

interface SchedulePickerProps {
  mode: 'now' | 'scheduled';
  scheduledAt?: Date | null;
  onModeChange: (mode: 'now' | 'scheduled') => void;
  onScheduleChange: (date: Date | null) => void;
  optimalTimes?: OptimalTime[];
  className?: string;
}

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = format(setMinutes(setHours(new Date(), hour), minute), 'a h:mm', {
        locale: ko,
      });
      options.push({ value: time, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function SchedulePicker({
  mode,
  scheduledAt,
  onModeChange,
  onScheduleChange,
  optimalTimes = [],
  className,
}: SchedulePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = startOfDay(new Date());

  // Get date and time from scheduledAt
  const selectedDate = scheduledAt ?? addDays(new Date(), 1);
  const selectedTime = scheduledAt
    ? format(scheduledAt, 'HH:mm')
    : '10:00';

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newScheduledAt = setMinutes(setHours(date, hours), minutes);
    onScheduleChange(newScheduledAt);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newScheduledAt = setMinutes(setHours(selectedDate, hours), minutes);
    onScheduleChange(newScheduledAt);
  };

  const handleOptimalTimeSelect = (optimal: OptimalTime) => {
    // Parse optimal time suggestion and set it
    const now = new Date();
    const dayMap: Record<string, number> = {
      '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
    };

    const targetDay = dayMap[optimal.day] ?? now.getDay();
    let daysToAdd = targetDay - now.getDay();
    if (daysToAdd <= 0) daysToAdd += 7;

    const targetDate = addDays(now, daysToAdd);
    const [hours, minutes] = optimal.time.split(':').map(Number);
    const newScheduledAt = setMinutes(setHours(targetDate, hours), minutes);

    onScheduleChange(newScheduledAt);
  };

  // Validate scheduled time is in the future
  const isScheduledTimeValid = scheduledAt ? isBefore(new Date(), scheduledAt) : true;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mode Selection */}
      <RadioGroup
        value={mode}
        onValueChange={(value: string) => onModeChange(value as 'now' | 'scheduled')}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="now" id="publish-now" />
          <Label htmlFor="publish-now" className="flex items-center gap-2 cursor-pointer">
            <Send className="h-4 w-4" />
            지금 게시
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="scheduled" id="publish-scheduled" />
          <Label htmlFor="publish-scheduled" className="flex items-center gap-2 cursor-pointer">
            <Calendar className="h-4 w-4" />
            예약 게시
          </Label>
        </div>
      </RadioGroup>

      {/* Schedule Details */}
      {mode === 'scheduled' && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">날짜</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !scheduledAt && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {scheduledAt
                    ? format(scheduledAt, 'yyyy년 M월 d일 (EEEE)', { locale: ko })
                    : '날짜 선택'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date: Date) => isBefore(date, today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">시간</Label>
            <Select value={selectedTime} onValueChange={handleTimeChange}>
              <SelectTrigger className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="시간 선택" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Validation Error */}
          {!isScheduledTimeValid && (
            <p className="text-sm text-red-500">
              예약 시간은 현재 시간 이후여야 합니다.
            </p>
          )}

          {/* Optimal Times */}
          {optimalTimes.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                최적 시간 추천
              </div>
              <div className="space-y-2">
                {optimalTimes.slice(0, 3).map((optimal, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptimalTimeSelect(optimal)}
                    className="w-full flex items-center justify-between p-2 rounded-md text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span className="font-medium">
                      {optimal.day}요일 {optimal.time}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {optimal.reason}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {scheduledAt && isScheduledTimeValid && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">예약 발행 예정</p>
              <p className="text-muted-foreground">
                {format(scheduledAt, 'yyyy년 M월 d일 (EEEE) a h:mm', { locale: ko })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
