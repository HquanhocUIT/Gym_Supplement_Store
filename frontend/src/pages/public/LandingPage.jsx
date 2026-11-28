import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Dumbbell, UserRoundCheck, Smartphone, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import useApiQuery from '../../hooks/useApiQuery';
import { Eyebrow } from '../../components/Brand';

const featuredCategories = [
  { id: 'whey', label: 'Whey protein', matches: /whey|protein/i },
  { id: 'creatine', label: 'Creatine', matches: /creatine/i },
  { id: 'pre-workout', label: 'Pre-workout', matches: /pre[ -]?workout/i },
];

// Trang chủ giữ cùng kiểu chữ, màu và icon với các trang Store.
const features = [
  { icon: Dumbbell, title: 'Equipment for every session', description: 'Build a balanced routine with equipment for strength, mobility and conditioning.' },
  { icon: UserRoundCheck, title: 'Support for your training', description: 'Find the guidance and membership plan that fit your experience and goals.' },
  { icon: Smartphone, title: 'Membership made simple', description: 'Explore plans online and keep your membership and check-in history in one place.' },
];

export default function LandingPage() {
  const [expandedProductId, setExpandedProductId] = useState(null);
  const featuredQuery = useApiQuery({
    queryKey: ['overview-featured-products'],
    url: '/store/products',
    params: { page: 1, limit: 100, sort: 'name_asc' },
    retry: false,
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      if (!Array.isArray(data?.items)) throw new Error('The server returned an unexpected product list.');

      return featuredCategories.map(({ id, label, matches }) => {
        const products = data.items.filter((product) => matches.test(product.category_name || ''));
        const product = products.find((item) => item.image_url && Number(item.total_stock) > 0)
          || products.find((item) => item.image_url)
          || products.find((item) => Number(item.total_stock) > 0)
          || products[0];

        return product ? { ...product, featuredCategory: label, featuredKey: id } : null;
      }).filter(Boolean);
    },
  });

  return (
    <div className="bg-paper text-ink">
      {/* Nền tối dùng chữ sáng; hành động chính dẫn tới gói tập. */}
      <section className="bg-night px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-6xl">
            Build strength.<br className="hidden sm:block" /> Find your routine.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Flexible gym memberships, purposeful training and supplements that support your goals.
          </p>
          <div className="mx-auto mt-9 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <Link to="/shop" className="inline-flex min-h-16 items-center justify-center gap-3 rounded-xl bg-brand-500 px-7 py-4 text-base font-bold text-ink transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-h-[72px]">
              Explore the shop <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link to="/pricing" className="inline-flex min-h-16 items-center justify-center gap-3 rounded-xl border border-white/45 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-h-[72px]">
              Explore memberships <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Icon nét đồng nhất và khoảng cách rộng giúp nội dung dễ đọc trên điện thoại. */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="why-title">
        <h2 id="why-title" className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Why train with Gym Bro?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-12 lg:gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-card border border-line bg-white px-7 py-9 shadow-card sm:px-8 sm:py-10">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-6 font-display text-xl font-bold leading-7">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-night px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8" aria-labelledby="featured-shop-title">
        <div className="mx-auto max-w-7xl">
          <header className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow dark>From the Gym Bro shop</Eyebrow>
              <h2 id="featured-shop-title" className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Take a look at the shop</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">A few training essentials to get you started.</p>
            </div>
            <Link to="/shop" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-ink transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Explore the shop <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </header>

          {featuredQuery.isPending ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading featured products">
              {featuredCategories.map(({ id }) => <div key={id} className="min-h-[29rem] motion-safe:animate-pulse bg-white/10" />)}
            </div>
          ) : featuredQuery.isError ? (
            <div className="rounded-2xl border border-white/20 p-8 text-center" role="alert">
              <p>Featured products are temporarily unavailable.</p>
              <button className="mt-4 min-h-11 rounded-xl border border-white/50 px-5 font-bold hover:bg-white/10" type="button" onClick={() => featuredQuery.refetch()} disabled={featuredQuery.isFetching}>Try again</button>
            </div>
          ) : featuredQuery.data.length === 0 ? (
            <p className="rounded-2xl border border-white/20 p-8 text-center text-slate-300" role="status">No featured products are available right now.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredQuery.data.map((product) => (
                <FeaturedProductCard
                  key={product.featuredKey}
                  product={product}
                  expanded={expandedProductId === product.id}
                  onToggle={() => setExpandedProductId((current) => current === product.id ? null : product.id)}
                  onReset={() => setExpandedProductId(null)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">Ready for your next session?</h2>
          <p className="mt-4 text-base leading-7 text-ink-soft">Create an account to manage your membership and shop for your training essentials.</p>
          <Link to="/register" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700">
            Create an account <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeaturedProductCard({ product, expanded, onToggle, onReset }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const hasImage = product.image_url && failedUrl !== product.image_url;
  const price = product.lowest_price === null || product.lowest_price === undefined
    ? 'Price unavailable'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(product.lowest_price));

  return (
    <article className={`overview-feature-card${hasImage ? ' overview-feature-card--with-image' : ''}${hasImage && expanded ? ' overview-feature-card--expanded' : ''}`}>
      <div className="overview-feature-card__scene" onKeyDown={(event) => { if (event.key === 'Escape') onReset(); }}>
        <div className="overview-feature-card__surface">
          <div className="overview-feature-card__header">
            <div className="min-w-0">
              <p className="overview-feature-card__category">{product.featuredCategory}</p>
              <h3 className="overview-feature-card__title"><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
            </div>
            <div className="overview-feature-card__price">
              <p className="overview-feature-card__price-label">From</p>
              <p className="overview-feature-card__price-value">{price}</p>
              <Link className="overview-feature-card__details" to={`/product/${product.id}`} aria-label={`View details for ${product.name}`}>View details</Link>
            </div>
          </div>
          {hasImage ? (
            <button className="overview-feature-card__image-stage" type="button" aria-label={`Enlarge image of ${product.name}`} aria-pressed={expanded} onClick={onToggle}>
              <img className="overview-feature-card__image" src={product.image_url} alt={product.name} loading="lazy" onError={() => setFailedUrl(product.image_url)} />
              <span className="overview-feature-card__zoom-hint" aria-hidden="true">
                {expanded ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                {expanded ? 'Reset' : 'Enlarge'}
              </span>
            </button>
          ) : (
            <div className="overview-feature-card__image-stage">
              <span className="text-sm font-medium text-ink-soft">Product photo coming soon</span>
            </div>
          )}
          <div className="overview-feature-card__footer">
            <p className="overview-feature-card__description">{product.description || 'Product details are being updated.'}</p>
            <Link to={`/product/${product.id}`} aria-label={`Explore ${product.name}`} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-extrabold uppercase text-ink">Explore <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
        {hasImage && (
          <div className="overview-feature-card__foreground" aria-hidden="true">
            <img className="overview-feature-card__image" src={product.image_url} alt="" loading="lazy" onError={() => setFailedUrl(product.image_url)} />
          </div>
        )}
      </div>
    </article>
  );
}
