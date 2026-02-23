'use client';

import AnalyticsChatbot from '@/components/AnalyticsChatbot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Brain,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Flame,
  LayoutList,
  Package,
  Percent,
  Printer,
  Rows,
  ShoppingCart,
  Skull,
  Star,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';

interface AnalysisResult {
  $id: string;
  stockFileName: string;
  salesFileName: string;
  deadStockFileName?: string;
  uploadedBy: string;
  status: 'processing' | 'completed' | 'failed';
  analyzedAt: string;
  processedFileId?: string;
  error?: string;
}

interface AnalysisData {
  metadata: any;
  salesOverview: any;
  categoryPerformance: any;
  dailyTrends: any;
  paymentMethods: any;
  hourlyPatterns: any;
  stockMargins: any;
  customerLoyalty: any;
  genderDemographics: any;
  deadStockAnalysis?: any;
  salePlace: any;
  weekdayPerformance: any;
  categoryGender: any;
  movers?: any;
  advancedMovers?: any;
  forecasting?: any;
  bcgMatrix?: any;
  inventoryIntelligence?: any;
  anomalyDetection?: any;
  pricePerformance?: any;
  seasonalityHeatmap?: any;
  intelligenceSummary?: any;
}

const COLORS = [
  '#CC2224',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#5B9BD5',
  '#EC7063',
];
const GENDER_COLORS = { Male: '#66B2FF', Female: '#FF99CC', Unknown: '#CCCCCC' };
const LOYALTY_COLORS = { Repeat: '#00C49F', OneTime: '#FF8042' };

function ZoomableChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer h-full w-full">{children}</div>
      </DialogTrigger>
      <DialogContent className="min-w-[90vw] h-[95vh] flex flex-col z-[9999] p-2">
        <DialogHeader className="p-2 pb-0">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full h-full min-h-0 relative">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export default function DetailedReportView({
  data: rawData,
  analysis,
  showFullScreenLink = true,
}: {
  data: AnalysisData | null;
  analysis: AnalysisResult;
  showFullScreenLink?: boolean;
}) {
  // ── Hard null guard — rawData can be null if analysis failed or is still processing ──
  if (!rawData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div>
          <p className="text-lg font-bold">Report data not available</p>
          <p className="text-sm text-muted-foreground mt-1">
            {analysis.status === 'processing'
              ? 'Analysis is still processing — refresh in a few moments.'
              : analysis.error
                ? `Analysis failed: ${analysis.error}`
                : 'No data was returned for this report. Try re-running the analysis.'}
          </p>
        </div>
      </div>
    );
  }

  // Ensure all critical data points exist to prevent crashes on legacy reports
  const data = {
    ...rawData,
    stockMargins: rawData.stockMargins || {
      categoryMargins: [],
      overall: { totalProfit: 0, marginPercentage: 0 },
    },
    hourlyPatterns: rawData.hourlyPatterns || { hourlyData: [], peakHour: {} },
    customerLoyalty:
      rawData.customerLoyalty && rawData.customerLoyalty.summary
        ? rawData.customerLoyalty
        : {
          summary: {
            repeat: {
              customers: 0,
              transactions: 0,
              total_revenue: 0,
              aov: 0,
              revenue_per_customer: 0,
            },
            oneTime: {
              customers: 0,
              transactions: 0,
              total_revenue: 0,
              aov: 0,
              revenue_per_customer: 0,
            },
          },
          metrics: { repeatRevenueShare: 0 },
          dataQuality: { uniqueCustomers: 0, withInfo: 0, totalTransactions: 0 },
        },
  };

  const [viewMode, setViewMode] = useState<'tabs' | 'full'>('tabs');

  const formatCurrency = (val: any) =>
    val ? `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0';

  const handlePrint = () => {
    // If in tabs mode, suggest switching? No, just print current view.
    // User is expected to switch to Full View for full report printing.
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `analysis_report_${analysis.$id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Customer Loyalty Table Data Helper
  const getLoyaltyTableData = () => {
    const repeat = data.customerLoyalty.summary.repeat;
    const oneTime = data.customerLoyalty.summary.oneTime;
    return [
      {
        metric: 'Customers',
        repeat: repeat.customers,
        oneTime: oneTime.customers,
        diff: repeat.customers - oneTime.customers,
      },
      {
        metric: 'Transactions',
        repeat: repeat.transactions,
        oneTime: oneTime.transactions,
        diff: repeat.transactions - oneTime.transactions,
      },
      {
        metric: 'Total Revenue',
        repeat: formatCurrency(repeat.total_revenue),
        oneTime: formatCurrency(oneTime.total_revenue),
        diff: formatCurrency(repeat.total_revenue - oneTime.total_revenue),
      },
      {
        metric: 'Avg Order Value',
        repeat: formatCurrency(repeat.aov),
        oneTime: formatCurrency(oneTime.aov),
        diff: formatCurrency(repeat.aov - oneTime.aov),
      },
      {
        metric: 'Revenue/Customer',
        repeat: formatCurrency(repeat.revenue_per_customer),
        oneTime: formatCurrency(oneTime.revenue_per_customer),
        diff: formatCurrency(repeat.revenue_per_customer - oneTime.revenue_per_customer),
      },
    ];
  };

  // Dead Stock Recommendations Helper
  const getDeadStockRecommendations = () => {
    if (!data.deadStockAnalysis) return [];
    return [...data.deadStockAnalysis.categoryHealth]
      .sort((a: any, b: any) => b.dead_pct - a.dead_pct)
      .slice(0, 3)
      .map((cat: any) => ({
        category: cat.category,
        pct: cat.dead_pct,
        skus: cat.dead_skus,
        total: cat.total_skus,
        action:
          cat.dead_pct === 100
            ? 'Immediate clearance required'
            : cat.dead_pct >= 80
              ? 'Urgent intervention needed'
              : 'Pricing review essential',
      }));
  };

  if (analysis.status === 'failed') {
    return (
      <div
        className="p-8 border-2 border-red-200 bg-red-50 rounded-lg text-center space-y-4"
        id="report-view"
      >
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-red-700">Analysis Failed</h2>
        <div className="bg-white p-4 rounded border font-mono text-xs text-left overflow-auto max-h-[300px]">
          {analysis.error || 'Unknown error occurred. Please check backend logs.'}
        </div>
        <p className="text-red-600">Please verify your file format and try again.</p>
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-10 text-center text-muted-foreground">No data available to display.</div>
    );

  const loyaltyData = getLoyaltyTableData();
  const deadStockRecs = getDeadStockRecommendations();

  // -- SECTIONS RENDERERS --

  const renderOverview = () => (
    <div className="space-y-6 pt-4 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>
              Daily Revenue & Orders Trend (Sales Period: {data.metadata.salesPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ZoomableChart title="Daily Revenue & Orders Trend">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.dailyTrends.dailyData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CC2224" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#CC2224" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis yAxisId="left" orientation="left" stroke="#CC2224" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    formatter={(val: any, name: any) =>
                      name === 'Revenue' ? formatCurrency(val) : val
                    }
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#CC2224"
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#82ca9d"
                    dot={false}
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </CardContent>
        </Card>
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Weekday Performance</CardTitle>
            <CardDescription>
              Best Day:{' '}
              <span className="font-bold text-[#CC2224]">
                {data.weekdayPerformance?.bestDay?.weekday}
              </span>{' '}
              ({formatCurrency(data.weekdayPerformance?.bestDay?.revenue)})
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ZoomableChart title="Weekday Performance">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekdayPerformance?.weekdayStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="weekday" fontSize={10} /> <YAxis />{' '}
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Bar dataKey="revenue" fill="#5B9BD5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </CardContent>
        </Card>
      </div>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Hourly Traffic & Revenue Pattern</CardTitle>
          <CardDescription>
            Peak Hour: {data.hourlyPatterns.peakHour?.hour}:00 with{' '}
            {data.hourlyPatterns.peakHour?.transactions} orders
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ZoomableChart title="Hourly Traffic & Revenue Pattern">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.hourlyPatterns.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} fontSize={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  labelFormatter={(h) => `${h}:00`}
                  formatter={(val: any, name: any) =>
                    name === 'revenue' ? formatCurrency(val) : val
                  }
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill="#8884d8"
                  stroke="#8884d8"
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="transactions"
                  stroke="#82ca9d"
                  name="Transactions"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Sale Place Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ZoomableChart title="Sale Place Analysis">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.salePlace?.places}
                    dataKey="totalAmount"
                    nameKey="sale_place"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {data.salePlace?.places.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </CardContent>
        </Card>
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ZoomableChart title="Payment Methods">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.paymentMethods.paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />{' '}
                  <YAxis type="category" dataKey="paymentMethod" width={100} fontSize={10} />{' '}
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Bar dataKey="totalAmount" fill="#00C49F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6 pt-4 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {data.customerLoyalty.dataQuality.uniqueCustomers}
            </div>
            <div className="text-xs uppercase text-muted-foreground">
              Unique Identifiable Customers
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(
                (data.customerLoyalty.dataQuality.withInfo /
                  data.customerLoyalty.dataQuality.totalTransactions) *
                100
              ).toFixed(1)}
              %
            </div>
            <div className="text-xs uppercase text-muted-foreground">Data Capture Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {data.customerLoyalty.metrics.repeatRevenueShare.toFixed(1)}%
            </div>
            <div className="text-xs uppercase text-muted-foreground">
              Revenue from Repeat Buyers
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Loyalty Table */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Customer Lifecycle Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-right py-2">Repeat Customers</th>
                  <th className="text-right py-2">One-time Customers</th>
                  <th className="text-right py-2">Difference</th>
                </tr>
              </thead>
              <tbody>
                {loyaltyData.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{row.metric}</td>
                    <td className="text-right py-2">{row.repeat}</td>
                    <td className="text-right py-2">{row.oneTime}</td>
                    <td className="text-right py-2 font-bold text-muted-foreground">{row.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Loyalty Breakdown</CardTitle>
            <CardDescription>Repeat vs One-time Customers</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ZoomableChart title="Loyalty Breakdown">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Repeat', value: data.customerLoyalty.summary.repeat.customers },
                      { name: 'One-time', value: data.customerLoyalty.summary.oneTime.customers },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={5}
                  >
                    <Cell fill={LOYALTY_COLORS.Repeat} /> <Cell fill={LOYALTY_COLORS.OneTime} />
                  </Pie>
                  <Tooltip /> <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ZoomableChart>
            <div className="text-center text-sm mt-2">
              Repeat Customers spend{' '}
              <span className="font-bold text-green-600">
                {formatCurrency(data.customerLoyalty.summary.repeat.revenue_per_customer)}
              </span>{' '}
              vs {formatCurrency(data.customerLoyalty.summary.oneTime.revenue_per_customer)}
            </div>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Gender per Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ZoomableChart title="Gender per Category">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryGender?.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="category"
                    fontSize={10}
                    angle={-20}
                    textAnchor="end"
                  /> <YAxis /> <Tooltip /> <Legend />
                  <Bar dataKey="Male" stackId="a" fill={GENDER_COLORS.Male} />
                  <Bar dataKey="Female" stackId="a" fill={GENDER_COLORS.Female} />
                  <Bar dataKey="Unknown" stackId="a" fill={GENDER_COLORS.Unknown} />
                </BarChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6 pt-4 animate-in fade-in">
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Category Sales Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ZoomableChart title="Category Sales Performance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryPerformance.categories}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="category"
                  height={60}
                  fontSize={10}
                  angle={-30}
                  textAnchor="end"
                />{' '}
                <YAxis /> <Tooltip formatter={(val: any) => formatCurrency(val)} />
                <Bar dataKey="totalAmount" fill="#CC2224" radius={[4, 4, 0, 0]}>
                  {data.categoryPerformance.categories.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </CardContent>
      </Card>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Category Profit Margins (Stock Based)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ZoomableChart title="Category Profit Margins">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockMargins.categoryMargins}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="category"
                  height={60}
                  fontSize={10}
                  angle={-30}
                  textAnchor="end"
                />{' '}
                <YAxis unit="%" />
                <Tooltip formatter={(val: any) => `${Number(val).toFixed(1)}%`} />
                <Bar
                  dataKey="profit_margin_pct"
                  name="Margin %"
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                >
                  {data.stockMargins.categoryMargins.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.profit_margin_pct > 50
                          ? '#27AE60'
                          : entry.profit_margin_pct > 30
                            ? '#F1C40F'
                            : '#E74C3C'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </CardContent>
      </Card>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Revenue vs Orders (Bubble Size = AOV)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ZoomableChart title="Revenue vs Orders vs AOV">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" dataKey="orders" name="Orders" />
                <YAxis type="number" dataKey="totalAmount" name="Revenue" unit="₹" />
                <ZAxis type="number" dataKey="aov" range={[100, 1000]} name="AOV" unit="₹" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: any) => [
                    name === 'Revenue' || name === 'AOV' ? formatCurrency(value) : value,
                    name,
                  ] as [string, string]}
                />
                <Legend />
                {data.categoryPerformance.categories.map((entry: any, index: number) => (
                  <Scatter
                    key={index}
                    name={entry.category}
                    data={[entry]}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </ZoomableChart>
        </CardContent>
      </Card>
    </div>
  );

  const renderDeadStock = () => (
    <div className="space-y-6 pt-4 animate-in fade-in">
      {data.deadStockAnalysis && (
        <>
          <div className="flex gap-4 items-center mb-4 p-4 bg-red-50 border border-red-200 rounded-lg print:break-inside-avoid">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-xl font-bold text-red-800">
                {data.deadStockAnalysis.overall.deadPct.toFixed(1)}% Dead Inventory
              </h3>
              <p className="text-sm text-red-700">
                {data.deadStockAnalysis.overall.deadSkus} dead SKUs out of{' '}
                {data.deadStockAnalysis.overall.totalSkus} total. Values locked in non-moving stock.
              </p>
            </div>
          </div>

          <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 print:break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-amber-800 dark:text-amber-500">
                Actionable Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadStockRecs.map((cat: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border-b border-amber-200 dark:border-amber-800 last:border-0 pb-2 last:pb-0"
                  >
                    <div>
                      <span className="font-bold">{cat.category}</span>
                      <span className="text-xs ml-2 text-muted-foreground">({cat.pct}% Dead)</span>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase px-2 py-1 rounded ${cat.pct === 100 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}
                    >
                      {cat.action}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle>Inventory Health</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ZoomableChart title="Inventory Health">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: data.deadStockAnalysis.overall.activeSkus },
                          { name: 'Dead Stock', value: data.deadStockAnalysis.overall.deadSkus },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        <Cell fill="#27AE60" /> <Cell fill="#E74C3C" />
                      </Pie>
                      <Tooltip /> <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ZoomableChart>
              </CardContent>
            </Card>

            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle>Dead Stock vs Total SKUs by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ZoomableChart title="Dead Stock vs Total SKUs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...data.deadStockAnalysis.categoryHealth]
                        .sort((a: any, b: any) => b.total_skus - a.total_skus)
                        .slice(0, 8)}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="category" fontSize={10} angle={-20} textAnchor="end" />{' '}
                      <YAxis /> <Tooltip /> <Legend />
                      <Bar dataKey="total_skus" name="Total SKUs" fill="#5DADE2" />
                      <Bar dataKey="dead_skus" name="Dead SKUs" fill="#EC7063" />
                    </BarChart>
                  </ResponsiveContainer>
                </ZoomableChart>
              </CardContent>
            </Card>
          </div>

          <Card className="print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Critical Categories (Highest % Dead Stock)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ZoomableChart title="Critical Categories (Highest % Dead Stock)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...data.deadStockAnalysis.categoryHealth]
                      .sort((a: any, b: any) => b.dead_pct - a.dead_pct)
                      .slice(0, 10)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" unit="%" domain={[0, 100]} />{' '}
                    <YAxis type="category" dataKey="category" width={100} fontSize={10} />{' '}
                    <Tooltip formatter={(val: any) => `${val}%`} />
                    <Bar dataKey="dead_pct" name="% Dead Stock" radius={[0, 4, 4, 0]}>
                      {data.deadStockAnalysis.categoryHealth.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.dead_pct > 80
                              ? '#C0392B'
                              : entry.dead_pct > 50
                                ? '#E67E22'
                                : '#F1C40F'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ZoomableChart>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderMovers = () => {
    const movers = (data as any).movers;
    if (!movers) {
      return (
        <div className="pt-4 text-center text-muted-foreground">
          No movers data available. Re-run the analysis to generate this section.
        </div>
      );
    }

    const topMovers: any[] = movers.topMovers || [];
    const zeroMovers = movers.zeroMovers || { byCategory: [], items: [], totalZeroSkus: 0 };
    const totalRevenue: number = movers.totalRevenue || 0;

    const MOVER_COLORS = [
      '#CC2224', '#ff6b6b', '#FFBB28', '#00C49F', '#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B',
    ];

    return (
      <div className="space-y-8 pt-4 animate-in fade-in">
        {/* Top Movers Header */}
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Top Movers by Category</h3>
            <p className="text-xs text-muted-foreground">Categories ranked by revenue contribution relative to total sales</p>
          </div>
        </div>

        {/* Top Movers Table */}
        <Card className="print:break-inside-avoid">
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="text-left py-3 pl-1">#</th>
                  <th className="text-left py-3">Category</th>
                  <th className="text-right py-3">Revenue</th>
                  <th className="text-right py-3">% of Total</th>
                  <th className="text-right py-3">Qty Sold</th>
                  <th className="text-right py-3">Orders</th>
                  <th className="text-right py-3">AOV</th>
                  <th className="text-center py-3">Peak Hour</th>
                  <th className="text-center py-3">Best Day</th>
                </tr>
              </thead>
              <tbody>
                {topMovers.map((row, i) => {
                  const share = Number(row.revenueShare);
                  const isTop = i < 3;
                  const shiftLabel =
                    row.peakHour >= 0
                      ? row.peakHour < 12 ? 'Morning'
                        : row.peakHour < 17 ? 'Afternoon'
                          : 'Evening'
                      : '–';
                  return (
                    <tr
                      key={i}
                      className={`border-b last:border-0 transition-colors ${isTop
                        ? 'bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        : 'hover:bg-muted/40'
                        }`}
                    >
                      <td className="py-3 pl-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${i === 0 ? 'bg-amber-400 text-white'
                            : i === 1 ? 'bg-zinc-400 text-white'
                              : i === 2 ? 'bg-amber-700 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: MOVER_COLORS[i % MOVER_COLORS.length] }}
                          />
                          {row.category}
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#CC2224] opacity-80"
                            style={{ width: `${Math.min(share * 2, 80)}px` }}
                          />
                          <span className={`font-bold tabular-nums ${share >= 30 ? 'text-[#CC2224]'
                            : share >= 15 ? 'text-amber-600'
                              : 'text-muted-foreground'
                            }`}>{share.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{Number(row.quantity).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-muted-foreground">{Number(row.orders).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right">{formatCurrency(row.aov)}</td>
                      <td className="py-3 text-center">
                        {row.peakHour >= 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            {row.peakHour}:00 ({shiftLabel})
                          </span>
                        ) : '–'}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                          {row.peakWeekday ?? '–'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/30">
                  <td colSpan={2} className="py-3 pl-8 font-black text-xs uppercase tracking-wider">Total</td>
                  <td className="py-3 text-right font-black">{formatCurrency(totalRevenue)}</td>
                  <td className="py-3 text-right font-black text-[#CC2224]">100%</td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* Top Movers Bar Chart */}
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Revenue Share by Category</CardTitle>
            <CardDescription>Visual breakdown of each category's contribution to total sales</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ZoomableChart title="Revenue Share by Category">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMovers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, Math.max(...topMovers.map((m) => m.revenueShare), 10)]} />
                  <YAxis type="category" dataKey="category" width={110} fontSize={11} />
                  <Tooltip
                    formatter={(val: any, name: any) =>
                      name === 'revenueShare' ? [`${Number(val).toFixed(1)}%`, '% of Total Sales']
                        : [formatCurrency(val), 'Revenue']
                    }
                  />
                  <Bar dataKey="revenueShare" name="% of Total Sales" radius={[0, 6, 6, 0]}>
                    {topMovers.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={MOVER_COLORS[index % MOVER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ZoomableChart>
          </CardContent>
        </Card>

        {/* Zero Movers Section */}
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Zero Movers</h3>
            <p className="text-xs text-muted-foreground">
              Stock items with <strong>zero sales</strong> during the analysis period — capital locked in non-moving inventory
            </p>
          </div>
          {zeroMovers.totalZeroSkus > 0 && (
            <span className="ml-auto inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold text-sm px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5" />
              {zeroMovers.totalZeroSkus} unsold SKUs
            </span>
          )}
        </div>

        {zeroMovers.totalZeroSkus === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-60" />
            <p className="font-semibold">All stocked SKUs moved at least once — great inventory velocity! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zero Movers by Category */}
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-500" /> By Category
                </CardTitle>
                <CardDescription>Number of unsold SKUs per category (stocked but never sold)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ZoomableChart title="Zero Movers by Category">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zeroMovers.byCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="category" width={110} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="zeroSkus" name="Unsold SKUs" radius={[0, 6, 6, 0]}>
                        {zeroMovers.byCategory.map((_: any, idx: number) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={idx === 0 ? '#C0392B' : idx <= 2 ? '#E67E22' : '#F1C40F'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ZoomableChart>
              </CardContent>
            </Card>

            {/* Zero Movers Category Table */}
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-red-500" /> Category Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[300px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Unsold SKUs</th>
                      {zeroMovers.byCategory[0]?.stockedQty !== undefined && (
                        <th className="text-right py-2">Stocked Qty</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {zeroMovers.byCategory.map((cat: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 font-medium">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ background: i === 0 ? '#C0392B' : i <= 2 ? '#E67E22' : '#F1C40F' }}
                          />
                          {cat.category}
                        </td>
                        <td className="py-2 text-right font-bold text-red-600">{cat.zeroSkus}</td>
                        {cat.stockedQty !== undefined && (
                          <td className="py-2 text-right text-muted-foreground">{Number(cat.stockedQty).toLocaleString('en-IN')}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Individual Item Table */}
            {zeroMovers.items && zeroMovers.items.length > 0 && (
              <Card className="md:col-span-2 print:break-inside-avoid">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-red-500" /> Top Unsold Items (by stocked quantity)
                  </CardTitle>
                  <CardDescription>Individual SKUs in stock that recorded zero sales. Consider discounting or redistributing.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-muted-foreground">
                        <th className="text-left py-2">SKU Code</th>
                        {zeroMovers.items[0]?.name !== undefined && <th className="text-left py-2">Name</th>}
                        <th className="text-left py-2">Category</th>
                        {zeroMovers.items[0]?.quantity !== undefined && <th className="text-right py-2">Qty in Stock</th>}
                        {zeroMovers.items[0]?.salePrice !== undefined && <th className="text-right py-2">Sale Price</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {zeroMovers.items.map((item: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="py-2 font-mono text-xs text-muted-foreground">{item.code}</td>
                          {item.name !== undefined && <td className="py-2 max-w-[200px] truncate">{item.name}</td>}
                          <td className="py-2">
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.category}</span>
                          </td>
                          {item.quantity !== undefined && (
                            <td className="py-2 text-right font-bold text-red-600">{Number(item.quantity).toLocaleString('en-IN')}</td>
                          )}
                          {item.salePrice !== undefined && (
                            <td className="py-2 text-right">{formatCurrency(item.salePrice)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── ML Intelligence Tab ────────────────────────────────────────────────────
  const renderIntelligence = () => {
    const summary = (data as any).intelligenceSummary;
    const forecast = (data as any).forecasting;
    const bcg = (data as any).bcgMatrix;
    const advMovers = (data as any).advancedMovers;
    const invIq = (data as any).inventoryIntelligence;
    const anomalies = (data as any).anomalyDetection;
    const pricePerf = (data as any).pricePerformance;
    const moduleErrors = (data as any).metadata?.moduleErrors ?? {};
    const errorCount = Object.keys(moduleErrors).length;

    // Helper: treat a module result as absent if the backend returned an error stub
    const ok = (val: any) => val && !val._error;

    const hasData = ok(summary) || ok(forecast) || ok(bcg) || ok(advMovers);
    if (!hasData && errorCount === 0) {
      return (
        <div className="pt-8 text-center text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Advanced Intelligence not available.</p>
          <p className="text-xs mt-1">Re-run the analysis with the latest engine to generate ML insights.</p>
        </div>
      );
    }

    const BCG_COLORS: Record<string, string> = {
      STAR: '#F59E0B',
      CASH_COW: '#10B981',
      QUESTION_MARK: '#8B5CF6',
      DOG: '#EF4444',
    };
    const BCG_ICONS: Record<string, any> = {
      STAR: <Star className="w-3 h-3" />,
      CASH_COW: <DollarSign className="w-3 h-3" />,
      QUESTION_MARK: <Zap className="w-3 h-3" />,
      DOG: <TrendingDown className="w-3 h-3" />,
    };
    const URGENCY_COLORS: Record<string, string> = {
      CRITICAL: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
      HIGH: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
      MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
      STAGNANT: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
      OK: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    };
    const SIGNAL_COLORS: Record<string, string> = {
      WARNING: 'border-l-orange-500 bg-orange-50/60 dark:bg-orange-950/20',
      OPPORTUNITY: 'border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/20',
      POSITIVE: 'border-l-green-500 bg-green-50/60 dark:bg-green-950/20',
      INFO: 'border-l-zinc-400 bg-muted/30',
      ERROR: 'border-l-red-500 bg-red-50/60',
    };
    const SIGNAL_ICONS: Record<string, any> = {
      WARNING: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      OPPORTUNITY: <Zap className="w-4 h-4 text-blue-500" />,
      POSITIVE: <TrendingUp className="w-4 h-4 text-green-500" />,
      INFO: <Circle className="w-4 h-4 text-zinc-400" />,
      ERROR: <AlertTriangle className="w-4 h-4 text-red-500" />,
    };
    const MOVER_CLASS_COLORS: Record<string, string> = {
      TOP: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      MID: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      LOW: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };

    return (
      <div className="space-y-10 pt-4 animate-in fade-in">

        {/* ── Module Error Banner ───────────────────────────────────────── */}
        {errorCount > 0 && (
          <div className="border border-orange-300 dark:border-orange-700 rounded-lg bg-orange-50/60 dark:bg-orange-950/20 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                {errorCount} analysis module{errorCount > 1 ? 's' : ''} failed — partial results shown
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {Object.entries(moduleErrors).map(([mod, err]: [string, any]) => (
                <p key={mod} className="text-xs text-muted-foreground">
                  <span className="font-mono font-bold">{mod}:</span> {String(err)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── Intelligence Signals Panel ────────────────────────────────── */}
        {ok(summary) && summary.signals?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Brain className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Intelligence Signals</h3>
                <p className="text-xs text-muted-foreground">Rule-based insights synthesised from all analysis modules</p>
              </div>
              <div className="ml-auto flex gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold">{summary.counts?.warnings ?? 0} Warnings</span>
                <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">{summary.counts?.opportunities ?? 0} Opportunities</span>
                <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">{summary.counts?.positives ?? 0} Positives</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.signals.map((signal: any, i: number) => (
                <div
                  key={i}
                  className={`border-l-4 rounded-r-lg px-4 py-3 ${SIGNAL_COLORS[signal.type] || SIGNAL_COLORS.INFO}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {SIGNAL_ICONS[signal.type]}
                    <span className="text-xs font-black uppercase tracking-wider">{signal.area}</span>
                  </div>
                  <p className="text-sm">{signal.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 30-Day Revenue Forecast ───────────────────────────────────── */}
        {forecast && forecast.forecastDays?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">30-Day Revenue Forecast</h3>
                <p className="text-xs text-muted-foreground">
                  Trend + seasonality model&nbsp;
                  <span className={`font-bold ${forecast.summary?.modelAccuracy === 'HIGH' ? 'text-green-600'
                    : forecast.summary?.modelAccuracy === 'MEDIUM' ? 'text-amber-500'
                      : 'text-red-500'
                    }`}>(accuracy: {forecast.summary?.modelAccuracy})</span>
                  &nbsp;· R² = {forecast.summary?.trendR2}
                  {forecast.summary?.etsBelended && ' · ETS blended'}
                </p>
              </div>
              <div className="ml-auto grid grid-cols-2 gap-3 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">30d Forecast</p>
                  <p className="text-lg font-black">{formatCurrency(forecast.summary?.total30dForecast ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg/Day</p>
                  <p className="text-lg font-black">{formatCurrency(forecast.summary?.avgDailyForecast ?? 0)}</p>
                </div>
              </div>
            </div>
            <Card>
              <CardContent className="h-[360px] pt-4">
                <ZoomableChart title="30-Day Revenue Forecast">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={[
                        ...((forecast.historicalDaily ?? []).map((d: any) => ({ ...d, type: 'actual' }))),
                        ...forecast.forecastDays.map((d: any) => ({ ...d, day: d.date, revenue: undefined, type: 'forecast' })),
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={Math.ceil((forecast.historicalDaily?.length + 30) / 10)} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name] as [string, string]} />
                      <Legend />
                      {/* CI 95% band */}
                      <Area dataKey="ci95High" fill="#3B82F6" stroke="none" fillOpacity={0.08} name="95% CI" />
                      <Area dataKey="ci95Low" fill="#fff" stroke="none" fillOpacity={1} />
                      {/* CI 80% band */}
                      <Area dataKey="ci80High" fill="#3B82F6" stroke="none" fillOpacity={0.13} name="80% CI" />
                      <Area dataKey="ci80Low" fill="#fff" stroke="none" fillOpacity={1} />
                      {/* Historical */}
                      <Bar dataKey="revenue" name="Actual Revenue" fill="#CC2224" opacity={0.7} radius={[2, 2, 0, 0]} />
                      {/* Forecast line */}
                      <Line dataKey="forecast" name="Forecast" stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ZoomableChart>
              </CardContent>
            </Card>

            {/* Category trends */}
            {forecast.categoryTrends?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {forecast.categoryTrends.slice(0, 9).map((ct: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                    <div className={`p-1.5 rounded-lg ${ct.direction === 'GROWING' ? 'bg-green-100 dark:bg-green-900/30'
                      : ct.direction === 'DECLINING' ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}>
                      {ct.direction === 'GROWING' ? <ArrowUp className="w-3.5 h-3.5 text-green-600" />
                        : ct.direction === 'DECLINING' ? <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                          : <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{ct.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {ct.direction} · slope ₹{ct.dailyTrendSlope}/d · R²={ct.trendR2}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BCG Matrix ───────────────────────────────────────────────── */}
        {bcg && bcg.matrix?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">BCG Category Matrix</h3>
                <p className="text-xs text-muted-foreground">Category strategy map: revenue share vs. growth trajectory (K-Means clustered)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="h-[340px] pt-4">
                  <ZoomableChart title="BCG Matrix — Revenue Share vs Revenue Growth">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="revenueShare" name="Revenue Share %" unit="%" label={{ value: 'Revenue Share %', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                        <YAxis dataKey="growthSlope" name="Growth (₹/day)" label={{ value: 'Growth ₹/day', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                        <ZAxis dataKey="revenue" range={[40, 400]} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg shadow p-3 text-xs">
                                <p className="font-bold text-sm">{d.category}</p>
                                <p>Revenue Share: {d.revenueShare}%</p>
                                <p>Growth Slope: ₹{d.growthSlope}/day</p>
                                <p>Revenue: {formatCurrency(d.revenue)}</p>
                                <p>Label: <span style={{ color: BCG_COLORS[d.bcgLabel] }} className="font-bold">{d.bcgLabel?.replace('_', ' ')}</span></p>
                              </div>
                            );
                          }}
                        />
                        <ReferenceLine x={bcg.quadrantThresholds?.shareMedian} stroke="#555" strokeDasharray="4 2" />
                        <ReferenceLine y={bcg.quadrantThresholds?.growthMedian} stroke="#555" strokeDasharray="4 2" />
                        <Scatter
                          data={bcg.matrix}
                          shape={(props: any) => {
                            const { cx, cy, payload } = props;
                            const color = BCG_COLORS[payload.bcgLabel] || '#999';
                            return <circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={2} />;
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </ZoomableChart>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Classification</CardTitle>
                  <CardDescription>Strategic category allocation summary</CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[280px]">
                  <div className="space-y-2">
                    {['STAR', 'CASH_COW', 'QUESTION_MARK', 'DOG'].map((label) => {
                      const cats = bcg.matrix.filter((m: any) => m.bcgLabel === label);
                      if (!cats.length) return null;
                      return (
                        <div key={label}>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ color: BCG_COLORS[label] }}>{BCG_ICONS[label]}</span>
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: BCG_COLORS[label] }}>
                              {label.replace('_', ' ')}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">{bcg.labels?.[label]}</span>
                          </div>
                          {cats.map((c: any, i: number) => (
                            <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-muted/40">
                              <span className="text-sm">{c.category}</span>
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <span>{c.revenueShare}%</span>
                                <span className={c.growthSlope >= 0 ? 'text-green-600' : 'text-red-500'}>
                                  {c.growthSlope >= 0 ? '+' : ''}{c.growthSlope}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Advanced Mover Spectrum ───────────────────────────────────── */}
        {advMovers && advMovers.categories?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Flame className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Category Performance Spectrum</h3>
                <p className="text-xs text-muted-foreground">{advMovers.classificationMethod}</p>
              </div>
            </div>
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2">Category</th>
                      <th className="text-center py-2">Class</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Share</th>
                      <th className="text-right py-2">Score</th>
                      <th className="text-right py-2">Trend ₹/d</th>
                      <th className="text-center py-2">Peak Hour</th>
                      <th className="text-center py-2">Best Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advMovers.categories.map((row: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2.5 font-semibold">{row.category}</td>
                        <td className="py-2.5 text-center">
                          <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-full ${MOVER_CLASS_COLORS[row.moverClass] || 'bg-muted text-muted-foreground'
                            }`}>{row.moverClass}</span>
                        </td>
                        <td className="py-2.5 text-right font-medium">{formatCurrency(row.revenue)}</td>
                        <td className="py-2.5 text-right">{row.revenueShare}%</td>
                        <td className="py-2.5 text-right font-mono text-xs">
                          <span className={row.performanceScore >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {row.performanceScore >= 0 ? '+' : ''}{row.performanceScore}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={row.revenueTrend >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {row.revenueTrend >= 0 ? '+' : ''}{Number(row.revenueTrend).toFixed(0)}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {row.peakHour >= 0 ? `${row.peakHour}:00` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            {row.peakWeekday ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Inventory Intelligence ───────────────────────────────────── */}
        {invIq && invIq.inventoryData?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Inventory IQ</h3>
                <p className="text-xs text-muted-foreground">Sales velocity, days-of-supply, and reorder urgency — analysed over {invIq.workingDaysAnalyzed} working days</p>
              </div>
              <div className="ml-auto flex gap-2 text-xs">
                {invIq.summary?.criticalCategories > 0 && (
                  <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                    {invIq.summary.criticalCategories} CRITICAL
                  </span>
                )}
                {invIq.summary?.stagnantCategories > 0 && (
                  <span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                    {invIq.summary.stagnantCategories} Stagnant
                  </span>
                )}
              </div>
            </div>
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Stock Qty</th>
                      <th className="text-right py-2">Sold Qty</th>
                      <th className="text-right py-2">Velocity / Day</th>
                      <th className="text-right py-2">Days of Supply</th>
                      <th className="text-right py-2">Turnover Rate</th>
                      {invIq.inventoryData[0]?.stockValue !== undefined && <th className="text-right py-2">Stock Value</th>}
                      <th className="text-center py-2">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invIq.inventoryData.map((row: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2.5 font-semibold">{row.category}</td>
                        <td className="py-2.5 text-right">{Number(row.stockQty).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 text-right">{Number(row.qtySold).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 text-right font-mono text-xs">{row.velocityPerDay}</td>
                        <td className="py-2.5 text-right font-bold">
                          {row.daysOfSupply === 9999 ? '∞' : row.daysOfSupply}
                        </td>
                        <td className="py-2.5 text-right">{(row.turnoverRate * 100).toFixed(1)}%</td>
                        {row.stockValue !== undefined && (
                          <td className="py-2.5 text-right">{formatCurrency(row.stockValue)}</td>
                        )}
                        <td className="py-2.5 text-center">
                          <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-full ${URGENCY_COLORS[row.reorderUrgency] || 'bg-muted text-muted-foreground'
                            }`}>{row.reorderUrgency}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Anomaly Detection ────────────────────────────────────────── */}
        {anomalies && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Revenue Anomalies</h3>
                <p className="text-xs text-muted-foreground">Days with Z-score |z|{'>'} 2 vs. rolling baseline (with 7-day moving average overlay)</p>
              </div>
              <div className="ml-auto text-xs">
                <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                  {anomalies.summary?.totalAnomalies ?? 0} anomalies detected
                </span>
              </div>
            </div>

            {anomalies.dailyWithRolling?.length > 0 && (
              <Card className="mb-4">
                <CardContent className="h-[300px] pt-4">
                  <ZoomableChart title="Revenue vs 7-Day Rolling Average + Anomalies">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={anomalies.dailyWithRolling}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={Math.ceil(anomalies.dailyWithRolling.length / 8)} />
                        <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name] as [string, string]} />
                        <Legend />
                        <Bar
                          dataKey="revenue"
                          name="Daily Revenue"
                          radius={[3, 3, 0, 0]}
                        >
                          {anomalies.dailyWithRolling.map((d: any, i: number) => (
                            <Cell
                              key={i}
                              fill={
                                d.anomalyType === 'SEVERE_SPIKE' ? '#7C3AED'
                                  : d.anomalyType === 'SPIKE' ? '#F59E0B'
                                    : d.anomalyType?.includes('CRASH') ? '#EF4444'
                                      : '#CC2224'
                              }
                              opacity={d.anomalyType === 'NORMAL' ? 0.6 : 1}
                            />
                          ))}
                        </Bar>
                        <Line dataKey="rolling7d" name="7-Day Avg" stroke="#3B82F6" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ZoomableChart>
                </CardContent>
              </Card>
            )}

            {anomalies.anomalies?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {anomalies.anomalies.map((a: any, i: number) => (
                  <div key={i} className={`border rounded-lg p-3 ${a.anomalyType?.includes('CRASH') ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
                    : a.anomalyType?.includes('SEVERE') ? 'border-violet-300 bg-violet-50/50 dark:bg-violet-950/20'
                      : 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider">{a.anomalyType?.replace('_', ' ')}</span>
                      <span className="text-xs font-mono">z={a.zScore}</span>
                    </div>
                    <p className="text-sm font-bold">{a.date} ({a.weekday})</p>
                    <p className="text-sm">{formatCurrency(a.revenue)} · {a.orders} orders</p>
                    {a.topCategory && <p className="text-xs text-muted-foreground mt-1">Top: {a.topCategory}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Price Elasticity ─────────────────────────────────────────── */}
        {pricePerf && pricePerf.categoryElasticity?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 pb-2 border-b mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Price Performance & Elasticity</h3>
                <p className="text-xs text-muted-foreground">Pearson correlation (price vs. qty sold) per category — identifies over/under-priced SKUs</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricePerf.categoryElasticity.slice(0, 8).map((cat: any, i: number) => (
                <Card key={i} className="print:break-inside-avoid">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{cat.category}</p>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cat.elasticitySignal === 'ELASTIC' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : cat.elasticitySignal === 'INELASTIC' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                        }`}>{cat.elasticitySignal}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-muted-foreground">Avg Price</p>
                        <p className="font-bold">{formatCurrency(cat.avgPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Correlation</p>
                        <p className={`font-bold ${cat.priceQtyCorrelation < -0.3 ? 'text-red-500'
                          : cat.priceQtyCorrelation > 0.3 ? 'text-green-600'
                            : 'text-muted-foreground'
                          }`}>{cat.priceQtyCorrelation}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SKUs</p>
                        <p className="font-bold">{cat.skuCount}</p>
                      </div>
                    </div>
                    {'avgMargin' in cat && cat.avgMargin !== null && (
                      <div className="text-xs mb-2">
                        <span className="text-muted-foreground">Avg Margin: </span>
                        <span className="font-bold">{cat.avgMargin}%</span>
                      </div>
                    )}
                    {cat.overpricedSkus?.length > 0 && (
                      <div className="text-xs">
                        <p className="text-orange-600 font-semibold mb-0.5">Possibly over-priced:</p>
                        {cat.overpricedSkus.map((s: any, j: number) => (
                          <p key={j} className="text-muted-foreground">{s.code} — {formatCurrency(s.salePrice)} ({s.qtySold} sold)</p>
                        ))}
                      </div>
                    )}
                    {cat.underpricedSkus?.length > 0 && (
                      <div className="text-xs mt-1">
                        <p className="text-green-600 font-semibold mb-0.5">Possibly under-priced (high demand):</p>
                        {cat.underpricedSkus.map((s: any, j: number) => (
                          <p key={j} className="text-muted-foreground">{s.code} — {formatCurrency(s.salePrice)} ({s.qtySold} sold)</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-8 print:p-0" id="report-view">
      {/* Metadata Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            {analysis.stockFileName}
            {startCase(analysis.status) === 'Completed' && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
          </h2>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Analyzed:{' '}
              {new Date(analysis.analyzedAt).toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-[#CC2224]">
              <UserCheck className="w-4 h-4" /> Initiated by: {analysis.uploadedBy}
            </span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4" /> Sales Rows: {data.metadata?.salesRows || 0}
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" /> Stock Rows: {data.metadata?.stockRows || 0}
            </span>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant={viewMode === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'tabs' ? 'full' : 'tabs')}
          >
            {viewMode === 'tabs' ? (
              <>
                <LayoutList className="w-4 h-4 mr-2" /> View Full Report
              </>
            ) : (
              <>
                <Rows className="w-4 h-4 mr-2" /> View Tabs
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadJson}>
            <Download className="w-4 h-4 mr-2" /> JSON
          </Button>
          {showFullScreenLink && (
            <Link href={`/admin-login/data-analytics/report/${analysis.$id}`} target="_blank">
              <Button size="sm" className="bg-[#CC2224] hover:bg-black text-white">
                <ExternalLink className="w-4 h-4 mr-2" /> Full Screen
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.salesOverview.totalRevenue)}
          icon={<DollarSign />}
        />
        <MetricCard
          title="Calculated Profit"
          value={formatCurrency(data.stockMargins.overall.totalProfit)}
          icon={<TrendingUp />}
          color="text-green-600"
        />
        <MetricCard
          title="Total Orders"
          value={data.salesOverview.totalOrders}
          icon={<ShoppingCart />}
        />
        <MetricCard
          title="Margin %"
          value={`${data.stockMargins.overall.marginPercentage.toFixed(1)}%`}
          icon={<Percent />}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(data.salesOverview.averageOrderValue)}
          icon={<DollarSign />}
        />
      </div>

      {/* Content View */}
      {viewMode === 'tabs' ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap gap-1 md:grid md:grid-cols-6 bg-muted/50 print:hidden h-auto p-1">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs">Customers</TabsTrigger>
            <TabsTrigger value="products" className="text-xs">Product & Sales</TabsTrigger>
            <TabsTrigger value="movers" className="text-xs">Movers</TabsTrigger>
            <TabsTrigger value="intelligence" className="text-xs flex items-center gap-1">
              <Brain className="w-3 h-3" /> Intelligence
            </TabsTrigger>
            <TabsTrigger value="deadstock" className="text-xs" disabled={!data.deadStockAnalysis}>
              Dead Stock
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="customers">{renderCustomers()}</TabsContent>
          <TabsContent value="products">{renderProducts()}</TabsContent>
          <TabsContent value="movers">{renderMovers()}</TabsContent>
          <TabsContent value="intelligence">{renderIntelligence()}</TabsContent>
          <TabsContent value="deadstock">{renderDeadStock()}</TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-12 print:space-y-12">
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <LayoutList className="w-5 h-5" /> Overview & Trends
            </h3>
            {renderOverview()}
          </div>
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Customer Intelligence
            </h3>
            {renderCustomers()}
          </div>
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Product & Sales
            </h3>
            {renderProducts()}
          </div>
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Top & Zero Movers
            </h3>
            {renderMovers()}
          </div>
          <div className="border-t pt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" /> ML Intelligence
            </h3>
            {renderIntelligence()}
          </div>
          {data.deadStockAnalysis && (
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Skull className="w-5 h-5" /> Dead Stock Analysis
              </h3>
              {renderDeadStock()}
            </div>
          )}
        </div>
      )}

      {/* AI Intelligence Chatbot */}
      <AnalyticsChatbot
        analysisData={data}
        analysisMetadata={{
          stockFileName: analysis.stockFileName,
          salesFileName: analysis.salesFileName,
          deadStockFileName: analysis.deadStockFileName,
          analyzedAt: analysis.analyzedAt,
        }}
      />
    </div>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300">
            {icon}
          </div>
        </div>
        <div className={`text-2xl font-black ${color || 'text-foreground'}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          {title}
        </div>
      </CardContent>
    </Card>
  );
}

function startCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
