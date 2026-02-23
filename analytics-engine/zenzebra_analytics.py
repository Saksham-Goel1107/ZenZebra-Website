# -*- coding: utf-8 -*-
"""
ZenZebra Triple Report Analytics Engine v4.0
Processes Stock Report, Sales Report, and Dead Stock Report
Full ML-powered intelligence: movers, forecasting, clustering, anomalies, inventory IQ
"""

import pandas as pd
import numpy as np
import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
import warnings
import gender_guesser.detector as gender
from scipy import stats
from scipy.stats import zscore

# --- ML imports with graceful fallback ---
try:
    from sklearn.linear_model import LinearRegression
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import r2_score
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    _STATSMODELS_AVAILABLE = True
except ImportError:
    _STATSMODELS_AVAILABLE = False

warnings.filterwarnings('ignore')



class ZenZebraAnalytics:
    """
    Analytics engine for processing ZenZebra Stock, Sales, and Dead Stock reports
    """

    # File name patterns with regex
    STOCK_REPORT_PATTERN = r'^Stock\s*Report-(.+?)-(.+?)-\d+\.xlsx$'
    SALES_REPORT_PATTERN = r'^Sale\s*Report\s*-\s*Item\s*Wise-(.+?)-(.+?)-\d+.*\.xlsx$'
    # Dead Stock report pattern might be simpler or fixed
    DEAD_STOCK_PATTERN = r'.*Dead\s*Stock.*\.xlsx$'

    def __init__(self):
        self.stock_df = None
        self.sales_df = None
        self.dead_stock_df = None
        self.stock_dates = None
        self.sales_dates = None
        self.gender_detector = gender.Detector(case_sensitive=False)

    def validate_and_parse_filename(self, filename: str, pattern: str) -> Optional[Tuple[str, str]]:
        """
        Validate filename against pattern and extract dates if possible
        Returns: (start_date, end_date) or None
        """
        match = re.match(pattern, filename, re.IGNORECASE)
        if match:
            # Check if groups exist (Dead stock might not have dates)
            if len(match.groups()) >= 2:
                return match.group(1), match.group(2)
            return "Unknown", "Unknown"
        return None

    def load_stock_report(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Load and validate stock report"""
        dates = self.validate_and_parse_filename(filename, self.STOCK_REPORT_PATTERN)
        # Relaxed validation for now if dates are tricky, but try pattern first
        if not dates:
             # Fallback: simple check if it looks like excel
             if not filename.endswith('.xlsx'):
                 raise ValueError("Stock report must be an Excel file")
             dates = ("Unknown", "Unknown")

        self.stock_dates = dates
        self.stock_df = pd.read_excel(file_bytes)

        # Clean stock data
        if 'category' not in self.stock_df.columns:
             # Try to find category column case-insensitive
             for col in self.stock_df.columns:
                 if col.lower() == 'category':
                     self.stock_df.rename(columns={col: 'category'}, inplace=True)
                     break

        self.stock_df['category'] = self.stock_df['category'].astype(str).str.strip()
        self.stock_df['category'] = self.stock_df['category'].replace(
            ['food', 'F&B', 'Food', 'f&b'], 'SNACK CORNER', regex=False
        )
        self.stock_df = self.stock_df[
            self.stock_df['category'].notna() & (self.stock_df['category'] != '') & (self.stock_df['category'] != 'nan')
        ]

        # Clean numeric columns
        stock_cols = ['quantity', 'onHold', 'Main Stock', 'Return Stock',
                     'Smartworks Stock', 'Awfis Stock', 'Lodhi Stock', 'Smartworks Noida Stock']
        for col in stock_cols:
            if col in self.stock_df.columns:
                self.stock_df[col] = pd.to_numeric(self.stock_df[col], errors='coerce').fillna(0)
                self.stock_df[col] = self.stock_df[col].clip(lower=0)

        # Ensure SKU column exists (usually 'code')
        if 'code' not in self.stock_df.columns and 'Code' in self.stock_df.columns:
            self.stock_df.rename(columns={'Code': 'code'}, inplace=True)

        if 'code' in self.stock_df.columns:
            self.stock_df['code'] = self.stock_df['code'].astype(str).str.strip()

        return {
            "status": "loaded",
            "rows": len(self.stock_df),
            "date_range": f"{dates[0]} to {dates[1]}"
        }

    def load_sales_report(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Load and validate sales report"""
        dates = self.validate_and_parse_filename(filename, self.SALES_REPORT_PATTERN)
        if not dates:
             if not filename.endswith('.xlsx'):
                 raise ValueError("Sales report must be an Excel file")
             dates = ("Unknown", "Unknown")

        self.sales_dates = dates
        self.sales_df = pd.read_excel(file_bytes)

        # Clean sales data
        if 'category' not in self.sales_df.columns:
             for col in self.sales_df.columns:
                 if col.lower() == 'category':
                     self.sales_df.rename(columns={col: 'category'}, inplace=True)
                     break

        self.sales_df['category'] = self.sales_df['category'].astype(str).str.strip()
        self.sales_df = self.sales_df[
            self.sales_df['category'].notna() & (self.sales_df['category'] != '') & (self.sales_df['category'] != 'nan')
        ]

        # Parse dates and remove weekends
        self.sales_df['date'] = pd.to_datetime(self.sales_df['date'], errors='coerce')
        self.sales_df = self.sales_df.dropna(subset=['date'])
        self.sales_df['weekday'] = self.sales_df['date'].dt.day_name()

        # Filter weekends (per zenzebra.py logic)
        weekend_count = self.sales_df[self.sales_df['weekday'].isin(['Saturday', 'Sunday'])].shape[0]
        self.sales_df = self.sales_df[~self.sales_df['weekday'].isin(['Saturday', 'Sunday'])]

        # Customer Name Cleaning
        if 'customerName' in self.sales_df.columns:
            mask = self.sales_df['customerName'].notna() & (self.sales_df['customerName'].astype(str).str.strip() != '')

            # Clean names (keep only letters, uppercase, first word)
            self.sales_df.loc[mask, 'customerName'] = (
                self.sales_df.loc[mask, 'customerName']
                .astype(str)
                .str.replace(r'[^A-Za-z]+', ' ', regex=True)
                .str.strip()
                .str.split()
                .str[0]
                .str.upper()
            )

        return {
            "status": "loaded",
            "rows": len(self.sales_df),
            "weekends_removed": weekend_count,
            "date_range": f"{dates[0]} to {dates[1]}"
        }

    def load_dead_stock_report(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Load and validate dead stock report"""
        # No strict date pattern check for dead stock, just file type
        if not filename.endswith('.xlsx'):
            raise ValueError("Dead Stock report must be an Excel file")

        self.dead_stock_df = pd.read_excel(file_bytes)

        # Clean dead stock
        # Ensure SKU column exists (usually 'Code' or 'code')
        if 'Code' in self.dead_stock_df.columns:
             self.dead_stock_df['Code'] = self.dead_stock_df['Code'].astype(str).str.strip()
        elif 'code' in self.dead_stock_df.columns:
             self.dead_stock_df.rename(columns={'code': 'Code'}, inplace=True)
             self.dead_stock_df['Code'] = self.dead_stock_df['Code'].astype(str).str.strip()

        # Remove empty codes
        if 'Code' in self.dead_stock_df.columns:
            self.dead_stock_df = self.dead_stock_df[self.dead_stock_df['Code'] != '']

        return {
            "status": "loaded",
            "rows": len(self.dead_stock_df)
        }

    # --- Analysis Methods ---

    def analyze_sales_overview(self) -> Dict[str, Any]:
        """Generate sales overview metrics"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df_sales['day'] = df_sales['date'].dt.date

        # Bill-level aggregation
        bill_level = (
            df_sales
            .groupby('number', as_index=False)
            .agg(
                bill_revenue=('totalAmount', 'sum'),
                bill_day=('day', 'first')
            )
        )

        # Daily aggregation
        daily = (
            bill_level
            .groupby('bill_day', as_index=False)
            .agg(
                daily_revenue=('bill_revenue', 'sum'),
                daily_orders=('number', 'nunique')
            )
        )
        daily['weekday'] = pd.to_datetime(daily['bill_day']).dt.day_name()

        total_revenue = bill_level['bill_revenue'].sum()
        total_orders = bill_level['number'].nunique()
        total_items = df_sales['quantity'].sum()
        aov = total_revenue / total_orders if total_orders > 0 else 0

        avg_daily = daily['daily_revenue'].mean() if not daily.empty else 0

        # Peak and Low days
        if not daily.empty:
            peak_day = daily.loc[daily['daily_revenue'].idxmax()]
            low_day = daily.loc[daily['daily_revenue'].idxmin()]
            peak_day_data = {
                "date": str(peak_day['bill_day']),
                "weekday": peak_day['weekday'],
                "revenue": float(peak_day['daily_revenue']),
                "orders": int(peak_day['daily_orders'])
            }
            low_day_data = {
                "date": str(low_day['bill_day']),
                "weekday": low_day['weekday'],
                "revenue": float(low_day['daily_revenue'])
            }
        else:
            peak_day_data = {}
            low_day_data = {}

        return {
            "totalRevenue": float(total_revenue),
            "totalOrders": int(total_orders),
            "totalItems": int(total_items),
            "averageOrderValue": float(aov),
            "workingDays": len(daily),
            "avgDailyRevenue": float(avg_daily),
            "peakDay": peak_day_data,
            "lowDay": low_day_data
        }

    def analyze_category_performance(self) -> Dict[str, Any]:
        """Analyze category-wise performance"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled']

        category_revenue = (
            df_sales
            .groupby('category', as_index=False)['totalAmount']
            .sum()
            .sort_values('totalAmount', ascending=False)
        )

        category_orders = (
            df_sales
            .groupby('category', as_index=False)['number']
            .nunique()
            .rename(columns={'number': 'orders'})
        )

        category_items = (
            df_sales
            .groupby('category', as_index=False)['quantity']
            .sum()
        )

        merged = category_revenue.merge(category_orders, on='category').merge(category_items, on='category')
        merged['aov'] = merged['totalAmount'] / merged['orders']
        merged['percentage'] = (merged['totalAmount'] / merged['totalAmount'].sum()) * 100

        return {
            "categories": merged.to_dict('records'),
            "totalRevenue": float(merged['totalAmount'].sum())
        }

    def analyze_daily_trends(self) -> Dict[str, Any]:
        """Analyze daily revenue and order trends"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df_sales['day'] = df_sales['date'].dt.date

        daily = (
            df_sales
            .groupby('day', as_index=False)
            .agg({
                'totalAmount': 'sum',
                'number': 'nunique',
                'quantity': 'sum'
            })
            .rename(columns={
                'totalAmount': 'revenue',
                'number': 'orders',
                'quantity': 'items'
            })
            .sort_values('day')
        )

        daily['day'] = daily['day'].astype(str)
        daily['weekday'] = pd.to_datetime(daily['day']).dt.day_name()

        return {
            "dailyData": daily.to_dict('records')
        }

    def analyze_payment_methods(self) -> Dict[str, Any]:
        """Analyze payment method distribution"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled']

        payment_revenue = (
            df_sales
            .groupby('paymentMethod', as_index=False)['totalAmount']
            .sum()
        )

        payment_orders = (
            df_sales
            .groupby('paymentMethod', as_index=False)['number']
            .count()
            .rename(columns={'number': 'orders'})
        )

        merged = payment_revenue.merge(payment_orders, on='paymentMethod')
        merged['percentage'] = (merged['totalAmount'] / merged['totalAmount'].sum()) * 100

        return {
            "paymentData": merged.to_dict('records')
        }

    def analyze_hourly_patterns(self) -> Dict[str, Any]:
        """Analyze hourly sales patterns"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df_sales['hour'] = df_sales['date'].dt.hour

        hourly = (
            df_sales
            .groupby('hour', as_index=False)
            .agg({
                'number': 'nunique',
                'totalAmount': 'sum'
            })
            .rename(columns={'number': 'transactions', 'totalAmount': 'revenue'})
        )

        hourly = hourly[(hourly['hour'] >= 8) & (hourly['hour'] <= 22)]
        if not hourly.empty:
            hourly['aov'] = hourly['revenue'] / hourly['transactions']
            peak_hour = hourly.loc[hourly['revenue'].idxmax()]
            peak_data = {
                "hour": int(peak_hour['hour']),
                "revenue": float(peak_hour['revenue']),
                "transactions": int(peak_hour['transactions']),
                "aov": float(peak_hour['aov'])
            }
        else:
            peak_data = {}

        return {
            "hourlyData": hourly.to_dict('records'),
            "peakHour": peak_data
        }

    def analyze_stock_margins(self) -> Dict[str, Any]:
        """Analyze profit margins from stock data"""
        valid_stock = self.stock_df[
            (self.stock_df['category'].notna()) &
            (self.stock_df['category'] != '') &
            (self.stock_df['salePrice'] > 0) &
            (self.stock_df['purchasePrice'] > 0)
        ].copy()

        valid_stock['profit_per_unit'] = valid_stock['salePrice'] - valid_stock['purchasePrice']
        valid_stock['profit_margin_pct'] = (
            valid_stock['profit_per_unit'] / valid_stock['salePrice']
        ) * 100

        category_margin = (
            valid_stock
            .groupby('category', as_index=False)['profit_margin_pct']
            .mean()
            .sort_values('profit_margin_pct', ascending=False)
        )

        total_revenue = valid_stock['salePrice'].sum()
        total_cost = valid_stock['purchasePrice'].sum()
        total_profit = total_revenue - total_cost
        overall_margin_pct = (total_profit / total_revenue) * 100 if total_revenue > 0 else 0

        return {
            "categoryMargins": category_margin.to_dict('records'),
            "overall": {
                "totalRevenue": float(total_revenue),
                "totalCost": float(total_cost),
                "totalProfit": float(total_profit),
                "marginPercentage": float(overall_margin_pct)
            }
        }

    def analyze_sale_place(self) -> Dict[str, Any]:
        """Analyze revenue by sale place (billed_by)"""
        if 'billed_by' not in self.sales_df.columns:
            return {"error": "billed_by column missing"}

        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()

        sale_place_map = {
            'admin': 'main',
            'sanjam': 'main',
            'gurpreet@zenzebra.in': 'main'
        }

        df_sales['sale_place'] = (
            df_sales['billed_by']
            .astype(str)
            .str.strip()
            .str.lower()
            .replace(sale_place_map)
        )

        place_revenue = (
            df_sales
            .groupby('sale_place', as_index=False)['totalAmount']
            .sum()
        )

        place_orders = (
            df_sales
            .groupby('sale_place', as_index=False)['number']
            .nunique()
            .rename(columns={'number': 'order_count'})
        )

        merged = place_revenue.merge(place_orders, on='sale_place').sort_values('totalAmount', ascending=False)

        return {
            "places": merged.to_dict('records')
        }

    def analyze_weekday_performance(self) -> Dict[str, Any]:
        """Analyze performance by day of week"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()

        weekday_orders = (
            df_sales
            .groupby(['weekday'], as_index=False)
            .agg({
                'totalAmount': 'sum',
                'number': 'nunique'
            })
            .rename(columns={'totalAmount': 'revenue', 'number': 'orders'})
        )

        # Sort by standard week order for one chart, by revenue for 'best day'
        week_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekday_orders['weekday_index'] = pd.Categorical(
            weekday_orders['weekday'],
            categories=week_order,
            ordered=True
        )

        sorted_by_day = weekday_orders.sort_values('weekday_index').drop(columns=['weekday_index'])
        best_day = weekday_orders.sort_values('revenue', ascending=False).iloc[0].to_dict()

        return {
            "weekdayStats": sorted_by_day.to_dict('records'),
            "bestDay": best_day
        }

    def analyze_category_gender(self) -> Dict[str, Any]:
        """Analyze orders by category and gender"""
        df_orders = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()

        if 'customerName' not in df_orders.columns:
            # If no customer names, all gender is Unknown
            df_orders['gender'] = 'Unknown'
        else:
            # Create unique customer key/name map
            customers = (
                df_orders[['customerName']]
                .dropna()
                .drop_duplicates()
            )

            def infer(name):
                 if pd.isna(name) or str(name).strip() == '': return 'Unknown'
                 first = str(name).strip().split()[0]
                 if not re.fullmatch(r'[A-Za-z]+', first): return 'Unknown'
                 g = self.gender_detector.get_gender(first)
                 if g in ('male', 'mostly_male'): return 'Male'
                 if g in ('female', 'mostly_female'): return 'Female'
                 return 'Unknown'

            # Apply inference
            gender_series = customers['customerName'].apply(infer)
            customers['gender'] = gender_series

            # Map back using set_index (safer than merge)
            gender_map = customers.set_index('customerName')['gender']
            df_orders['gender'] = df_orders['customerName'].map(gender_map).fillna('Unknown')

        orders_by_cat_gender = (
            df_orders
            .groupby(['category', 'gender'])['number']
            .nunique()
            .reset_index(name='order_count')
        )

        # Pivot for easier frontend consumption: { category: "X", Male: 10, Female: 5, Unknown: 2 }
        if not orders_by_cat_gender.empty:
            pivot = (
                orders_by_cat_gender
                .pivot(index='category', columns='gender', values='order_count')
                .fillna(0)
                .reset_index()
            )
            breakdown = pivot.to_dict('records')
        else:
            breakdown = []

        return {
            "breakdown": breakdown
        }

    # --- NEW: Customer Loyalty Analysis (Repeat vs One-time) ---
    def analyze_customer_loyalty(self) -> Dict[str, Any]:
        """Analyze Customer Loyalty and Retention with Data Quality"""
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()

        # Group by number (bill)
        bill_level = (
            df_sales.groupby('number', as_index=False)
            .agg({
                'customerName': lambda x: x.dropna().iloc[0] if x.dropna().any() else None,
                'customerMobile': lambda x: x.dropna().iloc[0] if x.dropna().any() else None,
                'totalAmount': 'sum'
            })
            .rename(columns={'totalAmount': 'bill_total'})
        )

        total_transactions = len(bill_level)

        # Data Quality stats
        has_info = bill_level['customerName'].notna() | bill_level['customerMobile'].notna()
        tx_with_info = int(has_info.sum())
        tx_missing_info = int((~has_info).sum())

        # Create key
        bill_level['customer_key'] = bill_level['customerMobile'].fillna(
            bill_level['customerName'].astype(str).str.lower()
        )

        # Identify valid customers
        identified = bill_level[bill_level['customer_key'].notna() & (bill_level['customer_key'] != 'nan') & (bill_level['customer_key'] != '')]
        unique_identifiable = identified['customer_key'].nunique()

        if identified.empty:
             return {"error": "No identifiable customer data found"}

        customer_tx_counts = identified.groupby('customer_key').size()

        identified['customer_type'] = identified['customer_key'].map(
            lambda x: 'Repeat' if customer_tx_counts[x] > 1 else 'One-time'
        )

        summary = (
            identified
            .groupby('customer_type')
            .agg(
                total_revenue=('bill_total', 'sum'),
                transactions=('number', 'nunique'),
                customers=('customer_key', 'nunique')
            )
        )

        summary['aov'] = summary['total_revenue'] / summary['transactions']
        summary['revenue_per_customer'] = summary['total_revenue'] / summary['customers']

        repeat = summary.loc['Repeat'] if 'Repeat' in summary.index else pd.Series(0, index=summary.columns)
        one_time = summary.loc['One-time'] if 'One-time' in summary.index else pd.Series(0, index=summary.columns)

        return {
            "dataQuality": {
                "totalTransactions": total_transactions,
                "withInfo": tx_with_info,
                "missingInfo": tx_missing_info,
                "uniqueCustomers": int(unique_identifiable)
            },
            "summary": {
                "repeat": repeat.to_dict(),
                "oneTime": one_time.to_dict()
            },
            "metrics": {
                 "repeatRevenueShare": float(repeat['total_revenue'] / (repeat['total_revenue'] + one_time['total_revenue']) * 100) if (repeat['total_revenue'] + one_time['total_revenue']) > 0 else 0,
            }
        }

    # --- NEW: Gender Analysis ---
    def analyze_gender_demographics(self) -> Dict[str, Any]:
        """Analyze customer gender demographics"""
        df_sales = self.sales_df.copy()

        # Unique customers logic
        customers = (
            df_sales
            # dropna subset customerName
            .dropna(subset=['customerName'])
            .drop_duplicates(subset='customerName') # simplified for unique names
            [['customerName']]
            .copy()
        )

        if customers.empty:
            return {"error": "No identifiable customer names"}

        def infer_gender(name):
             if pd.isna(name) or str(name).strip() == '': return 'Unknown'
             first = str(name).strip().split()[0]
             # Only pure alpha
             if not re.fullmatch(r'[A-Za-z]+', first): return 'Unknown'
             g = self.gender_detector.get_gender(first)
             if g in ('male', 'mostly_male'): return 'Male'
             if g in ('female', 'mostly_female'): return 'Female'
             return 'Unknown'

        customers['gender'] = customers['customerName'].apply(infer_gender)

        gender_counts = customers['gender'].value_counts().reindex(['Male', 'Female', 'Unknown'], fill_value=0)

        return {
            "counts": gender_counts.to_dict(),
            "total": int(gender_counts.sum())
        }

    # --- NEW: Dead Stock Analysis ---
    def analyze_dead_stock(self) -> Dict[str, Any]:
        """Comparison between Stock Report and Dead Stock Report"""
        if self.dead_stock_df is None:
            return {"error": "Dead Stock report not loaded"}

        df_stock = self.stock_df.copy()
        df_dead = self.dead_stock_df.copy()

        # Assuming 'code' is the SKU column in both (normalized in load methods)
        SKU_COL = 'code'
        DEAD_INFO_COL = 'Code' # In load_dead_stock, I renamed it to 'Code' but let's check

        # In load_dead_stock, I normalized column to 'Code'.
        # In load_stock, I normalized to 'code'.
        # Let's align them.
        df_dead.rename(columns={'Code': 'code'}, inplace=True)

        # Ensure SKU columns are string
        df_stock['code'] = df_stock['code'].astype(str).str.strip()
        df_dead['code'] = df_dead['code'].astype(str).str.strip()

        total_skus = df_stock['code'].nunique()

        # Dead SKUs are those in Dead Stock report that ALSO appear in the Stock List (valid items)
        dead_skus_list = df_dead['code'].unique()
        dead_skus_count = df_stock[df_stock['code'].isin(dead_skus_list)]['code'].nunique()

        active_skus = total_skus - dead_skus_count

        # Category Health for Dead Stock
        dead_with_category = df_stock[df_stock['code'].isin(dead_skus_list)]

        total_skus_cat = df_stock.groupby('category')['code'].nunique().rename('total_skus')
        dead_skus_cat = dead_with_category.groupby('category')['code'].nunique().rename('dead_skus')

        category_health = pd.concat([total_skus_cat, dead_skus_cat], axis=1).fillna(0)
        category_health['dead_pct'] = (category_health['dead_skus'] / category_health['total_skus'] * 100).round(1)

        top_critical = category_health.sort_values('dead_pct', ascending=False)

        return {
            "overall": {
                "totalSkus": int(total_skus),
                "activeSkus": int(active_skus),
                "deadSkus": int(dead_skus_count),
                "deadPct": float(dead_skus_count / total_skus * 100) if total_skus > 0 else 0
            },
            "categoryHealth": category_health.reset_index().to_dict('records')
        }

    def analyze_stock_margins(self) -> Dict[str, Any]:
        """Analyze profit margins based on stock prices"""
        if self.stock_df is None: return {}

        stock = self.stock_df.copy()
        # Ensure category exists and prices legitimate
        valid_stock = stock[
            (stock['category'].notna()) & (stock['category'] != '') &
            (stock['salePrice'] > 0) & (stock['purchasePrice'] > 0)
        ].copy()

        if valid_stock.empty: return {"categoryMargins": [], "overall": {"totalProfit": 0, "marginPercentage": 0}}

        valid_stock['profit_per_unit'] = valid_stock['salePrice'] - valid_stock['purchasePrice']
        valid_stock['profit_margin_pct'] = (valid_stock['profit_per_unit'] / valid_stock['salePrice']) * 100

        category_margin = (
            valid_stock
            .groupby('category', as_index=False)['profit_margin_pct']
            .mean()
            .sort_values('profit_margin_pct', ascending=True)
        )

        # Overall
        total_revenue = valid_stock['salePrice'].sum()
        total_cost = valid_stock['purchasePrice'].sum()
        total_profit = total_revenue - total_cost
        overall_margin_pct = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

        return {
            "categoryMargins": category_margin.to_dict('records'),
            "overall": {
                "totalProfit": float(total_profit),
                "marginPercentage": float(overall_margin_pct)
            }
        }

    def analyze_movers(self) -> Dict[str, Any]:
        """
        Compute Top Movers and Zero Movers.

        Top Movers: categories ranked by revenue with their % share of total sales,
        peak selling time, and quantity sold.

        Zero Movers: SKUs present in stock that have zero sales during the period,
        grouped by category so weak categories stand out.
        """
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df_sales['hour'] = df_sales['date'].dt.hour
        df_sales['date_day'] = df_sales['date'].dt.date

        total_revenue = df_sales['totalAmount'].sum()

        # ── Top Movers by Category ─────────────────────────────────────────────
        cat_agg = (
            df_sales
            .groupby('category', as_index=False)
            .agg(
                revenue=('totalAmount', 'sum'),
                quantity=('quantity', 'sum'),
                orders=('number', 'nunique'),
            )
            .sort_values('revenue', ascending=False)
        )
        cat_agg['revenueShare'] = (
            (cat_agg['revenue'] / total_revenue * 100)
            .round(2)
            if total_revenue > 0 else 0
        )
        cat_agg['aov'] = (cat_agg['revenue'] / cat_agg['orders']).round(2)

        # Peak selling hour per category
        cat_hour = (
            df_sales
            .groupby(['category', 'hour'], as_index=False)['totalAmount']
            .sum()
        )
        peak_hours = (
            cat_hour
            .sort_values('totalAmount', ascending=False)
            .drop_duplicates(subset='category')
            .rename(columns={'hour': 'peakHour', 'totalAmount': 'peakHourRevenue'})
            [['category', 'peakHour', 'peakHourRevenue']]
        )

        # Best weekday per category
        df_sales_day = df_sales.copy()
        df_sales_day['weekday'] = df_sales_day['date'].dt.day_name()
        cat_weekday = (
            df_sales_day
            .groupby(['category', 'weekday'], as_index=False)['totalAmount']
            .sum()
        )
        peak_days = (
            cat_weekday
            .sort_values('totalAmount', ascending=False)
            .drop_duplicates(subset='category')
            .rename(columns={'weekday': 'peakWeekday', 'totalAmount': 'peakWeekdayRevenue'})
            [['category', 'peakWeekday', 'peakWeekdayRevenue']]
        )

        top_movers = (
            cat_agg
            .merge(peak_hours, on='category', how='left')
            .merge(peak_days, on='category', how='left')
        )
        top_movers = top_movers.fillna({'peakHour': -1, 'peakHourRevenue': 0, 'peakWeekday': 'N/A', 'peakWeekdayRevenue': 0})

        # ── Zero Movers ────────────────────────────────────────────────────────
        # Items in stock that appear nowhere in fulfilled sales
        sold_codes = set()
        if 'code' in df_sales.columns:
            sold_codes = set(df_sales['code'].dropna().astype(str).str.strip().unique())

        zero_movers_rows = []
        if self.stock_df is not None and 'code' in self.stock_df.columns:
            stock_copy = self.stock_df[
                self.stock_df['category'].notna() &
                (self.stock_df['category'] != '')
            ].copy()
            stock_copy['code'] = stock_copy['code'].astype(str).str.strip()

            # Only consider items with positive quantity (actually in stock)
            qty_col = None
            for c in ['quantity', 'Main Stock', 'onHold']:
                if c in stock_copy.columns:
                    qty_col = c
                    break

            if qty_col:
                in_stock = stock_copy[stock_copy[qty_col] > 0]
            else:
                in_stock = stock_copy

            zero_df = in_stock[~in_stock['code'].isin(sold_codes)].copy()

            if not zero_df.empty:
                # Summarise by category
                name_col = next((c for c in ['name', 'productName', 'item', 'description'] if c in zero_df.columns), None)

                agg_cols = {'code': 'count'}
                if qty_col:
                    agg_cols[qty_col] = 'sum'

                zero_by_cat = (
                    zero_df.groupby('category', as_index=False)
                    .agg(agg_cols)
                    .rename(columns={'code': 'zeroSkus', qty_col: 'stockedQty'} if qty_col else {'code': 'zeroSkus'})
                    .sort_values('zeroSkus', ascending=False)
                )

                # Individual items (top 50 by stocked qty)
                item_cols = ['code', 'category']
                if name_col:
                    item_cols.append(name_col)
                if qty_col:
                    item_cols.append(qty_col)
                if 'salePrice' in zero_df.columns:
                    item_cols.append('salePrice')

                item_detail = (
                    zero_df[item_cols]
                    .sort_values(qty_col if qty_col else 'category', ascending=False)
                    .head(50)
                    .fillna('')
                )

                zero_movers_rows = {
                    'byCategory': zero_by_cat.to_dict('records'),
                    'items': item_detail.to_dict('records'),
                    'totalZeroSkus': int(len(zero_df)),
                }
            else:
                zero_movers_rows = {'byCategory': [], 'items': [], 'totalZeroSkus': 0}
        else:
            zero_movers_rows = {'byCategory': [], 'items': [], 'totalZeroSkus': 0}

        return {
            'topMovers': top_movers.to_dict('records'),
            'zeroMovers': zero_movers_rows,
            'totalRevenue': float(total_revenue),
        }

    # ──────────────────────────────────────────────────────────────────────────
    # ADVANCED ML ANALYTICS  v4.0
    # ──────────────────────────────────────────────────────────────────────────

    def analyze_advanced_movers(self) -> Dict[str, Any]:
        """
        Full mover spectrum: Top / Mid / Low / Zero — all relative to peer categories.

        Uses Z-score normalisation across revenue, quantity, and order count to
        produce a composite "performance score" for each category.
        Classifies into:
          TOP    z > 0.75
          MID    -0.75 <= z <= 0.75
          LOW    z < -0.75
          ZERO   no sales at all
        """
        df = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        total_revenue = float(df['totalAmount'].sum())

        # ── Category aggregation ──────────────────────────────────────────────
        cat = (
            df.groupby('category', as_index=False)
            .agg(
                revenue=('totalAmount', 'sum'),
                quantity=('quantity', 'sum'),
                orders=('number', 'nunique'),
            )
        )
        cat['aov'] = (cat['revenue'] / cat['orders']).round(2)
        cat['revenueShare'] = (cat['revenue'] / total_revenue * 100).round(2)

        # ── Revenue trend (is this category growing or slowing?) ─────────────
        df['day_num'] = (df['date'] - df['date'].min()).dt.days
        trend_data = []
        for cat_name in cat['category']:
            subset = df[df['category'] == cat_name].groupby('day_num')['totalAmount'].sum()
            if len(subset) >= 3 and _SKLEARN_AVAILABLE:
                X = subset.index.values.reshape(-1, 1)
                y = subset.values
                model = LinearRegression().fit(X, y)
                slope = float(model.coef_[0])
                r2 = float(r2_score(y, model.predict(X)))
            else:
                slope = 0.0
                r2 = 0.0
            trend_data.append({'category': cat_name, 'revenueTrend': slope, 'trendR2': r2})
        trend_df = pd.DataFrame(trend_data)
        cat = cat.merge(trend_df, on='category', how='left')

        # ── Z-score composite performance ──────────────────────────────────────
        if len(cat) >= 2:
            z_rev = zscore(cat['revenue'].fillna(0))
            z_qty = zscore(cat['quantity'].fillna(0))
            z_ord = zscore(cat['orders'].fillna(0))
            cat['performanceScore'] = ((z_rev * 0.5) + (z_qty * 0.3) + (z_ord * 0.2)).round(4)
        else:
            cat['performanceScore'] = 0.0

        # ── Classify ──────────────────────────────────────────────────────────
        def classify(score):
            if score > 0.75: return 'TOP'
            if score < -0.75: return 'LOW'
            return 'MID'
        cat['moverClass'] = cat['performanceScore'].apply(classify)

        # ── Peak time per category ────────────────────────────────────────────
        df['hour'] = df['date'].dt.hour
        df['weekday'] = df['date'].dt.day_name()

        peak_hour_df = (
            df.groupby(['category', 'hour'])['totalAmount'].sum()
            .reset_index()
            .sort_values('totalAmount', ascending=False)
            .drop_duplicates('category')
            .rename(columns={'hour': 'peakHour', 'totalAmount': 'peakHourRevenue'})
        )
        peak_day_df = (
            df.groupby(['category', 'weekday'])['totalAmount'].sum()
            .reset_index()
            .sort_values('totalAmount', ascending=False)
            .drop_duplicates('category')
            .rename(columns={'weekday': 'peakWeekday', 'totalAmount': 'peakWeekdayRevenue'})
        )

        cat = (
            cat
            .merge(peak_hour_df[['category', 'peakHour', 'peakHourRevenue']], on='category', how='left')
            .merge(peak_day_df[['category', 'peakWeekday', 'peakWeekdayRevenue']], on='category', how='left')
        )
        cat.fillna({'peakHour': -1, 'peakHourRevenue': 0, 'peakWeekday': 'N/A', 'peakWeekdayRevenue': 0}, inplace=True)

        # ── Zero movers (stock present, zero sales) ───────────────────────────
        sold_codes = set()
        if 'code' in df.columns:
            sold_codes = set(df['code'].dropna().astype(str).str.strip())

        zero_summary = {'byCategory': [], 'totalZeroSkus': 0, 'items': []}
        if self.stock_df is not None and 'code' in self.stock_df.columns:
            sc = self.stock_df[self.stock_df['category'].notna()].copy()
            sc['code'] = sc['code'].astype(str).str.strip()
            qty_col = next((c for c in ['quantity', 'Main Stock'] if c in sc.columns), None)
            in_stock = sc[sc[qty_col] > 0] if qty_col else sc
            zero_df = in_stock[~in_stock['code'].isin(sold_codes)].copy()
            if not zero_df.empty:
                agg_c = {'code': 'count'}
                if qty_col:
                    agg_c[qty_col] = 'sum'
                zbc = (
                    zero_df.groupby('category', as_index=False).agg(agg_c)
                    .rename(columns={'code': 'zeroSkus', qty_col: 'stockedQty'} if qty_col else {'code': 'zeroSkus'})
                    .sort_values('zeroSkus', ascending=False)
                )
                item_cols = ['code', 'category'] + ([qty_col] if qty_col else []) + (['salePrice'] if 'salePrice' in zero_df.columns else [])
                items = (
                    zero_df[item_cols]
                    .sort_values(qty_col if qty_col else 'category', ascending=False)
                    .head(50).fillna('').to_dict('records')
                )
                zero_summary = {
                    'byCategory': zbc.to_dict('records'),
                    'totalZeroSkus': int(len(zero_df)),
                    'items': items,
                }

        cat_sorted = cat.sort_values('performanceScore', ascending=False)

        return {
            'categories': cat_sorted.to_dict('records'),
            'totalRevenue': total_revenue,
            'topMovers': cat_sorted[cat_sorted['moverClass'] == 'TOP'].to_dict('records'),
            'midMovers': cat_sorted[cat_sorted['moverClass'] == 'MID'].to_dict('records'),
            'lowMovers': cat_sorted[cat_sorted['moverClass'] == 'LOW'].to_dict('records'),
            'zeroMovers': zero_summary,
            'classificationMethod': 'Z-score composite (revenue 50%, quantity 30%, orders 20%)',
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_forecasting(self) -> Dict[str, Any]:
        """
        30-day revenue forecast using:
        1. Linear trend regression on daily revenue (captures macro trend)
        2. Day-of-week seasonal multipliers (Mon–Fri pattern)
        3. Exponential Smoothing (if statsmodels available) for additional accuracy
        Outputs point forecast + 80% / 95% confidence intervals.
        """
        df = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df['day'] = df['date'].dt.date

        daily = (
            df.groupby('day', as_index=False)
            .agg(revenue=('totalAmount', 'sum'), orders=('number', 'nunique'))
            .sort_values('day')
        )
        daily['day'] = pd.to_datetime(daily['day'])
        daily['day_num'] = (daily['day'] - daily['day'].min()).dt.days
        daily['weekday'] = daily['day'].dt.day_name()

        if len(daily) < 5:
            return {'error': 'Insufficient data for forecasting (need ≥ 5 days)', 'forecastDays': []}

        # ── Day-of-week seasonal index ─────────────────────────────────────────
        weekday_avg = daily.groupby('weekday')['revenue'].mean()
        global_avg = daily['revenue'].mean()
        seasonal_index = (weekday_avg / global_avg).to_dict()

        # ── Linear trend component ─────────────────────────────────────────────
        X = daily['day_num'].values.reshape(-1, 1)
        y = daily['revenue'].values

        if _SKLEARN_AVAILABLE:
            model = LinearRegression().fit(X, y)
            trend_slope = float(model.coef_[0])
            trend_intercept = float(model.intercept_)
            y_pred_train = model.predict(X)
            r2 = float(r2_score(y, y_pred_train))
        else:
            # Fallback: numpy polyfit
            coeffs = np.polyfit(daily['day_num'], y, 1)
            trend_slope = float(coeffs[0])
            trend_intercept = float(coeffs[1])
            y_pred_train = trend_slope * daily['day_num'].values + trend_intercept
            ss_res = np.sum((y - y_pred_train) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0

        residuals = y - y_pred_train
        residual_std = float(np.std(residuals))

        # ── Exponential Smoothing (if available) ──────────────────────────────
        ets_forecast = None
        if _STATSMODELS_AVAILABLE and len(daily) >= 14:
            try:
                es_model = ExponentialSmoothing(
                    daily['revenue'].values,
                    trend='add',
                    seasonal=None,  # too few data for seasonal ES
                    initialization_method='estimated'
                ).fit(optimized=True)
                ets_forecast = es_model.forecast(30)
            except Exception:
                ets_forecast = None

        # ── Build 30-day forecast ─────────────────────────────────────────────
        last_day_num = int(daily['day_num'].max())
        last_date = daily['day'].max()
        forecast_days = []
        # Cycle through weekdays (only Mon–Fri since store is closed on weekends)
        current_date = last_date + timedelta(days=1)
        working_day_count = 0

        for i in range(60):  # iterate up to 60 calendar days to get 30 working days
            if current_date.day_name() in ['Saturday', 'Sunday']:
                current_date += timedelta(days=1)
                continue

            future_day_num = last_day_num + (current_date - last_date).days
            trend_base = trend_slope * future_day_num + trend_intercept
            seasonal_mult = seasonal_index.get(current_date.day_name(), 1.0)
            point_forecast = max(0.0, trend_base * seasonal_mult)

            # If ETS available, blend 60/40 trend+ETS
            if ets_forecast is not None and working_day_count < len(ets_forecast):
                ets_val = float(max(0.0, ets_forecast[working_day_count]))
                point_forecast = 0.6 * point_forecast + 0.4 * ets_val

            # Confidence intervals (z * std, adjusted for forecast distance)
            horizon_factor = 1.0 + 0.05 * working_day_count  # widens over time
            ci80 = 1.28 * residual_std * horizon_factor
            ci95 = 1.96 * residual_std * horizon_factor

            forecast_days.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'weekday': current_date.day_name(),
                'forecast': round(point_forecast, 2),
                'ci80Low': round(max(0, point_forecast - ci80), 2),
                'ci80High': round(point_forecast + ci80, 2),
                'ci95Low': round(max(0, point_forecast - ci95), 2),
                'ci95High': round(point_forecast + ci95, 2),
                'forecastDay': working_day_count + 1,
            })

            current_date += timedelta(days=1)
            working_day_count += 1
            if working_day_count >= 30:
                break

        # ── Summary ───────────────────────────────────────────────────────────
        forecast_revenues = [d['forecast'] for d in forecast_days]
        total_30d_forecast = sum(forecast_revenues)

        # Category-level trend signals
        category_trends = []
        for cat_name in self.sales_df['category'].dropna().unique():
            cat_daily = df[df['category'] == cat_name].groupby('day_num' if 'day_num' in df.columns else 'day')['totalAmount'].sum()
            if len(cat_daily) >= 3 and _SKLEARN_AVAILABLE:
                X_c = np.array(range(len(cat_daily))).reshape(-1, 1)
                y_c = cat_daily.values
                m = LinearRegression().fit(X_c, y_c)
                slope_c = float(m.coef_[0])
                r2_c = float(r2_score(y_c, m.predict(X_c)))
                direction = 'GROWING' if slope_c > 1 else ('DECLINING' if slope_c < -1 else 'STABLE')
            else:
                slope_c = 0.0
                r2_c = 0.0
                direction = 'STABLE'
            category_trends.append({
                'category': cat_name,
                'dailyTrendSlope': round(slope_c, 2),
                'trendR2': round(r2_c, 3),
                'direction': direction,
            })

        category_trends.sort(key=lambda x: x['dailyTrendSlope'], reverse=True)

        return {
            'forecastDays': forecast_days,
            'summary': {
                'total30dForecast': round(total_30d_forecast, 2),
                'avgDailyForecast': round(total_30d_forecast / 30, 2),
                'trendSlope': round(trend_slope, 2),
                'trendR2': round(r2, 3),
                'modelAccuracy': 'HIGH' if r2 > 0.6 else ('MEDIUM' if r2 > 0.3 else 'LOW'),
                'etsBelended': ets_forecast is not None,
                'dataPoints': len(daily),
            },
            'categoryTrends': category_trends,
            'historicalDaily': daily.assign(day=daily['day'].dt.strftime('%Y-%m-%d'))[['day', 'revenue', 'orders', 'weekday']].to_dict('records'),
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_bcg_matrix(self) -> Dict[str, Any]:
        """
        BCG Matrix clustering of categories:
          STAR        — High growth, high revenue share
          CASH COW    — Low growth, high revenue share
          QUESTION MARK — High growth, low revenue share
          DOG         — Low growth, low revenue share

        Revenue share = category revenue / total revenue
        Growth rate   = linear slope of daily revenue for this category
        K-Means (k=4) clustering in (growth, share) space.
        """
        df = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df['day_num'] = (df['date'] - df['date'].min()).dt.days

        cat_revenue = df.groupby('category')['totalAmount'].sum()
        total_revenue = float(cat_revenue.sum())

        records = []
        for cat_name, rev in cat_revenue.items():
            subset = df[df['category'] == cat_name].groupby('day_num')['totalAmount'].sum()
            if len(subset) >= 3 and _SKLEARN_AVAILABLE:
                X = np.array(range(len(subset))).reshape(-1, 1)
                m = LinearRegression().fit(X, subset.values)
                slope = float(m.coef_[0])
            else:
                slope = 0.0

            revenue_share = float(rev / total_revenue * 100)
            records.append({
                'category': cat_name,
                'revenue': float(rev),
                'revenueShare': round(revenue_share, 2),
                'growthSlope': round(slope, 2),
            })

        if not records:
            return {'matrix': [], 'error': 'Insufficient data'}

        records_df = pd.DataFrame(records)

        # Normalise for clustering
        if _SKLEARN_AVAILABLE and len(records_df) >= 4:
            scaler = StandardScaler()
            features = scaler.fit_transform(records_df[['revenueShare', 'growthSlope']].fillna(0))
            n_clusters = min(4, len(records_df))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit(features)
            records_df['cluster'] = kmeans.labels_

            # Label clusters by their centroid position in (share, growth) space
            cluster_centers = pd.DataFrame(
                scaler.inverse_transform(kmeans.cluster_centers_),
                columns=['revenueShare', 'growthSlope']
            )

            def label_cluster(share, growth):
                share_median = records_df['revenueShare'].median()
                growth_median = records_df['growthSlope'].median()
                if share >= share_median and growth >= growth_median:
                    return 'STAR'
                elif share >= share_median and growth < growth_median:
                    return 'CASH_COW'
                elif share < share_median and growth >= growth_median:
                    return 'QUESTION_MARK'
                else:
                    return 'DOG'

            cluster_labels = {
                i: label_cluster(row['revenueShare'], row['growthSlope'])
                for i, row in cluster_centers.iterrows()
            }
            records_df['bcgLabel'] = records_df['cluster'].map(cluster_labels)
        else:
            # Fallback: simple quadrant classification
            share_median = records_df['revenueShare'].median()
            growth_median = records_df['growthSlope'].median()
            def classify_bcg(row):
                if row['revenueShare'] >= share_median and row['growthSlope'] >= growth_median:
                    return 'STAR'
                elif row['revenueShare'] >= share_median:
                    return 'CASH_COW'
                elif row['growthSlope'] >= growth_median:
                    return 'QUESTION_MARK'
                else:
                    return 'DOG'
            records_df['bcgLabel'] = records_df.apply(classify_bcg, axis=1)

        # Quadrant thresholds for charting
        share_median = float(records_df['revenueShare'].median())
        growth_median = float(records_df['growthSlope'].median())

        matrix_records = records_df.drop(columns=['cluster'], errors='ignore').to_dict('records')

        # Summary counts
        label_counts = records_df['bcgLabel'].value_counts().to_dict()

        return {
            'matrix': matrix_records,
            'quadrantThresholds': {
                'shareMedian': share_median,
                'growthMedian': growth_median,
            },
            'labelCounts': label_counts,
            'labels': {
                'STAR': 'High share, high growth — invest & double down',
                'CASH_COW': 'High share, slowing — milk for margin, maintain stock',
                'QUESTION_MARK': 'Low share, growing — monitor, selective investment',
                'DOG': 'Low share, declining — clearance candidate or discontinue',
            },
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_inventory_intelligence(self) -> Dict[str, Any]:
        """
        Inventory IQ per category:
        - Sales velocity (units/day)
        - Days of supply remaining at current pace
        - Inventory turnover rate
        - Reorder urgency signal
        """
        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()

        # Working days in the period
        working_days = df_sales['date'].dt.date.nunique()
        if working_days == 0:
            return {'error': 'No sales data'}

        cat_qty_sold = df_sales.groupby('category')['quantity'].sum().rename('qtySold')
        cat_orders = df_sales.groupby('category')['number'].nunique().rename('orderCount')

        # Stock on hand
        if self.stock_df is None or 'category' not in self.stock_df.columns:
            return {'error': 'Stock data not available'}

        qty_col = next((c for c in ['quantity', 'Main Stock'] if c in self.stock_df.columns), None)
        if qty_col:
            cat_stock = self.stock_df.groupby('category')[qty_col].sum().rename('stockQty')
        else:
            return {'error': 'No quantity column found in stock data'}

        sku_counts = self.stock_df.groupby('category')['code'].nunique().rename('totalSkus') if 'code' in self.stock_df.columns else pd.Series(dtype=float)

        merged = pd.concat([cat_qty_sold, cat_orders, cat_stock, sku_counts], axis=1).fillna(0)
        merged = merged[merged['stockQty'] > 0].copy()  # only categories with stock
        merged.index.name = 'category'
        merged = merged.reset_index()

        merged['velocityPerDay'] = (merged['qtySold'] / working_days).round(3)
        merged['daysOfSupply'] = np.where(
            merged['velocityPerDay'] > 0,
            (merged['stockQty'] / merged['velocityPerDay']).round(1),
            9999  # sentinel: never runs out if no sales
        )
        merged['turnoverRate'] = np.where(
            merged['stockQty'] > 0,
            (merged['qtySold'] / merged['stockQty']).round(3),
            0.0
        )

        def urgency(dos):
            if dos <= 7: return 'CRITICAL'
            if dos <= 14: return 'HIGH'
            if dos <= 30: return 'MEDIUM'
            if dos == 9999: return 'STAGNANT'
            return 'OK'

        merged['reorderUrgency'] = merged['daysOfSupply'].apply(urgency)
        merged_sorted = merged.sort_values('daysOfSupply')

        # Avg price per unit
        if 'salePrice' in self.stock_df.columns:
            avg_price = self.stock_df.groupby('category')['salePrice'].mean().rename('avgSalePrice').reset_index()
            merged_sorted = merged_sorted.merge(avg_price, on='category', how='left')
            merged_sorted['stockValue'] = (merged_sorted['stockQty'] * merged_sorted['avgSalePrice']).round(2)

        return {
            'inventoryData': merged_sorted.fillna(0).to_dict('records'),
            'workingDaysAnalyzed': working_days,
            'summary': {
                'criticalCategories': int((merged_sorted['reorderUrgency'] == 'CRITICAL').sum()),
                'highUrgency': int((merged_sorted['reorderUrgency'] == 'HIGH').sum()),
                'stagnantCategories': int((merged_sorted['reorderUrgency'] == 'STAGNANT').sum()),
                'avgTurnoverRate': float(merged_sorted['turnoverRate'][merged_sorted['turnoverRate'] > 0].mean()) if not merged_sorted.empty else 0,
            }
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_anomalies(self) -> Dict[str, Any]:
        """
        Detects anomalous days (revenue spikes / crashes) using Z-score.
        |Z| > 2 = moderate anomaly,  |Z| > 3 = severe anomaly.
        Also detects anomalous hours and flags probable causes.
        """
        df = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df['day'] = df['date'].dt.date

        daily = (
            df.groupby('day', as_index=False)
            .agg(revenue=('totalAmount', 'sum'), orders=('number', 'nunique'))
            .sort_values('day')
        )

        if len(daily) < 5:
            return {'anomalies': [], 'error': 'Insufficient data for anomaly detection'}

        daily['z_revenue'] = zscore(daily['revenue'])
        daily['z_orders'] = zscore(daily['orders'])

        def classify_anomaly(z_rev, z_ord):
            if abs(z_rev) > 3:
                return 'SEVERE_SPIKE' if z_rev > 0 else 'SEVERE_CRASH'
            if abs(z_rev) > 2:
                return 'SPIKE' if z_rev > 0 else 'CRASH'
            if abs(z_ord) > 2:
                return 'ORDER_SURGE' if z_ord > 0 else 'ORDER_DROP'
            return 'NORMAL'

        daily['anomalyType'] = daily.apply(lambda r: classify_anomaly(r['z_revenue'], r['z_orders']), axis=1)
        daily['weekday'] = pd.to_datetime(daily['day']).dt.day_name()

        anomalies = daily[daily['anomalyType'] != 'NORMAL'].copy()

        # Most active categories on anomaly days
        enriched_anomalies = []
        for _, row in anomalies.iterrows():
            day_df = df[df['day'] == row['day']]
            top_cat = day_df.groupby('category')['totalAmount'].sum().idxmax() if not day_df.empty else None
            enriched_anomalies.append({
                'date': str(row['day']),
                'weekday': row['weekday'],
                'revenue': float(row['revenue']),
                'orders': int(row['orders']),
                'zScore': round(float(row['z_revenue']), 2),
                'anomalyType': row['anomalyType'],
                'topCategory': top_cat,
            })

        # Hourly anomalies
        df['hour'] = df['date'].dt.hour
        hourly = (
            df.groupby('hour', as_index=False)
            .agg(revenue=('totalAmount', 'sum'), orders=('number', 'nunique'))
        )
        if len(hourly) >= 3:
            hourly['z'] = zscore(hourly['revenue'])
            hourly_anomalies = hourly[abs(hourly['z']) > 2][['hour', 'revenue', 'orders', 'z']].to_dict('records')
        else:
            hourly_anomalies = []

        # Rolling 7-day average for trend smoothing
        daily_sorted = daily.sort_values('day')
        daily_sorted['rolling7d'] = daily_sorted['revenue'].rolling(7, min_periods=1).mean().round(2)

        return {
            'anomalies': enriched_anomalies,
            'hourlyAnomalies': hourly_anomalies,
            'dailyWithRolling': daily_sorted.assign(day=daily_sorted['day'].astype(str))[
                ['day', 'revenue', 'orders', 'rolling7d', 'z_revenue', 'anomalyType']
            ].to_dict('records'),
            'summary': {
                'totalAnomalies': len(enriched_anomalies),
                'severeSpikes': len([a for a in enriched_anomalies if 'SEVERE_SPIKE' in a['anomalyType']]),
                'crashes': len([a for a in enriched_anomalies if 'CRASH' in a['anomalyType']]),
            },
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_price_performance(self) -> Dict[str, Any]:
        """
        Price elasticity signals per category:
        - Correlation between sale price and quantity sold per SKU
        - Price elasticity coefficient (% change in qty / % change in price) estimated per category
        - Identifies over-priced (low turnover, high price) and under-priced (high turnover, low price) items
        """
        if self.stock_df is None:
            return {'error': 'Stock data needed for price analysis'}

        df_sales = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        stock = self.stock_df.copy()

        if 'code' not in stock.columns or 'salePrice' not in stock.columns:
            return {'error': 'Stock data missing code or salePrice columns'}

        # Sales quantity per SKU code
        sku_sales = df_sales.groupby('code')['quantity'].sum().reset_index().rename(columns={'quantity': 'qtySold'}) if 'code' in df_sales.columns else pd.DataFrame()

        if sku_sales.empty:
            return {'error': 'No SKU-level sales data available'}

        sku_data = stock[['code', 'category', 'salePrice', 'purchasePrice']].copy() if 'purchasePrice' in stock.columns else stock[['code', 'category', 'salePrice']].copy()
        sku_data = sku_data.merge(sku_sales, on='code', how='left').fillna({'qtySold': 0})
        sku_data['salePrice'] = pd.to_numeric(sku_data['salePrice'], errors='coerce')
        sku_data = sku_data[sku_data['salePrice'] > 0]

        if 'purchasePrice' in sku_data.columns:
            sku_data['purchasePrice'] = pd.to_numeric(sku_data['purchasePrice'], errors='coerce')
            sku_data['margin'] = ((sku_data['salePrice'] - sku_data['purchasePrice']) / sku_data['salePrice'] * 100).round(1)
        else:
            sku_data['margin'] = np.nan

        # Per-category elasticity and correlation
        category_elasticity = []
        for cat_name in sku_data['category'].dropna().unique():
            cat_df = sku_data[sku_data['category'] == cat_name].copy()
            if len(cat_df) < 3:
                continue

            price_arr = cat_df['salePrice'].values
            qty_arr = cat_df['qtySold'].values

            if np.std(price_arr) > 0 and np.std(qty_arr) > 0:
                r, p_val = stats.pearsonr(price_arr, qty_arr)
                correlation = round(float(r), 3)
                p_value = round(float(p_val), 4)
            else:
                correlation = 0.0
                p_value = 1.0

            # Simple price bucket analysis — guard against too few distinct prices
            _all_labels = ['Low', 'Mid', 'High']
            _n_quantiles = min(3, len(cat_df))
            try:
                # Count how many unique quantile edges qcut will actually produce
                _edges = pd.qcut(cat_df['salePrice'], q=_n_quantiles, retbins=True, duplicates='drop')[1]
                _n_bins = len(_edges) - 1
                _labels = _all_labels[:_n_bins] if _n_bins > 0 else False
                if _n_bins > 0:
                    cat_df['priceBucket'] = pd.qcut(cat_df['salePrice'], q=_n_quantiles, labels=_labels, duplicates='drop')
                else:
                    cat_df['priceBucket'] = 'Low'
            except Exception:
                # Absolute fallback: equal-width cut, no labels needed
                cat_df['priceBucket'] = pd.cut(cat_df['salePrice'], bins=min(3, cat_df['salePrice'].nunique() or 1), labels=False)
            bucket_stats = cat_df.groupby('priceBucket', observed=True)['qtySold'].mean().to_dict()

            # Identify over/under-priced SKUs within category
            # zscore() always returns ndarray; use np.asarray to normalise the fallback too
            price_z = np.asarray(zscore(cat_df['salePrice']))
            qty_std = cat_df['qtySold'].std()
            qty_z = np.asarray(zscore(cat_df['qtySold'])) if qty_std > 0 else np.zeros(len(cat_df))
            cat_df = cat_df.copy()  # avoid SettingWithCopyWarning
            cat_df['priceZ'] = price_z
            cat_df['qtyZ'] = qty_z

            # Over-priced: high price Z, very low qty Z (likely due to high price)
            overpriced = cat_df[(cat_df['priceZ'] > 1) & (cat_df['qtyZ'] < -0.5)][['code', 'salePrice', 'qtySold']].head(3)
            underpriced = cat_df[(cat_df['priceZ'] < -0.5) & (cat_df['qtyZ'] > 1)][['code', 'salePrice', 'qtySold']].head(3)

            category_elasticity.append({
                'category': cat_name,
                'skuCount': int(len(cat_df)),
                'priceQtyCorrelation': correlation,
                'pValue': p_value,
                'elasticitySignal': (
                    'ELASTIC' if correlation < -0.3 and p_value < 0.1 else
                    'INELASTIC' if correlation > 0.3 else 'NEUTRAL'
                ),
                'avgPrice': round(float(cat_df['salePrice'].mean()), 2),
                'medianPrice': round(float(cat_df['salePrice'].median()), 2),
                'avgMargin': round(float(cat_df['margin'].mean()), 1) if 'margin' in cat_df.columns else None,
                'priceBucketSales': {str(k): round(float(v), 1) for k, v in bucket_stats.items()},
                'overpricedSkus': overpriced.to_dict('records'),
                'underpricedSkus': underpriced.to_dict('records'),
            })

        category_elasticity.sort(key=lambda x: abs(x['priceQtyCorrelation']), reverse=True)

        return {
            'categoryElasticity': category_elasticity,
            'insight': {
                'elasticCategories': [c['category'] for c in category_elasticity if c['elasticitySignal'] == 'ELASTIC'],
                'inelasticCategories': [c['category'] for c in category_elasticity if c['elasticitySignal'] == 'INELASTIC'],
            }
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_seasonality_heatmap(self) -> Dict[str, Any]:
        """
        Hour × Weekday revenue heatmap globally and per category.
        Also computes best/worst time slots and time-of-day category preferences.
        """
        df = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
        df['hour'] = df['date'].dt.hour
        df['weekday'] = df['date'].dt.day_name()

        HOUR_LABELS = {h: f'{h:02d}:00' for h in range(24)}
        WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

        # Global heatmap
        global_hm = (
            df.groupby(['weekday', 'hour'])['totalAmount'].sum()
            .reset_index()
            .rename(columns={'totalAmount': 'revenue'})
        )
        global_hm['hour_label'] = global_hm['hour'].map(HOUR_LABELS)

        # Category time preferences
        cat_time = (
            df.groupby(['category', 'hour'])['totalAmount'].sum()
            .reset_index()
            .sort_values('totalAmount', ascending=False)
        )
        cat_peak_hours = (
            cat_time
            .groupby('category')
            .apply(lambda g: g.nlargest(3, 'totalAmount')[['hour', 'totalAmount']].to_dict('records'))
            .reset_index()
            .rename(columns={0: 'peakHours'})
        )

        # Best hour overall
        hour_totals = df.groupby('hour')['totalAmount'].sum()
        best_hour = int(hour_totals.idxmax()) if not hour_totals.empty else -1
        worst_hour = int(hour_totals.idxmin()) if not hour_totals.empty else -1

        # Best weekday
        wd_totals = df[df['weekday'].isin(WEEKDAY_ORDER)].groupby('weekday')['totalAmount'].sum()
        best_weekday = wd_totals.idxmax() if not wd_totals.empty else 'N/A'
        worst_weekday = wd_totals.idxmin() if not wd_totals.empty else 'N/A'

        # Time slot buckets
        df['slot'] = pd.cut(df['hour'], bins=[0, 12, 17, 21, 24], labels=['Morning (0-12)', 'Afternoon (12-17)', 'Evening (17-21)', 'Night (21+)'], right=False)
        slot_revenue = df.groupby('slot', observed=True)['totalAmount'].sum().reset_index()

        # Category × slot matrix
        cat_slot = (
            df.groupby(['category', 'slot'], observed=True)['totalAmount'].sum()
            .reset_index()
            .pivot(index='category', columns='slot', values='totalAmount')
            .fillna(0)
            .reset_index()
        )

        return {
            'globalHeatmap': global_hm.to_dict('records'),
            'slotRevenue': slot_revenue.rename(columns={'totalAmount': 'revenue', 'slot': 'timeSlot'}).to_dict('records'),
            'categorySlotMatrix': cat_slot.to_dict('records'),
            'summary': {
                'bestHour': best_hour,
                'worstHour': worst_hour,
                'bestWeekday': best_weekday,
                'worstWeekday': worst_weekday,
            },
        }

    # ──────────────────────────────────────────────────────────────────────────

    def analyze_intelligence_summary(self) -> Dict[str, Any]:
        """
        Synthesises insights from all other modules into a prioritised
        action list and an executive summary paragraph.
        Uses rule-based reasoning on computed metrics (no LLM required).
        """
        insights = []
        warnings_list = []
        opportunities = []

        try:
            df = self.sales_df[self.sales_df['status'] == 'fulfilled'].copy()
            total_rev = float(df['totalAmount'].sum())
            working_days = df['date'].dt.date.nunique()

            # Revenue trend
            if working_days >= 5 and _SKLEARN_AVAILABLE:
                df['day_num'] = (df['date'] - df['date'].min()).dt.days
                daily = df.groupby('day_num')['totalAmount'].sum()
                X = daily.index.values.reshape(-1, 1)
                m = LinearRegression().fit(X, daily.values)
                slope = float(m.coef_[0])
                if slope > 0:
                    insights.append({'type': 'POSITIVE', 'area': 'Revenue Trend', 'message': f'Overall revenue is growing at ₹{slope:.0f}/day. Momentum is positive.'})
                else:
                    warnings_list.append({'type': 'WARNING', 'area': 'Revenue Trend', 'message': f'Revenue is declining at ₹{abs(slope):.0f}/day. Investigate top categories.'})

            # Top category concentration
            cat_rev = df.groupby('category')['totalAmount'].sum()
            if not cat_rev.empty:
                top_cat_share = float(cat_rev.max() / total_rev * 100)
                top_cat_name = cat_rev.idxmax()
                if top_cat_share > 40:
                    warnings_list.append({'type': 'WARNING', 'area': 'Concentration Risk', 'message': f'{top_cat_name} accounts for {top_cat_share:.1f}% of revenue — high concentration risk. Diversify.'})
                else:
                    insights.append({'type': 'POSITIVE', 'area': 'Revenue Diversification', 'message': f'Revenue is well-diversified. Top category ({top_cat_name}) = {top_cat_share:.1f}%.'})

            # Dead stock
            if self.stock_df is not None and 'code' in self.stock_df.columns:
                qty_col = next((c for c in ['quantity', 'Main Stock'] if c in self.stock_df.columns), None)
                if qty_col:
                    sold_codes = set(df.get('code', pd.Series()).dropna().astype(str))
                    zero_count = int(self.stock_df[~self.stock_df['code'].astype(str).isin(sold_codes) & (self.stock_df[qty_col] > 0)].shape[0])
                    total_skus = int(self.stock_df['code'].nunique())
                    if zero_count > 0:
                        pct = zero_count / total_skus * 100
                        warnings_list.append({'type': 'WARNING', 'area': 'Zero-Moving Stock', 'message': f'{zero_count} SKUs ({pct:.1f}%) have stock but zero sales. Initiate clearance strategy.'})
                        opportunities.append({'type': 'OPPORTUNITY', 'area': 'Inventory Recovery', 'message': f'Run promotions or mark-downs on {zero_count} non-moving SKUs to recover capital.'})

            # AOV trend
            bill_rev = df.groupby('number')['totalAmount'].sum()
            avg_aov = float(bill_rev.mean())
            if avg_aov > 0:
                insights.append({'type': 'INFO', 'area': 'Average Order Value', 'message': f'Current AOV is ₹{avg_aov:.0f}. Cross-selling or combo deals can increase this.'})

            # Peak hour utilisation
            df['hour'] = df['date'].dt.hour
            hour_sales = df.groupby('hour')['totalAmount'].sum()
            peak_hour = int(hour_sales.idxmax()) if not hour_sales.empty else -1
            slow_hours = hour_sales[hour_sales < hour_sales.mean() * 0.5].index.tolist()
            if slow_hours:
                opportunities.append({'type': 'OPPORTUNITY', 'area': 'Slow Hours', 'message': f'Hours {slow_hours} generate <50% of average revenue. Consider time-based promotions.'})

        except Exception as e:
            warnings_list.append({'type': 'ERROR', 'area': 'Intelligence Summary', 'message': f'Partial compute failure: {str(e)}'})

        all_signals = insights + warnings_list + opportunities
        priority_order = {'WARNING': 0, 'OPPORTUNITY': 1, 'POSITIVE': 2, 'INFO': 3, 'ERROR': 4}
        all_signals.sort(key=lambda x: priority_order.get(x['type'], 9))

        return {
            'signals': all_signals,
            'counts': {
                'warnings': len(warnings_list),
                'opportunities': len(opportunities),
                'positives': len(insights),
            },
            'generatedAt': datetime.now().isoformat(),
        }

    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _safe_run(fn, module_name: str, retries: int = 2, backoff: float = 0.4):
        """
        Execute fn() with automatic retry on transient errors.
        Returns (result, None) on success or (error_stub, error_message) on all failures.
        Uses exponential back-off: waits backoff * 2^attempt seconds between tries.
        """
        import time
        last_err = None
        for attempt in range(retries + 1):
            try:
                return fn(), None
            except MemoryError:
                # Never retry memory errors — escalate immediately
                raise
            except Exception as exc:
                last_err = exc
                if attempt < retries:
                    wait = backoff * (2 ** attempt)
                    logger.warning(
                        f"[{module_name}] attempt {attempt + 1}/{retries + 1} failed "
                        f"({type(exc).__name__}: {exc}) — retrying in {wait:.1f}s"
                    )
                    time.sleep(wait)
                else:
                    logger.error(
                        f"[{module_name}] all {retries + 1} attempts failed: "
                        f"{type(last_err).__name__}: {last_err}\n"
                        + "".join(__import__("traceback").format_tb(last_err.__traceback__))
                    )
        stub = {
            "_error": True,
            "_module": module_name,
            "_errorType": type(last_err).__name__,
            "_errorMessage": str(last_err),
        }
        return stub, str(last_err)

    def generate_comprehensive_analysis(self) -> Dict[str, Any]:
        """
        Generate complete analysis from all loaded reports — v4.0 with full ML intelligence.

        Design contract
        ───────────────
        • Every sub-analysis is isolated: one failure NEVER kills the whole report.
        • Each module gets up to 3 attempts (1 initial + 2 retries) with 0.4s/0.8s back-off.
        • Failed modules surface a structured ``{"_error": true, ...}`` stub so the
          frontend can display a graceful degraded state instead of crashing.
        • The top-level ``metadata.moduleErrors`` dict lists every module that failed.
        """
        if self.sales_df is None or self.stock_df is None:
            raise ValueError("Stock and Sales reports must be loaded first")

        module_errors: Dict[str, str] = {}

        def safe(fn, name: str):
            result, err = self._safe_run(fn, name)
            if err:
                module_errors[name] = err
            return result

        result = {
            "metadata": {
                "salesPeriod": f"{self.sales_dates[0]} to {self.sales_dates[1]}",
                "stockPeriod": f"{self.stock_dates[0]} to {self.stock_dates[1]}",
                "analyzedAt": datetime.now().isoformat(),
                "salesRows": len(self.sales_df),
                "stockRows": len(self.stock_df),
                "deadStockRows": len(self.dead_stock_df) if self.dead_stock_df is not None else 0,
                "engineVersion": "4.0",
                "mlAvailable": _SKLEARN_AVAILABLE,
                "etsAvailable": _STATSMODELS_AVAILABLE,
            },
            # ── Core analytics (v1–v3) ─────────────────────────────────────────
            "salesOverview":        safe(self.analyze_sales_overview,       "salesOverview"),
            "categoryPerformance":  safe(self.analyze_category_performance, "categoryPerformance"),
            "dailyTrends":          safe(self.analyze_daily_trends,         "dailyTrends"),
            "paymentMethods":       safe(self.analyze_payment_methods,      "paymentMethods"),
            "hourlyPatterns":       safe(self.analyze_hourly_patterns,      "hourlyPatterns"),
            "stockMargins":         safe(self.analyze_stock_margins,        "stockMargins"),
            "customerLoyalty":      safe(self.analyze_customer_loyalty,     "customerLoyalty"),
            "genderDemographics":   safe(self.analyze_gender_demographics,  "genderDemographics"),
            "salePlace":            safe(self.analyze_sale_place,           "salePlace"),
            "weekdayPerformance":   safe(self.analyze_weekday_performance,  "weekdayPerformance"),
            "categoryGender":       safe(self.analyze_category_gender,      "categoryGender"),
            # ── Legacy movers (kept for backwards compat) ─────────────────────
            "movers":               safe(self.analyze_movers,               "movers"),
            # ── v4.0 Advanced ML Intelligence ─────────────────────────────────
            "advancedMovers":       safe(self.analyze_advanced_movers,      "advancedMovers"),
            "forecasting":          safe(self.analyze_forecasting,          "forecasting"),
            "bcgMatrix":            safe(self.analyze_bcg_matrix,           "bcgMatrix"),
            "inventoryIntelligence":safe(self.analyze_inventory_intelligence,"inventoryIntelligence"),
            "anomalyDetection":     safe(self.analyze_anomalies,            "anomalyDetection"),
            "pricePerformance":     safe(self.analyze_price_performance,    "pricePerformance"),
            "seasonalityHeatmap":   safe(self.analyze_seasonality_heatmap,  "seasonalityHeatmap"),
            "intelligenceSummary":  safe(self.analyze_intelligence_summary,  "intelligenceSummary"),
        }

        # Stamp any module errors into metadata so the frontend can surface them
        result["metadata"]["moduleErrors"] = module_errors
        result["metadata"]["moduleErrorCount"] = len(module_errors)
        if module_errors:
            logger.warning(
                f"[generate_comprehensive_analysis] {len(module_errors)} module(s) failed: "
                + ", ".join(module_errors.keys())
            )

        # Add Dead Stock analysis if file provided
        if self.dead_stock_df is not None:
            result["deadStockAnalysis"] = safe(self.analyze_dead_stock, "deadStockAnalysis")

        return result




def process_triple_reports(stock_file_bytes: bytes, stock_filename: str,
                          sales_file_bytes: bytes, sales_filename: str,
                          dead_stock_bytes: bytes = None, dead_stock_filename: str = None) -> Dict[str, Any]:
    """
    Main entry point for processing 3 reports
    """
    try:
        analyzer = ZenZebraAnalytics()

        # Load reports
        stock_status = analyzer.load_stock_report(stock_file_bytes, stock_filename)
        sales_status = analyzer.load_sales_report(sales_file_bytes, sales_filename)

        dead_status = None
        if dead_stock_bytes and dead_stock_filename:
            dead_status = analyzer.load_dead_stock_report(dead_stock_bytes, dead_stock_filename)

        # Generate comprehensive analysis
        results = analyzer.generate_comprehensive_analysis()

        results['loadStatus'] = {
            'stock': stock_status,
            'sales': sales_status,
            'deadStock': dead_status
        }

        return {
            "success": True,
            "data": results
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "errorType": type(e).__name__
        }
