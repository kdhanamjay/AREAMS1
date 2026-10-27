// Utility functions for Amara Raja Group EAMS

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function calculateDaysRemaining(targetDate?: string): { days: number; status: 'Expired' | 'Urgent' | 'Soon' | 'OK' } {
  if (!targetDate) return { days: 9999, status: 'OK' };
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { days: diffDays, status: 'Expired' };
  if (diffDays <= 30) return { days: diffDays, status: 'Urgent' };
  if (diffDays <= 60) return { days: diffDays, status: 'Soon' };
  return { days: diffDays, status: 'OK' };
}

export function generateAssetTag(orgCode: string, catCode: string, count: number): string {
  const year = new Date().getFullYear();
  const numStr = String(count + 1).padStart(4, '0');
  return `ARG-${orgCode.toUpperCase()}-${catCode.toUpperCase()}-${year}-${numStr}`;
}
