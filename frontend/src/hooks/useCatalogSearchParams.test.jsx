import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import useCatalogSearchParams from './useCatalogSearchParams';

afterEach(cleanup);

function Probe() {
  const { search, minPrice, category, sort, page, updateFilters, setPage, clearFilters, finishEditing } = useCatalogSearchParams();
  const location = useLocation(), navigate = useNavigate();
  return <>
    <output data-testid="url">{location.pathname}{location.search}</output>
    <input aria-label="Keyword" value={search} onChange={(e) => updateFilters({ q: e.target.value }, { typing: true })} onBlur={finishEditing} />
    <input aria-label="Minimum" value={minPrice} onChange={(e) => updateFilters({ minPrice: e.target.value }, { typing: true })} onBlur={finishEditing} />
    <select aria-label="Category" value={category} onChange={(e) => updateFilters({ category: e.target.value })}><option value="">All</option><option value="2">Creatine</option></select>
    <select aria-label="Sort" value={sort} onChange={(e) => updateFilters({ sort: e.target.value })}><option value="newest">Newest</option><option value="price_asc">Price ascending</option></select>
    <button onClick={() => navigate(-1)}>Back</button><button onClick={() => navigate(1)}>Forward</button>
    <button onClick={() => setPage(page + 1)}>Next page</button><button onClick={clearFilters}>Clear filters</button>
  </>;
}
function setup(path = '/shop') {
  render(<MemoryRouter initialEntries={['/', path]}><Probe /></MemoryRouter>);
}
const url = () => screen.getByTestId('url').textContent;
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));

it('gõ nhiều ký tự tạo một bước lịch sử; Back về danh sách ban đầu và Forward khôi phục từ khóa đầy đủ', () => {
  setup();
  for (const value of ['w', 'wh', 'whe', 'whey']) fireEvent.change(screen.getByLabelText('Keyword'), { target: { value } });
  expect(url()).toBe('/shop?q=whey');
  click('Back'); expect(url()).toBe('/shop'); expect(screen.getByLabelText('Keyword').value).toBe('');
  click('Forward'); expect(url()).toBe('/shop?q=whey');
  click('Back'); click('Back'); expect(url()).toBe('/');
});
it('sau Back, lượt nhập mới không ghi đè entry cũ', () => {
  setup('/shop?q=creatine');
  fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'whey' } });
  click('Back'); expect(url()).toBe('/shop?q=creatine');
  fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'belt' } });
  click('Back'); expect(url()).toBe('/shop?q=creatine');
  click('Back'); expect(url()).toBe('/');
});
it('mỗi lần chọn category, sort hoặc Clear filters đều có thể Back để hoàn tác', () => {
  setup('/shop?q=whey');
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '2' } });
  expect(url()).toContain('category=2');
  fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'price_asc' } });
  click('Back'); expect(screen.getByLabelText('Sort').value).toBe('newest');
  expect(screen.getByLabelText('Category').value).toBe('2');
  click('Clear filters'); expect(url()).toBe('/shop');
  click('Back'); expect(url()).toBe('/shop?q=whey&category=2');
  click('Back'); expect(url()).toBe('/shop?q=whey');
});
it('nhập khoảng giá cũng được gom và khôi phục bằng một lần Back', () => {
  setup();
  for (const value of ['1', '10', '100000']) fireEvent.change(screen.getByLabelText('Minimum'), { target: { value } });
  click('Back'); expect(url()).toBe('/shop');
  click('Forward'); expect(screen.getByLabelText('Minimum').value).toBe('100000');
});
it('lọc từ trang 2 về trang 1; Back trả lại cả trang 2 và bộ lọc trước đó', () => {
  setup('/admin/products?category=2&page=2');
  fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'whey' } });
  expect(url()).not.toContain('page=2');
  click('Back'); expect(url()).toBe('/admin/products?category=2&page=2');
  click('Next page'); expect(url()).toBe('/admin/products?category=2&page=3');
  click('Back'); expect(url()).toBe('/admin/products?category=2&page=2');
});
