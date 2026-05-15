import { v4 as uuidv4 } from 'uuid';
import { systemEvents, Events } from '../events/EventBus';

export interface ProvisionTenantCommand {
  organizationName: string;
  adminEmail: string;
  adminName: string;
  planId: string;
}

class TenantProvisioningService {
  private static instance: TenantProvisioningService;

  private constructor() {}

  public static getInstance(): TenantProvisioningService {
    if (!TenantProvisioningService.instance) {
      TenantProvisioningService.instance = new TenantProvisioningService();
    }
    return TenantProvisioningService.instance;
  }

  public async provisionNewTenant(command: ProvisionTenantCommand): Promise<{ organizationId: string }> {
    const orgId = uuidv4();
    
    // In actual implementation: 
    // 1. Create org in Firestore / DB
    // 2. Create the owner user record
    // 3. Set up the subscription record
    // 4. Provision default branch if necessary
    
    console.log(`[Provisioning] Creating new tenant: ${command.organizationName} on plan ${command.planId}`);

    // Fire the provisioning event (we'd add TENANT_PROVISIONED to EventPayloadMap natively)
    systemEvents.publish('TENANT_PROVISIONED' as any, {
      organizationId: orgId,
      name: command.organizationName,
      adminEmail: command.adminEmail,
      planId: command.planId
    });

    return { organizationId: orgId };
  }
}

export const tenantProvisioner = TenantProvisioningService.getInstance();
