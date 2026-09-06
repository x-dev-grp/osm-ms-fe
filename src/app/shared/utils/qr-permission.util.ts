import { AuthenticationService } from '../../auth/services/authentication.service';
import { Action, OOSMModule, permissionKey } from '../../theme/types/permissions';

/** True when the user may force-regenerate an existing QR code for the entity. */
export function canRegenerateQr(
  auth: AuthenticationService,
  module: OOSMModule,
  entity: string
): boolean {
  return auth.hasPermission(permissionKey(module, entity, Action.REGENERATE_QR));
}
