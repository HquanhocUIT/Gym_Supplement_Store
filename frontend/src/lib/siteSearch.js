// Chuẩn hóa cả từ khóa tiếng Việt để gợi ý các trang tiếng Anh tương ứng.
export function normalizeKeyword(value) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ');
}
const storePages = [
  { label: 'Shop products', to: '/shop', keywords: ['shop', 'products', 'san pham', 'cua hang'] },
  { label: 'Membership plans', to: '/pricing', keywords: ['membership', 'membership plans', 'plan', 'plans', 'gym', 'goi tap'] },
  { label: 'My plan', to: '/member/plan', keywords: ['my plan', 'my membership', 'goi cua toi'] },
  { label: 'My orders', to: '/member/orders', keywords: ['orders', 'order', 'my orders', 'don hang'] },
  { label: 'Shopping cart', to: '/cart', keywords: ['cart', 'gio hang'] },
  { label: 'My account', to: '/member', keywords: ['account', 'profile', 'member', 'tai khoan', 'ho so'] },
  { label: 'Sign in', to: '/login', keywords: ['login', 'sign in', 'dang nhap'] },
];
const adminPages = [
  { label: 'Products & stock', to: '/admin/products', keywords: ['products', 'stock', 'inventory', 'san pham', 'ton kho'] },
  { label: 'Dashboard', to: '/admin/dashboard', keywords: ['dashboard', 'stats', 'revenue', 'thong ke', 'doanh thu'] },
  { label: 'Membership plans', to: '/admin/plans', keywords: ['membership', 'plans', 'goi tap'] },
  { label: 'Members', to: '/admin/members', keywords: ['members', 'users', 'hoi vien'] },
];
export function searchDestinations(keyword, scope = 'store') {
  const value = normalizeKeyword(keyword);
  const pages = scope === 'admin' ? adminPages : storePages;
  return pages.filter((page) => !value || normalizeKeyword(page.label).includes(value)
    || page.keywords.some((word) => word.includes(value)));
}

// Enter chỉ chuyển trang trực tiếp với tên mục rõ ràng; từ còn lại dùng tìm sản phẩm.
export function keywordDestination(keyword, scope = 'store') {
  const value = normalizeKeyword(keyword);
  if (!value) return null;
  const exact = searchDestinations(keyword, scope).find((page) => normalizeKeyword(page.label) === value || page.keywords.includes(value));
  if (exact) return exact.to;
  return `${scope === 'admin' ? '/admin/products' : '/shop'}?${new URLSearchParams({ q: keyword.trim() })}`;
}
