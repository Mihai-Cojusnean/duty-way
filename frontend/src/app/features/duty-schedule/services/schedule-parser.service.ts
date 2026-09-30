import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ISODate, ScheduleRecord } from '../interfaces/duty.interface';
import { getTerminalName } from './schedule.utils';

@Injectable({
  providedIn: 'root',
})
export class ScheduleParserService {
  async parse(file: File, personName: string): Promise<ScheduleRecord[]> {
    const fileData = await file.arrayBuffer();
    const workbook = XLSX.read(fileData, { type: 'array' });
    const targetName = personName.trim().toLowerCase();

    const rawRecords: ScheduleRecord[] = [];

    for (const terminal of workbook.SheetNames) {
      const sheet = workbook.Sheets[terminal];
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');

      for (let row = Math.max(5, range.s.r); row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const person = this.getCellText(sheet, row, col);

          if (!person || !person.toLowerCase().includes(targetName)) {
            continue;
          }

          const day = this.getCellText(sheet, row, 1);
          const dateStr = this.getCellText(sheet, row, 2);
          const hours = col > 0 ? this.getCellText(sheet, row, col - 1) : '';
          const brand = this.getBrandForColumn(sheet, col);
          const lowerBrand = brand.toLowerCase();

          if (lowerBrand === 'heure pause matin' || lowerBrand === 'heure pause soir') {
            continue;
          }

          rawRecords.push({
            id: `${terminal}-${row}-${col}`,
            terminal: getTerminalName(terminal),
            brand,
            date: this.parseScheduleDate(dateStr),
            startMinutes: this.extractStartMinutes(hours),
            hours,
          });
        }
      }
    }

    return rawRecords.sort(
      (a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes,
    );
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

  private extractDayNumber(dateStr: string): number {
    const match = dateStr.match(/\d+/);

    return match ? Number(match[0]) : 99;
  }

  private extractStartMinutes(hours: string): number {
    const start = hours.split('-')[0]?.trim().toLowerCase() ?? '';

    const timeMatch = start.match(/(\d{1,2})\s*[h:]\s*(\d{1,2})?/);

    if (timeMatch) {
      return Number(timeMatch[1]) * 60 + Number(timeMatch[2] ?? 0);
    }

    const hourMatch = start.match(/\d+/);

    return hourMatch ? Number(hourMatch[0]) * 60 : 9999;
  }

  private parseScheduleDate(dateStr: string): ISODate {
    const normalized = dateStr.trim();

    const match = normalized.match(/^(\d{1,2})-([A-Za-z]{3})$/);

    if (!match) {
      throw new Error(`Invalid schedule date: "${dateStr}"`);
    }

    const day = Number(match[1]);
    const monthName = match[2].toLowerCase();

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

    const month = months[monthName];

    if (!month) {
      throw new Error(`Invalid schedule month: "${dateStr}"`);
    }

    const year = new Date().getFullYear();

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as ISODate;
  }
}
