import { api, unwrap } from './client';
import type { DashboardData } from '../types';

export const dashboardApi = {
  get() {
    return unwrap<DashboardData>(api.get('/dashboard'));
  },
};
