import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { keywordDestination, searchDestinations } from '../lib/siteSearch';

// Dùng cùng một ô tìm kiếm cho header khách và header quản trị.
export default function SiteSearch({ scope = 'store' }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const destinations = searchDestinations(keyword, scope);
  const label = scope === 'admin' ? 'Search admin pages' : 'Search the site';

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; trigger?.focus(); };
  }, [open]);

  function close() { setOpen(false); setKeyword(''); }
  function go(to) {
    if (!to) return;
    close();
    // Tìm lại đúng kết quả hiện tại không thêm entry trùng làm Back bị đứng tại chỗ.
    if (to !== location.pathname + location.search) navigate(to);
  }
  function handleKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    // Giữ Tab trong hộp tìm kiếm; Escape hoặc nút Close luôn đóng được hộp.
    if (event.key === 'Tab') {
      const controls = [...panelRef.current.querySelectorAll('input, button:not(:disabled)')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  return <>
    <button ref={triggerRef} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand-700" type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)}><Search size={19} aria-hidden="true" /></button>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-night/45 px-4 py-8 sm:py-20" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section ref={panelRef} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="mx-auto w-full max-w-xl rounded-2xl border border-line bg-white p-4 shadow-xl sm:p-6" onKeyDown={handleKey}>
        <div className="mb-4 flex items-center justify-between gap-4"><h2 id={`${id}-title`} className="text-lg font-bold">{label}</h2><button className="grid size-11 place-items-center rounded-xl text-ink-soft hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand-700" type="button" aria-label="Close search" onClick={close}><X size={20} aria-hidden="true" /></button></div>
        <form role="search" aria-label={label} onSubmit={(event) => { event.preventDefault(); go(keywordDestination(keyword, scope)); }}>
          <div className="flex min-w-0 items-center rounded-xl border border-line bg-white focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-100">
            <Search className="ml-3 shrink-0 text-ink-soft" size={20} aria-hidden="true" />
            <input ref={inputRef} className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none" type="search" aria-label="Keyword" placeholder="Enter a keyword" autoComplete="off" maxLength={200} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            {keyword && <button type="button" className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-paper" aria-label="Clear keyword" onClick={() => { setKeyword(''); inputRef.current?.focus(); }}><X size={18} aria-hidden="true" /></button>}
            <button className="mr-1 grid size-11 shrink-0 place-items-center rounded-lg bg-ink text-white disabled:opacity-40" type="submit" aria-label="Submit search" disabled={!keyword.trim()}><ArrowRight size={18} aria-hidden="true" /></button>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">Search products or choose a page below. Press Enter to continue.</p>
        </form>
        <div className="mt-5 space-y-1" aria-label="Search suggestions">
          {keyword.trim() && <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-brand-50 p-3 text-left text-sm font-bold text-brand-700 hover:bg-brand-100" onClick={() => go(`${scope === 'admin' ? '/admin/products' : '/shop'}?${new URLSearchParams({ q: keyword.trim() })}`)}><span className="min-w-0 break-words">Search products for “{keyword.trim()}”</span><Search className="shrink-0" size={17} aria-hidden="true" /></button>}
          {destinations.map((page) => <button key={page.to} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl p-3 text-left text-sm font-semibold text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand-700" type="button" onClick={() => go(page.to)}>{page.label}<ArrowRight size={16} aria-hidden="true" /></button>)}
        </div>
      </section>
    </div>}
  </>;
}
