import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Plus, BarChart3, Loader2, 
  ArrowUpRight, ArrowDownRight, IndianRupee, X, ChevronRight,
  Calculator, PieChart, GitCompare, ArrowLeft, Briefcase,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formatNav = (val: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

interface Scheme {
  schemeCode: string;
  schemeName: string;
  amc: string;
  category: string;
  schemeType?: string;
  plan?: string;
  option?: string;
}

interface SchemeDetail extends Scheme {
  nav: number;
  navDate: string;
  previousNav: number;
  navChange: number;
  navChangePercent: number;
  returns1m: number | null;
  returns3m: number | null;
  returns6m: number | null;
  returns1y: number | null;
  returns3y: number | null;
  returns5y: number | null;
  returnsSinceInception: number | null;
  navHistory: { date: string; nav: number }[];
  benchmark?: string;
  fundManager?: string;
  launchDate?: string;
}

interface PortfolioHolding {
  _id: string;
  schemeCode: string;
  schemeName: string;
  category: string;
  amc: string;
  units: number;
  avgNav: number;
  investedAmount: number;
  purchaseDate: string;
  currentValue: number;
  currentNav: number;
  returns: number;
  returnsPercent: number;
}

const TABS = [
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'dashboard', label: 'Dashboard', icon: PieChart },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
];

const CATEGORIES = ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Index Fund', 'Debt', 'Hybrid'];

export default function MutualFunds() {
  const [activeTab, setActiveTab] = useState('discover');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<SchemeDetail | null>(null);
  const [schemeLoading, setSchemeLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSchemes = useCallback(async (query?: string, category?: string, pg = 1) => {
    setSchemesLoading(true);
    try {
      let url = `/mf/schemes?page=${pg}&limit=20`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      const data = await apiRequest(url);
      setSchemes(data.schemes || []);
      setTotalPages(data.totalPages || 1);
      setPage(pg);
    } catch (err) {
      console.error('Failed to fetch schemes:', err);
    } finally {
      setSchemesLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchSchemes(q, selectedCategory), 400);
  };

  const handleCategorySelect = (cat: string) => {
    const newCat = selectedCategory === cat ? '' : cat;
    setSelectedCategory(newCat);
    fetchSchemes(searchQuery, newCat);
  };

  const handleSchemeClick = async (scheme: Scheme) => {
    setSchemeLoading(true);
    setSelectedScheme(null);
    try {
      const data = await apiRequest(`/mf/scheme/${scheme.schemeCode}`);
      setSelectedScheme(data);
    } catch (err) {
      console.error('Failed to fetch scheme:', err);
    } finally {
      setSchemeLoading(false);
    }
  };

  if (selectedScheme) {
    return <SchemeDetailPage scheme={selectedScheme} onBack={() => setSelectedScheme(null)} loading={schemeLoading} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Mutual Funds
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Explore, invest, and track mutual funds</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return <TabsTrigger key={t.id} value={t.id} className="text-xs gap-1.5"><Icon className="h-3.5 w-3.5" />{t.label}</TabsTrigger>;
          })}
        </TabsList>

        <TabsContent value="discover">
          <DiscoverTab
            schemes={schemes}
            loading={schemesLoading}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onSchemeClick={handleSchemeClick}
            page={page}
            totalPages={totalPages}
            onPageChange={(p: number) => fetchSchemes(searchQuery, selectedCategory, p)}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <DashboardTab onSchemeClick={(code) => handleSchemeClick({ schemeCode: code, schemeName: '', amc: '', category: '' })} />
        </TabsContent>

        <TabsContent value="calculator">
          <CalculatorTab />
        </TabsContent>

        <TabsContent value="compare">
          <CompareTab onSchemeClick={handleSchemeClick} />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DiscoverTab({ schemes, loading, searchQuery, onSearch, selectedCategory, onCategorySelect, onSchemeClick, page, totalPages, onPageChange }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search by fund name, AMC, or scheme code..."
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onCategorySelect(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : schemes.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">No schemes found</CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {schemes.map((s: Scheme) => (
              <Card key={s.schemeCode} className="border-border/50 hover:shadow-md transition-all cursor-pointer" onClick={() => onSchemeClick(s)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(s.amc || 'M').charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.schemeName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{s.amc}</span>
                      {s.category && <Badge variant="outline" className="text-[8px] px-1 py-0">{s.category.split(' ').slice(0, 2).join(' ')}</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SchemeDetailPage({ scheme, onBack }: { scheme: SchemeDetail; onBack: () => void; loading: boolean }) {
  const [chartPeriod, setChartPeriod] = useState('1Y');
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sipUnits, setSipUnits] = useState('');
  const [sipNav, setSipNav] = useState(scheme.nav?.toString() || '');

  useEffect(() => { setSipNav(scheme.nav?.toString() || ''); }, [scheme.nav]);

  const renderReturn = (val: number | null, label: string) => {
    if (val === null) return <div className="text-center"><p className="text-[9px] text-muted-foreground">{label}</p><p className="text-xs font-bold text-muted-foreground">—</p></div>;
    const color = val >= 15 ? 'text-success' : val >= 8 ? 'text-primary' : val >= 0 ? 'text-muted-foreground' : 'text-destructive';
    return (
      <div className="text-center">
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className={`text-xs font-bold ${color}`}>{val > 0 ? '+' : ''}{val}%</p>
      </div>
    );
  };

  const getChartData = () => {
    if (!scheme.navHistory) return [];
    const periodMap: Record<string, number> = { '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '3Y': 756, '5Y': 1260, 'MAX': 99999 };
    const days = periodMap[chartPeriod] || 252;
    const data = scheme.navHistory.slice(0, days).reverse();
    return data.map(d => ({
      date: d.date,
      nav: d.nav,
      label: d.date,
    }));
  };

  const chartData = getChartData();
  const isPositive = (scheme.navChangePercent || 0) >= 0;

  const handleAddToPortfolio = async () => {
    if (!sipUnits || !sipNav) return;
    setAddingToPortfolio(true);
    try {
      await apiRequest('/mf/portfolio/add', {
        method: 'POST',
        body: JSON.stringify({
          schemeCode: scheme.schemeCode,
          schemeName: scheme.schemeName,
          category: scheme.category,
          amc: scheme.amc,
          units: parseFloat(sipUnits),
          nav: parseFloat(sipNav),
          purchaseDate: new Date().toISOString(),
        }),
      });
      setShowAddModal(false);
      setSipUnits('');
    } catch (err) {
      console.error('Failed to add:', err);
    } finally {
      setAddingToPortfolio(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to funds
      </button>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black">{scheme.schemeName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{scheme.amc}</Badge>
                {scheme.category && <Badge variant="outline" className="text-[10px]">{scheme.category}</Badge>}
                <span className="text-[10px] text-muted-foreground">Code: {scheme.schemeCode}</span>
              </div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowAddModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add to Portfolio
            </Button>
          </div>

          <div className="flex items-end gap-4 mt-4">
            <div>
              <p className="text-3xl font-black">₹{formatNav(scheme.nav)}</p>
              <p className="text-[10px] text-muted-foreground">NAV as of {scheme.navDate}</p>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {isPositive ? '+' : ''}{scheme.navChangePercent}% ({isPositive ? '+' : ''}₹{(scheme.navChange ?? 0).toFixed(2)})
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4">
            {renderReturn(scheme.returns1m, '1M')}
            {renderReturn(scheme.returns3m, '3M')}
            {renderReturn(scheme.returns6m, '6M')}
            {renderReturn(scheme.returns1y, '1Y')}
            {renderReturn(scheme.returns3y, '3Y')}
            {renderReturn(scheme.returns5y, '5Y')}
            {renderReturn(scheme.returnsSinceInception, 'Since Incep.')}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">NAV History</h3>
            <div className="flex gap-1">
              {['1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${chartPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="nav" stroke={isPositive ? '#22c55e' : '#ef4444'} fill="url(#navGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No chart data</div>
          )}
        </CardContent>
      </Card>

      {(scheme.fundManager || scheme.benchmark || scheme.launchDate) && (
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Fund Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scheme.fundManager && <div><p className="text-[9px] text-muted-foreground">Fund Manager</p><p className="text-xs font-bold">{scheme.fundManager}</p></div>}
            {scheme.benchmark && <div><p className="text-[9px] text-muted-foreground">Benchmark</p><p className="text-xs font-bold">{scheme.benchmark}</p></div>}
            {scheme.launchDate && <div><p className="text-[9px] text-muted-foreground">Launch Date</p><p className="text-xs font-bold">{scheme.launchDate}</p></div>}
            <div><p className="text-[9px] text-muted-foreground">Scheme Code</p><p className="text-xs font-bold">{scheme.schemeCode}</p></div>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-xl border shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Add to Portfolio</h3>
                <button onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{scheme.schemeName}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Units</label>
                  <input type="number" value={sipUnits} onChange={e => setSipUnits(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. 100" />
                </div>
                <div>
                  <label className="text-xs font-medium">Purchase NAV</label>
                  <input type="number" step="0.01" value={sipNav} onChange={e => setSipNav(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {sipUnits && sipNav && (
                  <div className="p-2 bg-muted/30 rounded-lg text-xs">
                    Invested: <span className="font-bold">{formatCurrency(parseFloat(sipUnits) * parseFloat(sipNav))}</span>
                  </div>
                )}
                <Button className="w-full" disabled={!sipUnits || !sipNav || addingToPortfolio} onClick={handleAddToPortfolio}>
                  {addingToPortfolio ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Holding'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardTab({ onSchemeClick: _onSchemeClick }: { onSchemeClick: (code: string) => void }) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dash, port] = await Promise.all([
          apiRequest('/mf/dashboard').catch(() => null),
          apiRequest('/mf/portfolio').catch(() => null),
        ]);
        setDashboard(dash);
        setPortfolio(port);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const holdings = portfolio?.holdings || [];
  const catAlloc = dashboard?.categoryAllocation || {};
  const pieData = Object.entries(catAlloc).map(([name, value]) => ({ name, value: value as number }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total Invested</p>
          <p className="text-lg font-black mt-1">{formatCurrency(dashboard?.totalInvested || 0)}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Current Value</p>
          <p className="text-lg font-black mt-1">{formatCurrency(dashboard?.currentValue || 0)}</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total Returns</p>
          <p className={`text-lg font-black mt-1 ${(dashboard?.totalReturns || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(dashboard?.totalReturns || 0)}
          </p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Returns %</p>
          <p className={`text-lg font-black mt-1 ${(dashboard?.totalReturnsPercent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
            {dashboard?.totalReturnsPercent || 0}%
          </p>
        </CardContent></Card>
      </div>

      {holdings.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No mutual funds in portfolio yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Search and add funds to start tracking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pieData.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Category Allocation</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePie>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </RePie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Holdings ({holdings.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {holdings.map((h: PortfolioHolding) => (
                <div key={h._id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{h.schemeName}</p>
                    <p className="text-[9px] text-muted-foreground">{h.units} units @ ₹{h.avgNav}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold">{formatCurrency(h.currentValue)}</p>
                    <p className={`text-[9px] font-bold ${h.returnsPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {h.returnsPercent >= 0 ? '+' : ''}{h.returnsPercent}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CalculatorTab() {
  const [calcType, setCalcType] = useState<'sip' | 'lumpsum'>('sip');
  const [monthlyAmount, setMonthlyAmount] = useState('5000');
  const [lumpsumAmount, setLumpsumAmount] = useState('100000');
  const [annualReturn, setAnnualReturn] = useState('12');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    try {
      const endpoint = calcType === 'sip' ? '/mf/sip/calculate' : '/mf/lumpsum/calculate';
      const body = calcType === 'sip'
        ? { monthlyAmount: parseFloat(monthlyAmount), annualReturn: parseFloat(annualReturn), years: parseFloat(years) }
        : { amount: parseFloat(lumpsumAmount), annualReturn: parseFloat(annualReturn), years: parseFloat(years) };
      const data = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => { calculate(); }, [calcType]);

  const chartData = result?.monthWise || result?.yearWise || [];
  const maxPoints = calcType === 'sip'
    ? chartData.filter((_: any, i: number) => i % Math.max(1, Math.floor(chartData.length / 60)) === 0)
    : chartData;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={calcType === 'sip' ? 'default' : 'outline'} size="sm" onClick={() => setCalcType('sip')}>SIP Calculator</Button>
        <Button variant={calcType === 'lumpsum' ? 'default' : 'outline'} size="sm" onClick={() => setCalcType('lumpsum')}>Lumpsum Calculator</Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          {calcType === 'sip' ? (
            <div>
              <label className="text-xs font-medium">Monthly SIP Amount</label>
              <div className="relative mt-1">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium">Investment Amount</label>
              <div className="relative mt-1">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="number" value={lumpsumAmount} onChange={e => setLumpsumAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Expected Annual Return (%)</label>
              <input type="number" value={annualReturn} onChange={e => setAnnualReturn(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium">Duration (Years)</label>
              <input type="number" value={years} onChange={e => setYears(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <Button onClick={calculate} disabled={calculating} className="w-full">
            {calculating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
            Calculate
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/50"><CardContent className="p-3 text-center">
              <p className="text-[9px] text-muted-foreground">Invested</p>
              <p className="text-sm font-black mt-1">{formatCurrency(calcType === 'sip' ? result.totalInvested : result.investedAmount)}</p>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-3 text-center">
              <p className="text-[9px] text-muted-foreground">Wealth</p>
              <p className="text-sm font-black mt-1 text-success">{formatCurrency(calcType === 'sip' ? result.totalValue : result.futureValue)}</p>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-3 text-center">
              <p className="text-[9px] text-muted-foreground">Returns</p>
              <p className="text-sm font-black mt-1 text-primary">{formatCurrency(calcType === 'sip' ? result.wealthGain : result.profit)}</p>
            </CardContent></Card>
          </div>

          {maxPoints.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3">Growth Projection</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={maxPoints}>
                      <defs>
                        <linearGradient id="calcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey={calcType === 'sip' ? 'month' : 'year'} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} formatter={(v: any) => [formatCurrency(v), '']} />
                      <Area type="monotone" dataKey="invested" stroke="#3b82f6" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="value" stroke="#22c55e" fill="url(#calcGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function CompareTab({ onSchemeClick: _onSchemeClick }: { onSchemeClick: (s: Scheme) => void }) {
  const [results, setResults] = useState<SchemeDetail[]>([]);
  const [comparing, setComparing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Scheme[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiRequest(`/mf/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data || []);
      } catch { setSearchResults([]); }
  }, 400);
  };

  const addCode = (code: string, _name: string) => {
    if (selectedCodes.length >= 4 || selectedCodes.includes(code)) return;
    setSelectedCodes(prev => [...prev, code]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeCode = (code: string) => setSelectedCodes(prev => prev.filter(c => c !== code));

  const doCompare = async () => {
    if (selectedCodes.length < 2) return;
    setComparing(true);
    try {
      const data = await apiRequest(`/mf/compare?codes=${selectedCodes.join(',')}`);
      setResults(data || []);
    } catch (err) { console.error(err); }
    finally { setComparing(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
              placeholder="Search funds to compare (add up to 4)..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {searchResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.slice(0, 10).map(s => (
                  <button key={s.schemeCode} onClick={() => addCode(s.schemeCode, s.schemeName)}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-xs flex items-center justify-between">
                    <span className="truncate">{s.schemeName}</span>
                    <Badge variant="outline" className="text-[8px] shrink-0">{s.amc}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedCodes.map(code => (
                <Badge key={code} variant="outline" className="text-[10px] gap-1 pr-1">
                  {code}
                  <button onClick={() => removeCode(code)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}

          <Button onClick={doCompare} disabled={selectedCodes.length < 2 || comparing} className="w-full">
            {comparing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitCompare className="h-4 w-4 mr-2" />}
            Compare ({selectedCodes.length} funds)
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-border/50 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">Metric</th>
                {results.map(r => (
                  <th key={r.schemeCode} className="text-left p-3 font-medium max-w-45">
                    <p className="truncate">{r.schemeName}</p>
                    <p className="text-[9px] text-muted-foreground font-normal">{r.amc}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'NAV', fn: (r: SchemeDetail) => `₹${formatNav(r.nav)}` },
                { label: '1M', fn: (r: SchemeDetail) => r.returns1m != null ? `${r.returns1m}%` : '—' },
                { label: '3M', fn: (r: SchemeDetail) => r.returns3m != null ? `${r.returns3m}%` : '—' },
                { label: '6M', fn: (r: SchemeDetail) => r.returns6m != null ? `${r.returns6m}%` : '—' },
                { label: '1Y', fn: (r: SchemeDetail) => r.returns1y != null ? `${r.returns1y}%` : '—' },
                { label: '3Y', fn: (r: SchemeDetail) => r.returns3y != null ? `${r.returns3y}%` : '—' },
                { label: '5Y', fn: (r: SchemeDetail) => r.returns5y != null ? `${r.returns5y}%` : '—' },
                { label: 'Category', fn: (r: SchemeDetail) => r.category || '—' },
                { label: 'Fund Manager', fn: (r: SchemeDetail) => r.fundManager || '—' },
              ].map(row => (
                <tr key={row.label} className="border-b border-border/30">
                  <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                  {results.map(r => <td key={r.schemeCode} className="p-3">{row.fn(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PortfolioTab() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Scheme[]>([]);
  const [selectedFund, setSelectedFund] = useState<Scheme | null>(null);
  const [units, setUnits] = useState('');
  const [nav, setNav] = useState('');
  const [adding, setAdding] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPortfolio = async () => {
    try {
      const data = await apiRequest('/mf/portfolio');
      setPortfolio(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPortfolio(); }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await apiRequest(`/mf/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data || []);
      } catch { setSearchResults([]); }
    }, 400);
  };

  const handleAdd = async () => {
    if (!selectedFund || !units || !nav) return;
    setAdding(true);
    try {
      const data = await apiRequest('/mf/portfolio/add', {
        method: 'POST',
        body: JSON.stringify({
          schemeCode: selectedFund.schemeCode,
          schemeName: selectedFund.schemeName,
          category: selectedFund.category,
          amc: selectedFund.amc,
          units: parseFloat(units),
          nav: parseFloat(nav),
          purchaseDate: new Date().toISOString(),
        }),
      });
      setPortfolio(data);
      setShowAddModal(false);
      setSelectedFund(null);
      setUnits('');
      setNav('');
    } catch (err) { console.error(err); }
    finally { setAdding(false); }
  };

  const handleRemove = async (holdingId: string) => {
    try {
      const data = await apiRequest(`/mf/portfolio/remove/${holdingId}`, { method: 'DELETE' });
      setPortfolio(data);
    } catch (err) { console.error(err); }
  };

  const holdings = portfolio?.holdings || [];
  const totalInvested = holdings.reduce((s: number, h: PortfolioHolding) => s + h.investedAmount, 0);
  const totalCurrent = holdings.reduce((s: number, h: PortfolioHolding) => s + h.currentValue, 0);
  const totalReturns = totalCurrent - totalInvested;

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">My Portfolio ({holdings.length} funds)</h3>
        <Button size="sm" className="gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Fund
        </Button>
      </div>

      {holdings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50"><CardContent className="p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Invested</p>
            <p className="text-sm font-black mt-1">{formatCurrency(totalInvested)}</p>
          </CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Current</p>
            <p className="text-sm font-black mt-1">{formatCurrency(totalCurrent)}</p>
          </CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Returns</p>
            <p className={`text-sm font-black mt-1 ${totalReturns >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(totalReturns)}</p>
          </CardContent></Card>
        </div>
      )}

      {holdings.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No holdings yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Fund" to start your portfolio</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {holdings.map((h: PortfolioHolding) => (
            <Card key={h._id} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{h.schemeName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{h.units} units</span>
                      <span>Avg: ₹{h.avgNav}</span>
                      <span>Invested: {formatCurrency(h.investedAmount)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold">{formatCurrency(h.currentValue)}</p>
                    <p className={`text-[10px] font-bold ${h.returnsPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {h.returnsPercent >= 0 ? '+' : ''}{h.returnsPercent}%
                    </p>
                    <button onClick={() => handleRemove(h._id)} className="text-[9px] text-destructive/60 hover:text-destructive mt-1">Remove</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card rounded-xl border shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Add Mutual Fund</h3>
                <button onClick={() => setShowAddModal(false)}><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
                    placeholder="Search fund..."
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.slice(0, 8).map(s => (
                        <button key={s.schemeCode} onClick={() => { setSelectedFund(s); setSearchQuery(s.schemeName); setSearchResults([]); }}
                          className="w-full text-left px-3 py-2 hover:bg-accent text-xs">
                          <p className="font-semibold truncate">{s.schemeName}</p>
                          <p className="text-muted-foreground">{s.amc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedFund && (
                  <div className="p-2 bg-muted/30 rounded-lg text-xs">
                    <p className="font-semibold">{selectedFund.schemeName}</p>
                    <p className="text-muted-foreground">{selectedFund.amc} • {selectedFund.schemeCode}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Units</label>
                    <input type="number" value={units} onChange={e => setUnits(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Purchase NAV</label>
                    <input type="number" step="0.01" value={nav} onChange={e => setNav(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="45.23" />
                  </div>
                </div>

                {units && nav && (
                  <div className="p-2 bg-primary/5 rounded-lg text-xs text-primary">
                    Total Investment: <span className="font-bold">{formatCurrency(parseFloat(units) * parseFloat(nav))}</span>
                  </div>
                )}

                <Button className="w-full" disabled={!selectedFund || !units || !nav || adding} onClick={handleAdd}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add to Portfolio
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
