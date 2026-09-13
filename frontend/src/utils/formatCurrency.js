export const formatCurrency = (value = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatCompactNumber = (value = 0) => {
  return new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value || 0);
};
