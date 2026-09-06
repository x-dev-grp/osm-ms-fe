import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { MillPlanningConfigService } from '../../shared/services/mill-planning-config.service';
import { ToastService } from '../../shared/services/toast.service';

export { ENABLE_MILL_PLANNING_CODE } from '../../shared/services/mill-planning-config.service';

/** Blocks the kanban planning board when ENABLE_MILL_PLANNING is false. */
export const millPlanningEnabledGuard: CanActivateFn = () => {
  const planningConfig = inject(MillPlanningConfigService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return planningConfig.isEnabled().pipe(
    map((enabled) => {
      if (enabled) {
        return true;
      }
      toast.warning('RECEPTION.PLANNING.DISABLED_HINT');
      return router.createUrlTree(['/reception']);
    })
  );
};
