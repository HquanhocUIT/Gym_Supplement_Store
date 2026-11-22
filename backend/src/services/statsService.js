const statsRepository = require('../repositories/statsRepository');

// Ngưỡng tồn kho thấp mặc định để dashboard có cách đánh dấu thống nhất.
const LOW_STOCK_THRESHOLD = 5;

// Chuyển giá trị PostgreSQL numeric sang số để frontend dễ hiển thị.
function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// Gom số liệu Gym, Store và tình trạng vận hành vào một response dashboard.
exports.getAdminStats = async () => {
  const [revenue, activeMemberCount, expiringMemberships, topProducts, lowStockVariants] = await Promise.all([
    statsRepository.getRevenue(),
    statsRepository.getActiveMemberCount(),
    statsRepository.getExpiringMemberships(),
    statsRepository.getTopProducts(),
    statsRepository.getLowStockVariants(LOW_STOCK_THRESHOLD),
  ]);

  const storeToday = toNumber(revenue.store_today);
  const gymToday = toNumber(revenue.gym_today);
  const storeMonth = toNumber(revenue.store_month);
  const gymMonth = toNumber(revenue.gym_month);

  return {
    revenue: {
      today: { store: storeToday, gym: gymToday, total: storeToday + gymToday },
      month: { store: storeMonth, gym: gymMonth, total: storeMonth + gymMonth },
    },
    active_members: toNumber(activeMemberCount),
    expiring_memberships: expiringMemberships,
    top_products: topProducts.map((product) => ({
      ...product,
      units_sold: toNumber(product.units_sold),
      sales_amount: toNumber(product.sales_amount),
    })),
    low_stock: {
      threshold: LOW_STOCK_THRESHOLD,
      items: lowStockVariants.map((variant) => ({ ...variant, stock: toNumber(variant.stock) })),
    },
  };
};
