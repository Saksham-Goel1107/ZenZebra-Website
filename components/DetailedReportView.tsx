'use client';

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
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LayoutList,
  Package,
  Percent,
  Printer,
  Rows,
  ShoppingCart,
  Skull,
  TrendingUp,
  UserCheck,
  Users,
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
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
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
  data: AnalysisData;
  analysis: AnalysisResult;
  showFullScreenLink?: boolean;
}) {
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
                  ]}
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
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 print:hidden">
            <TabsTrigger value="overview">Overview & Trends</TabsTrigger>
            <TabsTrigger value="customers">Customer Intelligence</TabsTrigger>
            <TabsTrigger value="products">Product & Sales</TabsTrigger>
            <TabsTrigger value="deadstock" disabled={!data.deadStockAnalysis}>
              Dead Stock Analysis
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="customers">{renderCustomers()}</TabsContent>
          <TabsContent value="products">{renderProducts()}</TabsContent>
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
