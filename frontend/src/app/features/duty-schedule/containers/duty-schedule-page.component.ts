import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { ScheduleFinderComponent } from '../components/schedule-finder/schedule-finder.component';
import { TelegramService } from '../../../core/telegram.service';
import { ApiService } from '../../../core/api.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../core/admin.service';
import { ViewedUser } from '../interfaces/user.interface';

@Component({
  selector: 'app-duty-schedule-page',
  standalone: true,
  imports: [ScheduleFinderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './duty-schedule-page.component.html',
  styleUrl: './duty-schedule-page.component.css',
})
export class DutySchedulePageComponent {
  private readonly telegramService = inject(TelegramService);
  private readonly apiService = inject(ApiService);
  private readonly adminService = inject(AdminService);

  readonly selectedUserId = signal<string | null>(null);
  readonly session = resource({ loader: () => this.apiService.getCurrentUser() });
  readonly isAdmin = computed(() => this.session.value()?.is_admin ?? false);

  readonly users = rxResource({
    params: () => (this.isAdmin() ? {} : undefined),
    stream: () => this.adminService.getUsers(),
  });

  readonly otherUsers = computed(() =>
    (this.users.value() ?? []).filter((u) => u.telegram_id !== this.session.value()?.telegram_id),
  );

  readonly selectedUser = computed(
    () => this.otherUsers().find((u) => u.telegram_id === this.selectedUserId()) ?? null,
  );

  readonly viewedUser = computed<ViewedUser | null>(() => {
    const selected = this.selectedUser();
    if (selected) {
      return { user: selected, isViewingSelf: false };
    }

    const me = this.session.value();
    return me ? { user: me, isViewingSelf: true } : null;
  });

  readonly statusMessage = computed(() => {
    if (this.session.error()) {
      return 'Please open this app through Telegram to load your schedule.';
    }
    const selected = this.selectedUser();
    return selected ? `Loading ${selected.work_name}'s schedule...` : '';
  });

  constructor() {
    this.telegramService.init();
  }

  selectUser(telegramUserId: string): void {
    this.selectedUserId.set(telegramUserId || null);
  }
}
