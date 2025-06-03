"""
Alternative Data Sources Module for LendSmart

This module provides interfaces and implementations for collecting alternative data
from various sources to enhance credit scoring beyond traditional credit data.
"""

import os
import json
import logging
import requests
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('alternative_data_sources')

class DataSourceError(Exception):
    """Exception raised for errors in data source operations"""
    pass

class AlternativeDataSource(ABC):
    """Abstract base class for all alternative data sources"""
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the data source with configuration
        
        Args:
            config: Configuration dictionary for the data source
        """
        self.config = config or {}
        self.name = self.__class__.__name__
        self.last_fetch_time = None
        self.cache_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'data',
            'cache',
            self.name.lower()
        )
        os.makedirs(self.cache_dir, exist_ok=True)
    
    @abstractmethod
    def fetch_data(self, borrower_id: str, **kwargs) -> pd.DataFrame:
        """
        Fetch alternative data for a specific borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            **kwargs: Additional parameters for the data fetch
            
        Returns:
            DataFrame containing the alternative data
        """
        pass
    
    @abstractmethod
    def get_features(self) -> List[str]:
        """
        Get the list of features provided by this data source
        
        Returns:
            List of feature names
        """
        pass
    
    def cache_data(self, borrower_id: str, data: pd.DataFrame) -> None:
        """
        Cache the fetched data for future use
        
        Args:
            borrower_id: Unique identifier for the borrower
            data: DataFrame containing the data to cache
        """
        cache_file = os.path.join(self.cache_dir, f"{borrower_id}.json")
        
        # Create cache metadata
        cache_data = {
            "timestamp": datetime.now().isoformat(),
            "source": self.name,
            "borrower_id": borrower_id,
            "data": data.to_dict(orient="records") if not data.empty else []
        }
        
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        logger.info(f"Cached data for borrower {borrower_id} from {self.name}")
    
    def get_cached_data(self, borrower_id: str, max_age_days: int = 30) -> Optional[pd.DataFrame]:
        """
        Retrieve cached data for a borrower if available and not expired
        
        Args:
            borrower_id: Unique identifier for the borrower
            max_age_days: Maximum age of cached data in days
            
        Returns:
            DataFrame with cached data or None if not available/expired
        """
        cache_file = os.path.join(self.cache_dir, f"{borrower_id}.json")
        
        if not os.path.exists(cache_file):
            return None
        
        try:
            with open(cache_file, 'r') as f:
                cache_data = json.load(f)
            
            # Check cache age
            cache_time = datetime.fromisoformat(cache_data["timestamp"])
            age_days = (datetime.now() - cache_time).days
            
            if age_days > max_age_days:
                logger.info(f"Cached data for borrower {borrower_id} is {age_days} days old (max {max_age_days})")
                return None
            
            # Convert cached data back to DataFrame
            if cache_data["data"]:
                return pd.DataFrame(cache_data["data"])
            else:
                return pd.DataFrame()
                
        except Exception as e:
            logger.warning(f"Error reading cached data: {e}")
            return None


class DigitalFootprintDataSource(AlternativeDataSource):
    """
    Data source for digital footprint analysis
    
    Collects and analyzes data from digital sources such as:
    - Device information
    - Email usage patterns
    - Social media presence
    - Online behavior
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.api_key = self.config.get('api_key', os.environ.get('DIGITAL_FOOTPRINT_API_KEY', ''))
        self.api_url = self.config.get('api_url', 'https://api.digitalfootprint.example.com/v1')
        
        if not self.api_key:
            logger.warning("No API key provided for DigitalFootprintDataSource")
    
    def fetch_data(self, borrower_id: str, **kwargs) -> pd.DataFrame:
        """
        Fetch digital footprint data for a borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            **kwargs: Additional parameters:
                - email: Borrower's email address
                - device_id: Device identifier if available
                - ip_address: IP address if available
                
        Returns:
            DataFrame with digital footprint features
        """
        # Check for cached data first
        cached_data = self.get_cached_data(borrower_id)
        if cached_data is not None:
            logger.info(f"Using cached digital footprint data for borrower {borrower_id}")
            return cached_data
        
        # In a real implementation, this would call an actual API
        # For now, we'll simulate the API response
        logger.info(f"Fetching digital footprint data for borrower {borrower_id}")
        
        try:
            # Simulate API call delay and response
            # In production, this would be a real API call
            email = kwargs.get('email', f"{borrower_id}@example.com")
            
            # Generate synthetic data for demonstration
            data = {
                'email_domain_age_days': np.random.randint(30, 5000),
                'email_account_age_days': np.random.randint(30, 3000),
                'device_age_months': np.random.randint(1, 60),
                'device_os_version': f"{np.random.randint(10, 15)}.{np.random.randint(0, 9)}",
                'browser_type': np.random.choice(['Chrome', 'Firefox', 'Safari', 'Edge']),
                'social_media_accounts': np.random.randint(0, 6),
                'social_media_followers': np.random.randint(0, 5000),
                'online_shopping_frequency': np.random.choice(['low', 'medium', 'high']),
                'digital_subscription_count': np.random.randint(0, 10),
                'email_response_time_hours': np.random.uniform(1, 48),
                'has_professional_email': bool(np.random.binomial(1, 0.7)),
                'device_price_category': np.random.choice(['budget', 'mid-range', 'premium']),
                'typical_online_hours': np.random.choice(['morning', 'afternoon', 'evening', 'night']),
                'typical_geolocation_stability': np.random.uniform(0, 1)
            }
            
            # Convert categorical variables to numeric
            data['online_shopping_frequency_score'] = {
                'low': 0.3, 'medium': 0.6, 'high': 0.9
            }[data['online_shopping_frequency']]
            
            data['device_price_category_score'] = {
                'budget': 0.3, 'mid-range': 0.6, 'premium': 0.9
            }[data['device_price_category']]
            
            data['typical_online_hours_score'] = {
                'morning': 0.7, 'afternoon': 0.8, 'evening': 0.6, 'night': 0.4
            }[data['typical_online_hours']]
            
            # Create DataFrame
            df = pd.DataFrame([data])
            
            # Cache the data for future use
            self.cache_data(borrower_id, df)
            self.last_fetch_time = datetime.now()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching digital footprint data: {e}")
            raise DataSourceError(f"Failed to fetch digital footprint data: {e}")
    
    def get_features(self) -> List[str]:
        """
        Get the list of features provided by this data source
        
        Returns:
            List of feature names
        """
        return [
            'email_domain_age_days',
            'email_account_age_days',
            'device_age_months',
            'device_os_version',
            'browser_type',
            'social_media_accounts',
            'social_media_followers',
            'online_shopping_frequency',
            'online_shopping_frequency_score',
            'digital_subscription_count',
            'email_response_time_hours',
            'has_professional_email',
            'device_price_category',
            'device_price_category_score',
            'typical_online_hours',
            'typical_online_hours_score',
            'typical_geolocation_stability'
        ]


class TransactionDataSource(AlternativeDataSource):
    """
    Data source for transaction and cash flow analysis
    
    Analyzes banking and payment transaction data to derive insights about:
    - Income stability
    - Spending patterns
    - Cash flow management
    - Financial behavior
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.api_key = self.config.get('api_key', os.environ.get('TRANSACTION_API_KEY', ''))
        self.api_url = self.config.get('api_url', 'https://api.transactiondata.example.com/v1')
        
        if not self.api_key:
            logger.warning("No API key provided for TransactionDataSource")
    
    def fetch_data(self, borrower_id: str, **kwargs) -> pd.DataFrame:
        """
        Fetch transaction data for a borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            **kwargs: Additional parameters:
                - account_id: Banking account identifier if available
                - months: Number of months of history to fetch (default: 6)
                
        Returns:
            DataFrame with transaction-based features
        """
        # Check for cached data first
        cached_data = self.get_cached_data(borrower_id)
        if cached_data is not None:
            logger.info(f"Using cached transaction data for borrower {borrower_id}")
            return cached_data
        
        # In a real implementation, this would call an actual API
        # For now, we'll simulate the API response
        logger.info(f"Fetching transaction data for borrower {borrower_id}")
        
        try:
            # Simulate API call delay and response
            # In production, this would be a real API call
            months = kwargs.get('months', 6)
            
            # Generate synthetic data for demonstration
            base_income = np.random.uniform(3000, 8000)
            income_volatility = np.random.uniform(0, 0.3)
            
            # Generate monthly income with some volatility
            monthly_income = [
                base_income * (1 + np.random.uniform(-income_volatility, income_volatility))
                for _ in range(months)
            ]
            
            # Generate expense categories
            expense_categories = {
                'housing': np.random.uniform(0.2, 0.4),
                'utilities': np.random.uniform(0.05, 0.1),
                'food': np.random.uniform(0.1, 0.2),
                'transportation': np.random.uniform(0.05, 0.15),
                'entertainment': np.random.uniform(0.05, 0.15),
                'healthcare': np.random.uniform(0.02, 0.1),
                'debt_payments': np.random.uniform(0.05, 0.2),
                'savings': np.random.uniform(0, 0.2),
                'other': np.random.uniform(0.05, 0.1)
            }
            
            # Normalize expense percentages to sum to 1
            total = sum(expense_categories.values())
            expense_categories = {k: v/total for k, v in expense_categories.items()}
            
            # Calculate average monthly expenses
            avg_monthly_expense = sum(monthly_income) / len(monthly_income) * np.random.uniform(0.7, 1.1)
            
            # Generate late payment frequency
            late_payment_freq = np.random.uniform(0, 0.2)
            
            # Generate overdraft frequency
            overdraft_freq = np.random.uniform(0, 0.1)
            
            # Calculate savings rate
            savings_rate = expense_categories['savings']
            
            # Calculate recurring income stability
            income_stability = 1 - income_volatility
            
            # Calculate debt service ratio
            debt_service_ratio = expense_categories['debt_payments']
            
            # Calculate cash buffer (in months)
            cash_buffer_months = np.random.uniform(0, 6)
            
            data = {
                'avg_monthly_income': np.mean(monthly_income),
                'income_volatility': income_volatility,
                'income_stability': income_stability,
                'avg_monthly_expense': avg_monthly_expense,
                'expense_to_income_ratio': avg_monthly_expense / np.mean(monthly_income),
                'housing_expense_ratio': expense_categories['housing'],
                'debt_service_ratio': debt_service_ratio,
                'savings_rate': savings_rate,
                'late_payment_frequency': late_payment_freq,
                'overdraft_frequency': overdraft_freq,
                'cash_buffer_months': cash_buffer_months,
                'expense_volatility': np.random.uniform(0, 0.3),
                'recurring_bill_payment_consistency': np.random.uniform(0.7, 1.0),
                'discretionary_spending_ratio': expense_categories['entertainment'] + expense_categories['other'],
                'essential_spending_ratio': expense_categories['housing'] + expense_categories['utilities'] + expense_categories['food']
            }
            
            # Create DataFrame
            df = pd.DataFrame([data])
            
            # Cache the data for future use
            self.cache_data(borrower_id, df)
            self.last_fetch_time = datetime.now()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching transaction data: {e}")
            raise DataSourceError(f"Failed to fetch transaction data: {e}")
    
    def get_features(self) -> List[str]:
        """
        Get the list of features provided by this data source
        
        Returns:
            List of feature names
        """
        return [
            'avg_monthly_income',
            'income_volatility',
            'income_stability',
            'avg_monthly_expense',
            'expense_to_income_ratio',
            'housing_expense_ratio',
            'debt_service_ratio',
            'savings_rate',
            'late_payment_frequency',
            'overdraft_frequency',
            'cash_buffer_months',
            'expense_volatility',
            'recurring_bill_payment_consistency',
            'discretionary_spending_ratio',
            'essential_spending_ratio'
        ]


class UtilityPaymentDataSource(AlternativeDataSource):
    """
    Data source for utility payment history
    
    Collects and analyzes utility payment data such as:
    - Electricity bills
    - Water bills
    - Gas bills
    - Internet/phone bills
    - Rent payments
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.api_key = self.config.get('api_key', os.environ.get('UTILITY_API_KEY', ''))
        self.api_url = self.config.get('api_url', 'https://api.utilitypayments.example.com/v1')
        
        if not self.api_key:
            logger.warning("No API key provided for UtilityPaymentDataSource")
    
    def fetch_data(self, borrower_id: str, **kwargs) -> pd.DataFrame:
        """
        Fetch utility payment data for a borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            **kwargs: Additional parameters:
                - address: Borrower's address
                - months: Number of months of history to fetch (default: 24)
                
        Returns:
            DataFrame with utility payment features
        """
        # Check for cached data first
        cached_data = self.get_cached_data(borrower_id)
        if cached_data is not None:
            logger.info(f"Using cached utility payment data for borrower {borrower_id}")
            return cached_data
        
        # In a real implementation, this would call an actual API
        # For now, we'll simulate the API response
        logger.info(f"Fetching utility payment data for borrower {borrower_id}")
        
        try:
            # Simulate API call delay and response
            # In production, this would be a real API call
            months = kwargs.get('months', 24)
            
            # Generate synthetic data for demonstration
            # Payment consistency (percentage of on-time payments)
            electricity_consistency = np.random.uniform(0.7, 1.0)
            water_consistency = np.random.uniform(0.7, 1.0)
            gas_consistency = np.random.uniform(0.7, 1.0)
            internet_consistency = np.random.uniform(0.7, 1.0)
            rent_consistency = np.random.uniform(0.7, 1.0)
            
            # Average days late (when late)
            avg_days_late = np.random.uniform(1, 15)
            
            # Payment history length in months
            history_length = np.random.randint(6, months)
            
            # Number of missed payments
            missed_payments = int(np.random.uniform(0, 0.1) * history_length)
            
            # Calculate overall consistency score
            overall_consistency = np.mean([
                electricity_consistency,
                water_consistency,
                gas_consistency,
                internet_consistency,
                rent_consistency
            ])
            
            data = {
                'utility_history_length_months': history_length,
                'electricity_payment_consistency': electricity_consistency,
                'water_payment_consistency': water_consistency,
                'gas_payment_consistency': gas_consistency,
                'internet_payment_consistency': internet_consistency,
                'rent_payment_consistency': rent_consistency,
                'overall_utility_payment_consistency': overall_consistency,
                'utility_missed_payments_count': missed_payments,
                'avg_days_late_when_late': avg_days_late,
                'utility_payment_trend': np.random.choice(['improving', 'stable', 'declining']),
                'utility_accounts_count': np.random.randint(2, 6)
            }
            
            # Convert categorical variables to numeric
            data['utility_payment_trend_score'] = {
                'improving': 0.9, 'stable': 0.7, 'declining': 0.3
            }[data['utility_payment_trend']]
            
            # Create DataFrame
            df = pd.DataFrame([data])
            
            # Cache the data for future use
            self.cache_data(borrower_id, df)
            self.last_fetch_time = datetime.now()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching utility payment data: {e}")
            raise DataSourceError(f"Failed to fetch utility payment data: {e}")
    
    def get_features(self) -> List[str]:
        """
        Get the list of features provided by this data source
        
        Returns:
            List of feature names
        """
        return [
            'utility_history_length_months',
            'electricity_payment_consistency',
            'water_payment_consistency',
            'gas_payment_consistency',
            'internet_payment_consistency',
            'rent_payment_consistency',
            'overall_utility_payment_consistency',
            'utility_missed_payments_count',
            'avg_days_late_when_late',
            'utility_payment_trend',
            'utility_payment_trend_score',
            'utility_accounts_count'
        ]


class EducationEmploymentDataSource(AlternativeDataSource):
    """
    Data source for education and employment information
    
    Collects and analyzes data related to:
    - Educational background
    - Professional certifications
    - Employment history
    - Industry and job stability
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.api_key = self.config.get('api_key', os.environ.get('EDUCATION_EMPLOYMENT_API_KEY', ''))
        self.api_url = self.config.get('api_url', 'https://api.eduemploy.example.com/v1')
        
        if not self.api_key:
            logger.warning("No API key provided for EducationEmploymentDataSource")
    
    def fetch_data(self, borrower_id: str, **kwargs) -> pd.DataFrame:
        """
        Fetch education and employment data for a borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            **kwargs: Additional parameters:
                - name: Borrower's full name
                - ssn: Social security number (last 4 digits)
                
        Returns:
            DataFrame with education and employment features
        """
        # Check for cached data first
        cached_data = self.get_cached_data(borrower_id)
        if cached_data is not None:
            logger.info(f"Using cached education/employment data for borrower {borrower_id}")
            return cached_data
        
        # In a real implementation, this would call an actual API
        # For now, we'll simulate the API response
        logger.info(f"Fetching education/employment data for borrower {borrower_id}")
        
        try:
            # Simulate API call delay and response
            # In production, this would be a real API call
            
            # Generate synthetic data for demonstration
            education_levels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD']
            education_level = np.random.choice(education_levels)
            
            # Map education level to numeric score
            education_level_score = {
                'High School': 0.2,
                'Associate': 0.4,
                'Bachelor': 0.6,
                'Master': 0.8,
                'PhD': 1.0
            }[education_level]
            
            # Generate employment data
            employment_years = np.random.exponential(5)
            job_changes_last_5y = np.random.randint(0, 4)
            
            # Industry stability (higher is more stable)
            industry_stability = np.random.uniform(0.3, 1.0)
            
            # Professional certifications
            professional_certifications = np.random.randint(0, 5)
            
            # Job level
            job_levels = ['Entry', 'Mid', 'Senior', 'Management', 'Executive']
            job_level = np.random.choice(job_levels)
            
            # Map job level to numeric score
            job_level_score = {
                'Entry': 0.2,
                'Mid': 0.4,
                'Senior': 0.6,
                'Management': 0.8,
                'Executive': 1.0
            }[job_level]
            
            # Remote work status
            remote_work_status = np.random.choice(['On-site', 'Hybrid', 'Remote'])
            
            # Company size
            company_sizes = ['Small', 'Medium', 'Large', 'Enterprise']
            company_size = np.random.choice(company_sizes)
            
            # Map company size to numeric score
            company_size_score = {
                'Small': 0.25,
                'Medium': 0.5,
                'Large': 0.75,
                'Enterprise': 1.0
            }[company_size]
            
            data = {
                'education_level': education_level,
                'education_level_score': education_level_score,
                'employment_years': employment_years,
                'job_changes_last_5y': job_changes_last_5y,
                'job_stability_score': 1.0 - (job_changes_last_5y / 5.0),
                'industry_stability': industry_stability,
                'professional_certifications': professional_certifications,
                'job_level': job_level,
                'job_level_score': job_level_score,
                'remote_work_status': remote_work_status,
                'company_size': company_size,
                'company_size_score': company_size_score,
                'career_growth_trajectory': np.random.uniform(0, 1),
                'skill_demand_score': np.random.uniform(0.3, 1.0)
            }
            
            # Create DataFrame
            df = pd.DataFrame([data])
            
            # Cache the data for future use
            self.cache_data(borrower_id, df)
            self.last_fetch_time = datetime.now()
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching education/employment data: {e}")
            raise DataSourceError(f"Failed to fetch education/employment data: {e}")
    
    def get_features(self) -> List[str]:
        """
        Get the list of features provided by this data source
        
        Returns:
            List of feature names
        """
        return [
            'education_level',
            'education_level_score',
            'employment_years',
            'job_changes_last_5y',
            'job_stability_score',
            'industry_stability',
            'professional_certifications',
            'job_level',
            'job_level_score',
            'remote_work_status',
            'company_size',
            'company_size_score',
            'career_growth_trajectory',
            'skill_demand_score'
        ]


class AlternativeDataManager:
    """
    Manager class for coordinating multiple alternative data sources
    
    Handles the collection, aggregation, and preprocessing of data from
    multiple alternative data sources.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the alternative data manager
        
        Args:
            config_path: Path to configuration file
        """
        self.data_sources = {}
        self.config = {}
        
        # Load configuration if provided
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        
        # Initialize default data sources
        self._init_default_sources()
    
    def _init_default_sources(self) -> None:
        """Initialize default data sources"""
        self.register_data_source('digital_footprint', DigitalFootprintDataSource(self.config.get('digital_footprint', {})))
        self.register_data_source('transaction', TransactionDataSource(self.config.get('transaction', {})))
        self.register_data_source('utility_payment', UtilityPaymentDataSource(self.config.get('utility_payment', {})))
        self.register_data_source('education_employment', EducationEmploymentDataSource(self.config.get('education_employment', {})))
    
    def register_data_source(self, name: str, source: AlternativeDataSource) -> None:
        """
        Register a new data source
        
        Args:
            name: Name for the data source
            source: Data source instance
        """
        self.data_sources[name] = source
        logger.info(f"Registered data source: {name}")
    
    def get_data_source(self, name: str) -> Optional[AlternativeDataSource]:
        """
        Get a registered data source by name
        
        Args:
            name: Name of the data source
            
        Returns:
            Data source instance or None if not found
        """
        return self.data_sources.get(name)
    
    def collect_all_data(self, borrower_id: str, **kwargs) -> pd.DataFrame:
        """
        Collect data from all registered data sources for a borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            **kwargs: Additional parameters to pass to data sources
            
        Returns:
            DataFrame with combined alternative data
        """
        all_data = {}
        
        for name, source in self.data_sources.items():
            try:
                logger.info(f"Collecting data from {name} for borrower {borrower_id}")
                data = source.fetch_data(borrower_id, **kwargs)
                
                # Add source prefix to column names to avoid conflicts
                data_dict = data.to_dict(orient='records')[0] if not data.empty else {}
                prefixed_data = {f"{name}_{k}": v for k, v in data_dict.items()}
                
                all_data.update(prefixed_data)
            except Exception as e:
                logger.error(f"Error collecting data from {name}: {e}")
                # Continue with other sources even if one fails
        
        # Create DataFrame from combined data
        return pd.DataFrame([all_data]) if all_data else pd.DataFrame()
    
    def collect_specific_data(self, borrower_id: str, sources: List[str], **kwargs) -> pd.DataFrame:
        """
        Collect data from specific data sources for a borrower
        
        Args:
            borrower_id: Unique identifier for the borrower
            sources: List of data source names to collect from
            **kwargs: Additional parameters to pass to data sources
            
        Returns:
            DataFrame with combined alternative data from specified sources
        """
        all_data = {}
        
        for name in sources:
            source = self.get_data_source(name)
            if not source:
                logger.warning(f"Data source not found: {name}")
                continue
                
            try:
                logger.info(f"Collecting data from {name} for borrower {borrower_id}")
                data = source.fetch_data(borrower_id, **kwargs)
                
                # Add source prefix to column names to avoid conflicts
                data_dict = data.to_dict(orient='records')[0] if not data.empty else {}
                prefixed_data = {f"{name}_{k}": v for k, v in data_dict.items()}
                
                all_data.update(prefixed_data)
            except Exception as e:
                logger.error(f"Error collecting data from {name}: {e}")
                # Continue with other sources even if one fails
        
        # Create DataFrame from combined data
        return pd.DataFrame([all_data]) if all_data else pd.DataFrame()
    
    def get_all_features(self) -> Dict[str, List[str]]:
        """
        Get all available features from all data sources
        
        Returns:
            Dictionary mapping data source names to their feature lists
        """
        features = {}
        
        for name, source in self.data_sources.items():
            try:
                source_features = source.get_features()
                features[name] = source_features
            except Exception as e:
                logger.error(f"Error getting features from {name}: {e}")
        
        return features
