import { useQuery } from '@tanstack/react-query';

import { api } from '../../api';

export interface Plan {
  code: string;
  name: string;
  audience: string;
  period: string;
  google_product_id: string;
  google_base_plan_id: string;
  price_ugx: string | null;
  available_until: string | null;
  is_active: boolean;
  sort_order: number;
  active_subscribers: number;
}

export const PLANS_KEY = ['admin-plans'];

/** The plan catalogue (a handful of rows, so it is fetched whole). */
export function usePlans() {
  return useQuery({ queryKey: PLANS_KEY, queryFn: async () => (await api<Plan[]>('/admin/subscriptions/plans')).data });
}
