import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ISODate, ScheduleRecord } from '../interfaces/duty.interface';
import { getTerminalName } from './schedule.utils';

interface ParsedEmployeeShift extends ScheduleRecord {
  readonly employeeName: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScheduleParserService {
  async parse(
    file: File,
    personName: string,
    scheduleYear = new Date().getFullYear(),
  ): Promise<ScheduleRecord[]> {
    const targetName = personName.trim().toLowerCase();

    if (!targetName) {
      throw new Error('Person name is required.');
    }

    const fileData = await file.arrayBuffer();
    const workbook = XLSX.read(fileData, { type: 'array' });
    const allShifts: ParsedEmployeeShift[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
      const terminal = getTerminalName(sheetName);
      let currentDate: ISODate | null = null;

      for (let row = Math.max(5, range.s.r); row <= range.e.r; row++) {
        const dateText = this.getCellText(sheet, row, 2);
        const rowHasContent = Array.from({ length: range.e.c - range.s.c + 1 }, (_, index) =>
          this.getCellText(sheet, row, range.s.c + index),
        ).some(Boolean);

        if (dateText) {
          if (!/^\d{1,2}-[A-Za-z]{3}$/.test(dateText.trim())) {
            currentDate = null;
            continue;
          }

          currentDate = this.parseScheduleDate(dateText, scheduleYear);
        } else if (!rowHasContent) {
          currentDate = null;
          continue;
        }

        const rowDate = currentDate;
        if (!rowDate) {
          continue;
        }

        for (let col = range.s.c; col <= range.e.c; col++) {
          const employeeName = this.getCellText(sheet, row, col);

          if (!employeeName || this.isTimeRange(employeeName)) {
            continue;
          }

          const hours = col > 0 ? this.getCellText(sheet, row, col - 1) : '';

          if (!this.isTimeRange(hours)) {
            continue;
          }

          const brand = this.getBrandForColumn(sheet, col);
          if (/^heure pause (matin|soir)$/i.test(brand.trim())) {
            continue;
          }

          if (this.isCancelledShift(employeeName, hours, brand)) {
            continue;
          }

          const { startMinutes, endMinutes } = this.parseTimeRange(hours);

          allShifts.push({
            id: `${sheetName}-${row}-${col}`,
            employeeName,
            terminal,
            brand,
            date: rowDate,
            startMinutes,
            endMinutes,
            coworkers: [],
          });
        }
      }
    }

    return allShifts
      .filter((shift) => shift.employeeName.trim().toLowerCase() === targetName)
      .map((shift) => ({
        id: shift.id,
        terminal: shift.terminal,
        brand: shift.brand,
        date: shift.date,
        startMinutes: shift.startMinutes,
        endMinutes: shift.endMinutes,
        coworkers: allShifts
          .filter(
            (other) =>
              other.employeeName.trim().toLowerCase() !== targetName &&
              other.date === shift.date &&
              other.terminal === shift.terminal &&
              other.startMinutes < shift.endMinutes &&
              other.endMinutes > shift.startMinutes,
          )
          .map((other) => ({
            name: other.employeeName,
            brand: other.brand,
            startMinutes: other.startMinutes,
            endMinutes: other.endMinutes,
          })),
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes);
  }

  private getCellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[address];

    return cell ? XLSX.utils.format_cell(cell).trim() : '';
  }

  private getBrandForColumn(sheet: XLSX.WorkSheet, col: number): string {
    for (let currentCol = col; currentCol >= 0; currentCol--) {
      const brand = this.getCellText(sheet, 4, currentCol);

      if (brand) {
        return brand;
      }
    }

    return 'Unknown Brand';
  }

  private parseScheduleDate(dateStr: string, year: number): ISODate {
    const match = dateStr.trim().match(/^(\d{1,2})-([A-Za-z]{3})$/);

    if (!match) {
      throw new Error(`Invalid schedule date: "${dateStr}"`);
    }

    const months: Record<string, number> = {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };

    const day = Number(match[1]);
    const month = months[match[2].toLowerCase()];

    if (!month) {
      throw new Error(`Invalid schedule month: "${dateStr}"`);
    }

    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error(`Invalid schedule date: "${dateStr}"`);
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private parseTimeRange(value: string): { startMinutes: number; endMinutes: number } {
    const match = value
      .trim()
      .match(/^(\d{1,2})\s*[h:]\s*(\d{2})?\s*-\s*(\d{1,2})\s*[h:]\s*(\d{2})?$/i);

    if (!match) {
      throw new Error(`Invalid shift hours: "${value}"`);
    }

    const [, startHourText, startMinuteText, endHourText, endMinuteText] = match;
    const startHour = Number(startHourText);
    const startMinute = Number(startMinuteText ?? 0);
    const endHour = Number(endHourText);
    const endMinute = Number(endMinuteText ?? 0);

    const validTime = (hour: number, minute: number) =>
      hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;

    if (!validTime(startHour, startMinute) || !validTime(endHour, endMinute)) {
      throw new Error(`Invalid shift hours: "${value}"`);
    }

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      throw new Error(`Shift must end after it starts: "${value}"`);
    }

    return { startMinutes, endMinutes };
  }

  private isTimeRange(value: string): boolean {
    return /^\d{1,2}\s*[h:]\s*\d{0,2}\s*-\s*\d{1,2}\s*[h:]\s*\d{0,2}$/i.test(value.trim());
  }

  private isCancelledShift(...values: string[]): boolean {
    return values.some((value) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes('annul'),
    );
  }
}
