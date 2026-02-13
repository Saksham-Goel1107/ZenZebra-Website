# -*- coding: utf-8 -*-
"""
ZenZebra Triple Report Analytics Engine
Processes Stock Report, Sales Report, and Dead Stock Report
"""

import pandas as pd
import numpy as np
import json
import re
from datetime import datetime
from typing import Dict, Any, Tuple, Optional, List
import warnings
import gender_guesser.detector as gender
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

    def generate_comprehensive_analysis(self) -> Dict[str, Any]:
        """Generate complete analysis from all reports"""
        if self.sales_df is None or self.stock_df is None:
            raise ValueError("Stock and Sales reports must be loaded first")

        result = {
            "metadata": {
                "salesPeriod": f"{self.sales_dates[0]} to {self.sales_dates[1]}",
                "stockPeriod": f"{self.stock_dates[0]} to {self.stock_dates[1]}",
                "analyzedAt": datetime.now().isoformat(),
                "salesRows": len(self.sales_df),
                "stockRows": len(self.stock_df),
                "deadStockRows": len(self.dead_stock_df) if self.dead_stock_df is not None else 0
            },
            "salesOverview": self.analyze_sales_overview(),
            "categoryPerformance": self.analyze_category_performance(),
            "dailyTrends": self.analyze_daily_trends(),
            "paymentMethods": self.analyze_payment_methods(),
            "hourlyPatterns": self.analyze_hourly_patterns(),
            "stockMargins": self.analyze_stock_margins(),
            "customerLoyalty": self.analyze_customer_loyalty(),
            "genderDemographics": self.analyze_gender_demographics(),
            "salePlace": self.analyze_sale_place(),
            "weekdayPerformance": self.analyze_weekday_performance(),
            "categoryGender": self.analyze_category_gender(),
        }

        # Add Dead Stock analysis if file provided
        if self.dead_stock_df is not None:
            result["deadStockAnalysis"] = self.analyze_dead_stock()

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
