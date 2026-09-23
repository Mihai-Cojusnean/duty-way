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
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-duty-schedule-page',
  standalone: true,
  imports: [ScheduleFinderComponent, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './duty-schedule-page.component.html',
  styleUrl: './duty-schedule-page.component.css',
})
export class DutySchedulePageComponent {
  private readonly telegramService = inject(TelegramService);
  private readonly apiService = inject(ApiService);
  private readonly adminService = inject(AdminService);

  readonly selectedUserId = signal<string | null>(null);

  readonly session = resource({
    loader: () => this.apiService.getCurrentUser(),
  });

  readonly isAdmin = computed(() => this.session.value()?.role === 'admin');

  readonly users = rxResource({
    params: () => (this.isAdmin() ? {} : undefined),
    stream: () => this.adminService.getUsers(),
  });

  readonly selectedUser = computed(
    () =>
      (this.users.value() ?? []).find((u) => u.telegram_user_id === this.selectedUserId()) ?? null,
  );

  readonly activeUser = computed<ViewedUser | null>(() => {
    const selected = this.selectedUser();
    if (selected) {
      return {
        telegram_user_id: selected.telegram_user_id,
        work_name: selected.work_name,
        isAdmin: false,
      };
    }

    const me = this.session.value();
    if (!me) {
      return null;
    }

    return {
      telegram_user_id: String(me.id),
      work_name: me.work_name ?? '',
      isAdmin: me.role === 'admin',
    };
  });

  readonly statusMessage = computed(() => {
    if (this.session.error()) {
      return 'Please open this app through Telegram to load your schedule.';
    }
    const user = this.selectedUser();
    return user ? `Loading ${user.work_name}'s schedule...` : '';
  });

  constructor() {
    this.telegramService.init();
  }

  selectUser(telegramUserId: string): void {
    this.selectedUserId.set(telegramUserId || null);
  }
}
