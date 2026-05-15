import { platformRegistry } from './registry';
import { widgetRegistry } from '../dashboard/WidgetRegistry';
import { membershipModule } from '../../modules/membership/membership.module';
import { financeModule } from '../../modules/finance/finance.module';
import { communicationsModule } from '../../modules/communications/communications.module';
import { administrationModule } from '../../modules/administration/administration.module';
import { ministriesModule } from '../../modules/ministries/ministries.module';
import { attendanceModule } from '../../modules/attendance/attendance.module';
import { eventsModule } from '../../modules/events/events.module';
import { welfareModule } from '../../modules/welfare/welfare.module';
import { departmentsModule } from '../../modules/departments/departments.module';
import { bibleSchoolModule } from '../../modules/bible-school/bible-school.module';

export function bootstrapPlatform() {
  const modules = [
    membershipModule,
    financeModule,
    communicationsModule,
    administrationModule,
    ministriesModule,
    attendanceModule,
    eventsModule,
    welfareModule,
    departmentsModule,
    bibleSchoolModule
  ];

  modules.forEach(mod => {
    platformRegistry.registerModule(mod);
    
    if (mod.widgets) {
      mod.widgets.forEach(widget => {
        widgetRegistry.registerWidget({
          id: widget.id,
          workspace: widget.workspace || 'home', // Default to home workspace for legacy widgets
          component: widget.component,
          title: widget.name,
          permissions: [],
          featureFlag: mod.id,
          size: widget.size || 'large' // Or whatever default fits the new grid
        });
      });
    }
  });
}
