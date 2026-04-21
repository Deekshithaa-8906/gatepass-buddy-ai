import React from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

interface DateTimePickerGroupProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  labelPrefix: string;
}

export function DateTimePickerGroup({
  date,
  time,
  onDateChange,
  onTimeChange,
  labelPrefix
}: DateTimePickerGroupProps) {
  return (
    <div className="space-y-4 bg-white/50 p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <h3 className="font-bold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
        {labelPrefix === 'Departure' ? <CalendarIcon className="w-5 h-5 text-[#CD0000]" /> : <Clock className="w-5 h-5 text-[#CD0000]" />}
        {labelPrefix} Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900 ml-1">{labelPrefix} Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-medium rounded-xl h-12 bg-white/70 border border-gray-200 hover:border-[#CD0000]/50 hover:bg-white hover:text-gray-900 transition-all",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900 ml-1">{labelPrefix} Time</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full pl-10 pr-4 h-12 bg-white/70 border border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20 rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm backdrop-blur-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
