import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DutySchedulePageComponent } from './features/duty-schedule/containers/duty-schedule-page.component';
import { ShiftService } from './services/shift.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DutySchedulePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  userShifts: any[] = [];
  username: string = '';

  constructor(private shiftService: ShiftService) {}

  ngOnInit() {
    // Notify Telegram that the Mini App is ready and expanded
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // Fetch previously saved user shifts & profile
    this.shiftService.getUserData().subscribe({
      next: (res) => {
        if (res?.shifts) {
          this.userShifts = res.shifts;
          this.username = res.profile?.username || '';
          console.log('Loaded user data from Cloudflare KV:', res);
        }
      },
      error: (err) => console.error('Failed to load user data:', err),
    });
  }

  // Example trigger when user updates shifts or clicks a action
  onSaveButtonClicked(buttonName: string, shiftsData: any[]) {
    this.shiftService.saveUserData(shiftsData, buttonName).subscribe({
      next: (res) => console.log('Successfully saved to KV!'),
      error: (err) => console.error('Error saving:', err),
    });
  }
}
