import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IndianRupee, ShoppingBag, Eye, TrendingUp, TrendingDown, Users, MapPin, Package, Tag, Star, ShoppingCart, Repeat, Boxes } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { Tilt3D } from './Tilt3D';
import { LockedCard } from './LockedCard';
import { Canvas3DBoundary } from './Canvas3DBoundary';
import { Globe3D } from './charts3d/Globe3D';
import { RevenueChart, CategoryDonut, RadialGauge, ConversionFunnel, TrafficBars, SignupLine, HeatmapGrid } from './charts2d';
import { paletteColor } from './theme3d';

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

/**
 * Master lock: when true, every widget is blurred behind the upgrade overlay.
 * Flip to false (or drive from a subscription/entitlement flag) to reveal.
 */
const LOCKED = true;

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      <Icon className="w-4 h-4" />
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

const cardHeader = (title: string, subtitle?: string) => (
  <div>
    <h2 className="font-cursive text-2xl font-bold">{title}</h2>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
);

function WidgetCard({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  // When unlocked, render a plain Tilt3D card. When locked, show a clear header
  // (so the user knows what it is) over blurred content.
  if (!LOCKED) {
    return (
      <Tilt3D className={`p-6 ${className}`}>
        <div className="mb-4">{cardHeader(title, subtitle)}</div>
        {children}
      </Tilt3D>
    );
  }
  return (
    <LockedCard locked header={cardHeader(title, subtitle)} className={className}>
      <div className="p-6 pt-4">{children}</div>
    </LockedCard>
  );
}

/** KPI tile that is also lockable. `label` stays clear; the big value blurs. */
function KpiTile({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  if (!LOCKED) {
    return <Tilt3D className="p-6 h-full">{children}</Tilt3D>;
  }
  return (
    <LockedCard locked header={<div className="text-sm font-semibold text-foreground">{label}</div>}>
      <div className="p-6 pt-4">{children}</div>
    </LockedCard>
  );
}

export function AdvancedDashboard() {
  const summary = useQuery({ queryKey: ['an-summary'], queryFn: analyticsApi.getSummary });
  const revenue = useQuery({ queryKey: ['an-revenue'], queryFn: () => analyticsApi.getRevenue(8) });
  const target = useQuery({ queryKey: ['an-target'], queryFn: analyticsApi.getMonthlyTarget });
  const categories = useQuery({ queryKey: ['an-categories'], queryFn: analyticsApi.getTopCategories });
  const activeUsers = useQuery({ queryKey: ['an-active-users'], queryFn: analyticsApi.getActiveUsers });
  const conversion = useQuery({ queryKey: ['an-conversion'], queryFn: () => analyticsApi.getConversion(7) });
  const traffic = useQuery({ queryKey: ['an-traffic'], queryFn: analyticsApi.getTrafficSources });
  // extra widgets
  const orderStatus = useQuery({ queryKey: ['an-order-status'], queryFn: analyticsApi.getOrderStatusBreakdown });
  const payment = useQuery({ queryKey: ['an-payment'], queryFn: analyticsApi.getPaymentBreakdown });
  const topProducts = useQuery({ queryKey: ['an-top-products'], queryFn: () => analyticsApi.getTopProducts(8) });
  const aov = useQuery({ queryKey: ['an-aov'], queryFn: analyticsApi.getAov });
  const cart = useQuery({ queryKey: ['an-cart'], queryFn: analyticsApi.getCartAbandonment });
  const coupons = useQuery({ queryKey: ['an-coupons'], queryFn: analyticsApi.getCouponPerformance });
  const newReturning = useQuery({ queryKey: ['an-new-returning'], queryFn: analyticsApi.getNewVsReturning });
  const signups = useQuery({ queryKey: ['an-signups'], queryFn: () => analyticsApi.getSignups(30) });
  const deadInv = useQuery({ queryKey: ['an-dead-inv'], queryFn: analyticsApi.getDeadInventory });
  const testimonials = useQuery({ queryKey: ['an-testimonials'], queryFn: analyticsApi.getTestimonialsSummary });
  const revByType = useQuery({ queryKey: ['an-rev-type'], queryFn: analyticsApi.getRevenueByType });
  const heatmap = useQuery({ queryKey: ['an-heatmap'], queryFn: analyticsApi.getSalesHeatmap });

  const kpis = [
    { icon: IndianRupee, label: 'Total Sales', metric: summary.data?.totalSales, fmt: inr },
    { icon: ShoppingBag, label: 'Total Orders', metric: summary.data?.totalOrders, fmt: (n: number) => (n || 0).toLocaleString() },
    { icon: Eye, label: 'Total Visitors', metric: summary.data?.totalVisitors, fmt: (n: number) => (n || 0).toLocaleString() },
  ];

  const topCategories = (categories.data?.categories ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 1. KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <KpiTile label={<span className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{k.label} <span className="opacity-60 font-normal">· vs last week</span></span>}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  {k.metric && <ChangeBadge value={k.metric.changePercent} />}
                </div>
                <h3 className="text-3xl font-bold mb-1">{k.metric ? k.fmt(k.metric.value) : '—'}</h3>
                <p className="text-sm text-muted-foreground">{k.label}</p>
              </KpiTile>
            </motion.div>
          );
        })}
      </div>

      {/* 2 + 3: Revenue chart + Monthly Target gauge */}
      <div className="grid lg:grid-cols-3 gap-6">
        <WidgetCard title="Revenue Analytics" subtitle="Last 8 days · revenue (area) & orders (line)" className="lg:col-span-2">
          <div className="h-72">
            <RevenueChart data={(revenue.data?.points ?? []).map((p) => ({ label: p.label, revenue: p.revenue, orders: p.orders }))} />
          </div>
        </WidgetCard>

        <WidgetCard title="Monthly Target" subtitle={target.data ? `Target ${inr(target.data.target)}` : 'Loading…'}>
          <div className="h-52">
            <RadialGauge percent={target.data?.achievedPercent ?? 0} />
          </div>
          {target.data && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Revenue: <b className="text-foreground">{inr(target.data.revenue)}</b></span>
              <ChangeBadge value={target.data.changePercent} />
            </div>
          )}
        </WidgetCard>
      </div>

      {/* 4 + 5: Top Categories donut + Active Users globe */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WidgetCard title="Top Categories" subtitle={categories.data ? `Total ${inr(categories.data.totalSales)}` : 'Loading…'}>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-56">
              <CategoryDonut data={topCategories.map((c) => ({ name: c.name, value: c.sales }))} />
            </div>
            <div className="flex flex-col justify-center gap-2">
              {topCategories.map((c, i) => (
                <div key={c.categoryId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: paletteColor(i) }} />
                    {c.name}
                  </span>
                  <b>{inr(c.sales)}</b>
                </div>
              ))}
              {!topCategories.length && <p className="text-sm text-muted-foreground">No category sales yet</p>}
            </div>
          </div>
        </WidgetCard>

        <WidgetCard title="Active Users" subtitle={activeUsers.data ? `${activeUsers.data.totalActiveUsers.toLocaleString()} active · where they're from` : 'Loading…'}>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-56">
              <Canvas3DBoundary>
                <Globe3D markers={(activeUsers.data?.byCountry ?? []).slice(0, 8).map((c, i) => ({ weight: c.percent / 100, index: i }))} />
              </Canvas3DBoundary>
            </div>
            <div className="flex flex-col justify-center gap-3">
              {(activeUsers.data?.byCountry ?? []).slice(0, 5).map((c) => (
                <div key={c.location}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{c.location}</span>
                    <span className="font-semibold">{c.percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.percent}%` }} transition={{ duration: 0.8 }} className="h-1.5 rounded-full bg-primary" />
                  </div>
                </div>
              ))}
              {!activeUsers.data?.byCountry.length && <p className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4" />No location data</p>}
            </div>
          </div>
        </WidgetCard>
      </div>

      {/* 6 + 7: Conversion funnel + Traffic sources */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WidgetCard title="Conversion Rate" subtitle="Last 7 days · faded = estimated">
          <div className="h-72">
            <ConversionFunnel data={(conversion.data?.stages ?? []).map((s) => ({ name: s.name, value: s.value, estimated: s.estimated }))} />
          </div>
        </WidgetCard>

        <WidgetCard title="Traffic Sources" subtitle="Where visitors come from">
          {traffic.data?.tracked ? (
            <div className="h-72">
              <TrafficBars data={traffic.data.sources.map((s) => ({ name: s.name, percent: s.percent }))} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Traffic attribution not tracked yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Add referrer / UTM capture to visit logging to populate this widget.
              </p>
            </div>
          )}
        </WidgetCard>
      </div>

      {/* ===== More insights (all real data) ===== */}
      <div className="pt-2">
        <h2 className="font-cursive text-3xl font-bold">More <span className="text-primary">Insights</span></h2>
        <p className="text-sm text-muted-foreground">Deeper metrics from your live store data</p>
      </div>

      {/* Quick KPI strip: AOV, Cart abandonment, New vs returning, Testimonials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile label={<span className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-primary" />Avg Order Value</span>}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><IndianRupee className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-bold">{aov.data ? inr(aov.data.averageOrderValue) : '—'}</h3>
          <p className="text-sm text-muted-foreground">Avg Order Value · {aov.data?.paidOrders ?? 0} paid</p>
        </KpiTile>
        <KpiTile label={<span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" />Abandoned Carts</span>}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><ShoppingCart className="w-5 h-5" /></div>
            {cart.data && <span className="text-sm font-semibold text-red-500">{cart.data.abandonmentRate.toFixed(1)}%</span>}
          </div>
          <h3 className="text-2xl font-bold">{cart.data?.abandonedCarts ?? 0}</h3>
          <p className="text-sm text-muted-foreground">Abandoned Carts · {cart.data ? inr(cart.data.abandonedValue) : '—'}</p>
        </KpiTile>
        <KpiTile label={<span className="flex items-center gap-2"><Repeat className="w-4 h-4 text-primary" />Returning Customers</span>}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Repeat className="w-5 h-5" /></div>
            {newReturning.data && <span className="text-sm font-semibold text-green-600">{newReturning.data.repeatRate.toFixed(1)}%</span>}
          </div>
          <h3 className="text-2xl font-bold">{newReturning.data?.returningCustomers ?? 0}</h3>
          <p className="text-sm text-muted-foreground">Returning · {newReturning.data?.newCustomers ?? 0} new</p>
        </KpiTile>
        <KpiTile label={<span className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Testimonials</span>}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Star className="w-5 h-5" /></div>
            {testimonials.data && <span className="text-sm font-semibold text-primary">★ {testimonials.data.averageRating.toFixed(2)}</span>}
          </div>
          <h3 className="text-2xl font-bold">{testimonials.data?.total ?? 0}</h3>
          <p className="text-sm text-muted-foreground">Testimonials · {testimonials.data?.active ?? 0} active</p>
        </KpiTile>
      </div>

      {/* Top products + Order status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WidgetCard title="Top Products" subtitle="Best sellers by revenue">
          <div className="space-y-2">
            {(topProducts.data?.products ?? []).map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.quantitySold} sold</span>
                <span className="text-sm font-semibold w-24 text-right">{inr(p.revenue)}</span>
              </div>
            ))}
            {!topProducts.data?.products.length && <p className="text-sm text-muted-foreground py-8 text-center">No sales yet</p>}
          </div>
        </WidgetCard>

        <WidgetCard title="Order Status" subtitle={`${orderStatus.data?.totalOrders ?? 0} total orders`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-56">
              <CategoryDonut data={(orderStatus.data?.statuses ?? []).filter((s) => s.count > 0).map((s) => ({ name: s.label, value: s.count }))} />
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              {(orderStatus.data?.statuses ?? []).map((s, i) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: paletteColor(i) }} />{s.label}</span>
                  <b>{s.count}</b>
                </div>
              ))}
            </div>
          </div>
        </WidgetCard>
      </div>

      {/* Payment breakdown + Revenue by type */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WidgetCard title="Payment Status" subtitle="Orders & amount by payment state">
          <div className="space-y-3">
            {(payment.data?.payments ?? []).map((p, i) => (
              <div key={p.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: paletteColor(i) }} />{p.label} <span className="text-muted-foreground">({p.count})</span></span>
                  <b>{inr(p.amount)}</b>
                </div>
              </div>
            ))}
          </div>
        </WidgetCard>

        <WidgetCard title="Revenue by Product Type" subtitle={revByType.data ? `Total ${inr(revByType.data.total)}` : 'Loading…'}>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-52">
              <CategoryDonut data={(revByType.data?.types ?? []).map((t) => ({ name: t.label, value: t.amount }))} />
            </div>
            <div className="flex flex-col justify-center gap-2">
              {(revByType.data?.types ?? []).map((t, i) => (
                <div key={t.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: paletteColor(i) }} />{t.label}</span>
                  <b>{inr(t.amount)}</b>
                </div>
              ))}
              {!revByType.data?.types.length && <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </div>
        </WidgetCard>
      </div>

      {/* Signups line + Coupon performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WidgetCard title="New Signups" subtitle="Last 30 days">
          <div className="h-60"><SignupLine data={(signups.data?.points ?? []).map((p) => ({ label: p.label, count: p.count }))} /></div>
        </WidgetCard>

        <WidgetCard title="Coupon Performance" subtitle={coupons.data ? `${coupons.data.couponsUsedOrders} orders · ${inr(coupons.data.totalDiscountGiven)} given` : 'Loading…'}>
          <div className="space-y-2">
            {(coupons.data?.topCoupons ?? []).map((c) => (
              <div key={c.code} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="flex-1 text-sm font-mono font-semibold">{c.code}</span>
                <span className="text-xs text-muted-foreground">{c.timesUsed}×</span>
                <span className="text-sm font-semibold w-24 text-right">-{inr(c.discountGiven)}</span>
              </div>
            ))}
            {!coupons.data?.topCoupons.length && <p className="text-sm text-muted-foreground py-8 text-center">No coupons used yet</p>}
          </div>
        </WidgetCard>
      </div>

      {/* Sales heatmap (full width) + dead inventory */}
      <div className="grid lg:grid-cols-3 gap-6">
        <WidgetCard title="Sales Heatmap" subtitle="Orders by day & hour" className="lg:col-span-2">
          {heatmap.data ? <HeatmapGrid days={heatmap.data.days} /> : <p className="text-sm text-muted-foreground">Loading…</p>}
        </WidgetCard>

        <WidgetCard title="Dead Inventory" subtitle="Active products with no sales">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Boxes className="w-6 h-6" /></div>
            <div>
              <h3 className="text-2xl font-bold">{deadInv.data?.productsWithNoSales ?? 0}</h3>
              <p className="text-xs text-muted-foreground">of {deadInv.data?.totalActiveProducts ?? 0} active</p>
            </div>
          </div>
          <div className="space-y-1">
            {(deadInv.data?.sample ?? []).map((p) => (
              <div key={p.productId} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{p.name}</span>
              </div>
            ))}
            {!deadInv.data?.productsWithNoSales && <p className="text-sm text-green-600">All products have sales 🎉</p>}
          </div>
        </WidgetCard>
      </div>
    </div>
  );
}
