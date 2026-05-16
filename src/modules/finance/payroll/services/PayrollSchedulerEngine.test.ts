import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayrollSchedulerEngine } from './PayrollSchedulerEngine';
import { usePayrollStore } from '../stores/usePayrollStore';
import { PayrollSchedule, PayrollProfile } from '../types';

describe('PayrollSchedulerEngine', () => {
    beforeEach(() => {
        // Reset stores before each test
        usePayrollStore.setState({
            profiles: [],
            schedules: [],
            runs: [],
            payslips: []
        });
    });

    it('should match profiles based on schedule target constraints', () => {
        const schedule: PayrollSchedule = {
            id: 's1', name: 'Test', frequency: 'monthly', branchId: 'b1', nextRunDate: '', cutoffDate: '', autoGenerate: true, isLocked: false, isActive: true,
            targetEmploymentTypes: ['full_time'],
            targetCompensationModels: ['fixed_salary']
        };

        const profiles: any[] = [
            { id: 'p1', branchId: 'b1', employmentType: 'full_time', compensationModel: 'fixed_salary', isActive: true }, // Match
            { id: 'p2', branchId: 'b1', employmentType: 'contract', compensationModel: 'fixed_salary', isActive: true }, // Miss type
            { id: 'p3', branchId: 'b1', employmentType: 'full_time', compensationModel: 'hourly', isActive: true }, // Miss comp
            { id: 'p4', branchId: 'b2', employmentType: 'full_time', compensationModel: 'fixed_salary', isActive: true }, // Miss branch
        ];

        const matched = PayrollSchedulerEngine.getProfilesForSchedule(schedule, profiles);
        expect(matched.length).toBe(1);
        expect(matched[0].id).toBe('p1');
    });
});
