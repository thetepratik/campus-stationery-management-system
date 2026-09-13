export const STATUS_BADGE_MAP = {
  pending: 'pending',
  confirmed: 'confirmed',
  packing: 'confirmed',
  'ready-for-pickup': 'ready',
  collected: 'ready',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packing: 'Packing',
  'ready-for-pickup': 'Ready for Pickup',
  collected: 'Collected',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** The single next step in the pipeline for a given status, or null if terminal/cancel-only. */
export const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'packing',
  packing: 'ready-for-pickup',
  'ready-for-pickup': 'collected',
  collected: 'completed',
};

export const isTerminalStatus = (status) => ['completed', 'cancelled', 'refunded'].includes(status);
