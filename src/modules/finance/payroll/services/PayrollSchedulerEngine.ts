import { usePayrollStore } from '../stores/usePayrollStore';
import { PayrollSchedule, PayrollProfile } from '../types';
import { PayrollEngine } from './PayrollEngine';
import { v4 as uuidv4 } from 'uuid';

export class PayrollSchedulerEngine {
    /**
     * Finds profiles matching the schedule constraints.
     */
    static getProfilesForSchedule(schedule: PayrollSchedule, activeProfiles: PayrollProfile[]): PayrollProfile[] {
        return activeProfiles.filter(profile => {
            // Check branch/district filters (simplified for branch match or HQ)
            if (schedule.branchId && schedule.branchId !== 'global' && profile.branchId !== schedule.branchId) {
                return false;
            }

            // Check Employment Type
            if (schedule.targetEmploymentTypes && schedule.targetEmploymentTypes.length > 0) {
                if (!schedule.targetEmploymentTypes.includes(profile.employmentType)) {
                    return false;
                }
            }

            // Check Roles
            if (schedule.targetRoles && schedule.targetRoles.length > 0) {
                if (!schedule.targetRoles.includes(profile.role)) {
                    return false;
                }
            }

            // Check Compensation Models
            if (schedule.targetCompensationModels && schedule.targetCompensationModels.length > 0) {
                if (!profile.compensationModel || !schedule.targetCompensationModels.includes(profile.compensationModel)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Evaluate if a schedule's cutoff means it's time to generate.
     * In a real environment, a scheduled CRON job calls this.
     */
    static processDueSchedules() {
        const state = usePayrollStore.getState();
        const now = new Date();

        state.schedules.forEach(schedule => {
            if (!schedule.isActive || !schedule.autoGenerate || schedule.isLocked) return;

            const cutoffDate = new Date(schedule.cutoffDate);
            if (now >= cutoffDate) {
                // Generate draft run!
                const matchedProfiles = this.getProfilesForSchedule(schedule, state.profiles.filter(p => p.isActive));
                
                if (matchedProfiles.length === 0) return; // Nobody to pay

                // Use the Engine!
                const { run, payslips } = PayrollEngine.processPayrollRun(
                    `${schedule.name} - Auto Run ${now.toLocaleString('default', { month: 'short', year: 'numeric' })}`,
                    new Date(schedule.nextRunDate).toISOString(), // Mock
                    new Date(schedule.nextRunDate).toISOString(),
                    schedule.branchId,
                    'System Auto-Gen'
                );

                // Lock the schedule temporarily so it doesn't double-fire
                const lockedSchedule = { ...schedule, isLocked: true };
                
                usePayrollStore.setState({
                    schedules: state.schedules.map(s => s.id === schedule.id ? lockedSchedule : s),
                    runs: [run, ...state.runs],
                    payslips: [...payslips, ...state.payslips]
                });
                console.log(`Auto-generated payroll run for ${schedule.name}. Scheduled marked as locked.`);
            }
        });
    }
}
