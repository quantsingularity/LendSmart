"""
Compliance Framework for LendSmart

This module provides a comprehensive compliance framework for lending operations,
ensuring adherence to regulatory requirements and best practices.
"""

import hashlib
import json
import logging
import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("compliance_framework")


class ComplianceError(Exception):
    """Exception raised for compliance violations"""

    pass


class ComplianceCheck:
    """Base class for all compliance checks"""

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the compliance check

        Args:
            config: Configuration dictionary for the check
        """
        self.config = config or {}
        self.name = self.__class__.__name__
        self.description = "Base compliance check"
        self.regulation_references = []
        self.severity = "medium"  # low, medium, high, critical

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Perform the compliance check

        Args:
            data: Data to check for compliance

        Returns:
            Tuple of (is_compliant, message)
        """
        # Default implementation - override in subclasses
        raise NotImplementedError("Subclasses must implement check method")

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about this compliance check

        Returns:
            Dictionary with check metadata
        """
        return {
            "name": self.name,
            "description": self.description,
            "regulation_references": self.regulation_references,
            "severity": self.severity,
        }


class EqualOpportunityCheck(ComplianceCheck):
    """
    Check for equal opportunity compliance (ECOA)

    Ensures that lending decisions do not discriminate based on protected characteristics
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = (
            "Checks for equal opportunity compliance in lending decisions"
        )
        self.regulation_references = ["ECOA", "Regulation B", "Fair Housing Act"]
        self.severity = "critical"

        # Protected characteristics to check
        self.protected_characteristics = self.config.get(
            "protected_characteristics",
            [
                "race",
                "color",
                "religion",
                "national_origin",
                "sex",
                "gender",
                "marital_status",
                "age",
                "disability",
                "familial_status",
            ],
        )

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for equal opportunity compliance

        Args:
            data: Dictionary containing loan application data and model outputs

        Returns:
            Tuple of (is_compliant, message)
        """
        # Check if protected characteristics are used in the model
        model_features = data.get("model_features", [])

        # Direct check for protected characteristics in features
        protected_in_features = [
            feature
            for feature in model_features
            if any(
                protected in feature.lower()
                for protected in self.protected_characteristics
            )
        ]

        if protected_in_features:
            return (
                False,
                f"Model directly uses protected characteristics: {', '.join(protected_in_features)}",
            )

        # Check for proxy variables that might correlate with protected characteristics
        proxy_variables = self._check_for_proxy_variables(model_features)
        if proxy_variables:
            return (
                True,
                f"Warning: Potential proxy variables detected: {', '.join(proxy_variables)}. "
                f"Further disparate impact analysis recommended.",
            )

        # Check for disparate impact if demographic data is available
        if "demographic_analysis" in data:
            return self._check_disparate_impact(data["demographic_analysis"])

        return (True, "No direct use of protected characteristics detected")

    def _check_for_proxy_variables(self, features: List[str]) -> List[str]:
        """
        Check for potential proxy variables for protected characteristics

        Args:
            features: List of model feature names

        Returns:
            List of potential proxy variables
        """
        # Common proxy variables that might correlate with protected characteristics
        proxy_patterns = [
            "zip_code",
            "postal_code",
            "neighborhood",
            "geography",
            "location",
            "education",
            "school",
            "college",
            "university",
            "occupation",
            "job_title",
            "employment_type",
            "language",
            "name",
            "first_name",
            "last_name",
        ]

        return [
            feature
            for feature in features
            if any(proxy in feature.lower() for proxy in proxy_patterns)
        ]

    def _check_disparate_impact(
        self, demographic_analysis: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """
        Check for disparate impact across demographic groups

        Args:
            demographic_analysis: Dictionary with demographic analysis results

        Returns:
            Tuple of (is_compliant, message)
        """
        # Check for significant differences in approval rates across groups
        # The 80% rule is a common threshold for disparate impact

        approval_rates = demographic_analysis.get("approval_rates", {})
        if not approval_rates:
            return (
                True,
                "No demographic approval rate data available for disparate impact analysis",
            )

        # Find highest approval rate
        highest_rate = max(approval_rates.values())

        # Check if any group has an approval rate less than 80% of the highest
        non_compliant_groups = []
        for group, rate in approval_rates.items():
            if rate < 0.8 * highest_rate:
                non_compliant_groups.append(
                    f"{group} ({rate:.1%} vs {highest_rate:.1%})"
                )

        if non_compliant_groups:
            return (
                False,
                f"Potential disparate impact detected for groups: {', '.join(non_compliant_groups)}",
            )

        return (
            True,
            "No significant disparate impact detected across demographic groups",
        )


class FairCreditReportingCheck(ComplianceCheck):
    """
    Check for Fair Credit Reporting Act (FCRA) compliance

    Ensures proper handling of credit information and adverse action notices
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = (
            "Checks for FCRA compliance in credit reporting and adverse actions"
        )
        self.regulation_references = ["FCRA", "Regulation V"]
        self.severity = "high"

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for FCRA compliance

        Args:
            data: Dictionary containing loan application and decision data

        Returns:
            Tuple of (is_compliant, message)
        """
        issues = []

        # Check if credit report was used
        credit_report_used = data.get("credit_report_used", False)

        if credit_report_used:
            # Check for permissible purpose
            if "permissible_purpose" not in data:
                issues.append(
                    "Credit report used without documented permissible purpose"
                )

            # Check for adverse action notice for declined applications
            decision = data.get("decision", "")
            adverse_action_notice = data.get("adverse_action_notice", None)

            if (
                decision.lower() in ["decline", "rejected", "denied"]
                and not adverse_action_notice
            ):
                issues.append("Adverse action taken without providing required notice")

            # Check if adverse action notice contains required elements
            if adverse_action_notice:
                required_elements = [
                    "credit_score_used",
                    "key_factors",
                    "credit_bureau_contact",
                    "consumer_rights",
                ]

                missing_elements = [
                    element
                    for element in required_elements
                    if element not in adverse_action_notice
                ]

                if missing_elements:
                    issues.append(
                        f"Adverse action notice missing required elements: {', '.join(missing_elements)}"
                    )

        # Check for risk-based pricing notice if applicable
        if data.get("risk_based_pricing", False) and not data.get(
            "risk_based_pricing_notice", None
        ):
            issues.append("Risk-based pricing used without providing required notice")

        if issues:
            return (False, "FCRA compliance issues: " + "; ".join(issues))

        return (True, "FCRA requirements satisfied")


class TruthInLendingCheck(ComplianceCheck):
    """
    Check for Truth in Lending Act (TILA) compliance

    Ensures proper disclosure of loan terms and costs
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = "Checks for TILA compliance in loan disclosures"
        self.regulation_references = ["TILA", "Regulation Z"]
        self.severity = "high"

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for TILA compliance

        Args:
            data: Dictionary containing loan terms and disclosures

        Returns:
            Tuple of (is_compliant, message)
        """
        issues = []

        # Check for required disclosures
        disclosures = data.get("disclosures", {})

        required_disclosures = [
            "apr",
            "finance_charge",
            "amount_financed",
            "total_payments",
            "payment_schedule",
            "late_payment_policy",
            "prepayment_policy",
        ]

        missing_disclosures = [
            disclosure
            for disclosure in required_disclosures
            if disclosure not in disclosures
        ]

        if missing_disclosures:
            issues.append(
                f"Missing required TILA disclosures: {', '.join(missing_disclosures)}"
            )

        # Check APR calculation accuracy if data available
        if "apr" in disclosures and "calculated_apr" in data:
            disclosed_apr = disclosures["apr"]
            calculated_apr = data["calculated_apr"]

            # APR must be accurate within 1/8 of 1 percent (0.125%)
            if abs(disclosed_apr - calculated_apr) > 0.125:
                issues.append(
                    f"APR disclosure inaccurate: disclosed {disclosed_apr}%, calculated {calculated_apr}%"
                )

        # Check finance charge accuracy if data available
        if "finance_charge" in disclosures and "calculated_finance_charge" in data:
            disclosed_charge = disclosures["finance_charge"]
            calculated_charge = data["calculated_finance_charge"]

            # Finance charge must be accurate within $1 for loans <= $100
            # or $10 for loans > $100
            tolerance = 1 if data.get("loan_amount", 0) <= 100 else 10

            if abs(disclosed_charge - calculated_charge) > tolerance:
                issues.append(
                    f"Finance charge disclosure inaccurate: disclosed ${disclosed_charge}, calculated ${calculated_charge}"
                )

        if issues:
            return (False, "TILA compliance issues: " + "; ".join(issues))

        return (True, "TILA requirements satisfied")


class AntiMoneyLaunderingCheck(ComplianceCheck):
    """
    Check for Anti-Money Laundering (AML) compliance

    Ensures proper customer identification and suspicious activity monitoring
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = "Checks for AML compliance in customer identification and transaction monitoring"
        self.regulation_references = ["BSA", "FinCEN", "PATRIOT Act"]
        self.severity = "critical"

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for AML compliance

        Args:
            data: Dictionary containing customer and transaction data

        Returns:
            Tuple of (is_compliant, message)
        """
        issues = []

        # Check for Customer Identification Program (CIP) compliance
        customer = data.get("customer", {})

        # Required identification elements
        required_id_elements = [
            "name",
            "date_of_birth",
            "address",
            "identification_number",  # SSN, TIN, etc.
        ]

        missing_id_elements = [
            element for element in required_id_elements if element not in customer
        ]

        if missing_id_elements:
            issues.append(
                f"Customer identification missing required elements: {', '.join(missing_id_elements)}"
            )

        # Check for ID verification
        if not data.get("identity_verified", False):
            issues.append("Customer identity not verified")

        # Check for OFAC screening
        if not data.get("ofac_screening_performed", False):
            issues.append("OFAC screening not performed")
        elif data.get("ofac_match", False):
            issues.append("Potential OFAC sanctions list match detected")

        # Check for suspicious activity indicators
        suspicious_indicators = self._check_suspicious_activity(data)
        if suspicious_indicators:
            issues.append(
                f"Suspicious activity indicators detected: {', '.join(suspicious_indicators)}"
            )

        if issues:
            return (False, "AML compliance issues: " + "; ".join(issues))

        return (True, "AML requirements satisfied")

    def _check_suspicious_activity(self, data: Dict[str, Any]) -> List[str]:
        """
        Check for suspicious activity indicators

        Args:
            data: Dictionary containing customer and transaction data

        Returns:
            List of suspicious activity indicators
        """
        indicators = []

        # Check for large cash transactions
        if (
            data.get("transaction_amount", 0) >= 10000
            and data.get("payment_method", "") == "cash"
        ):
            indicators.append("Large cash transaction")

        # Check for structured transactions
        if data.get("structured_transactions_detected", False):
            indicators.append("Potential structured transactions")

        # Check for high-risk jurisdictions
        if data.get("high_risk_jurisdiction", False):
            indicators.append(
                "Customer or transaction linked to high-risk jurisdiction"
            )

        # Check for unusual activity
        if data.get("transaction_consistent_with_profile", False) == False:
            indicators.append("Transaction inconsistent with customer profile")

        return indicators


class ModelRiskGovernanceCheck(ComplianceCheck):
    """
    Check for Model Risk Governance compliance

    Ensures proper development, validation, and monitoring of credit models
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = (
            "Checks for compliance with model risk governance requirements"
        )
        self.regulation_references = ["SR 11-7", "OCC 2011-12", "FDIC FIL-22-2017"]
        self.severity = "high"

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for model risk governance compliance

        Args:
            data: Dictionary containing model development and validation information

        Returns:
            Tuple of (is_compliant, message)
        """
        issues = []

        # Check for model documentation
        model_doc = data.get("model_documentation", {})

        required_doc_elements = [
            "model_purpose",
            "model_methodology",
            "model_assumptions",
            "model_limitations",
            "input_data_sources",
            "performance_metrics",
            "approval_process",
        ]

        missing_doc_elements = [
            element for element in required_doc_elements if element not in model_doc
        ]

        if missing_doc_elements:
            issues.append(
                f"Model documentation missing required elements: {', '.join(missing_doc_elements)}"
            )

        # Check for independent validation
        validation = data.get("model_validation", {})

        if not validation:
            issues.append("No model validation performed")
        else:
            # Check for independent validation
            if not validation.get("independent_validation", False):
                issues.append("Model validation not performed independently")

            # Check for validation of conceptual soundness
            if not validation.get("conceptual_soundness_validated", False):
                issues.append("Model's conceptual soundness not validated")

            # Check for ongoing performance monitoring
            if not validation.get("ongoing_monitoring", False):
                issues.append("No ongoing model performance monitoring")

            # Check for validation of data quality
            if not validation.get("data_quality_validated", False):
                issues.append("Data quality not validated")

        # Check for model governance structure
        governance = data.get("model_governance", {})

        if not governance:
            issues.append("No model governance structure documented")
        else:
            # Check for board/senior management oversight
            if not governance.get("senior_management_oversight", False):
                issues.append("No evidence of senior management oversight")

            # Check for clear roles and responsibilities
            if not governance.get("roles_responsibilities_defined", False):
                issues.append(
                    "Model governance roles and responsibilities not clearly defined"
                )

            # Check for periodic review
            if not governance.get("periodic_review_process", False):
                issues.append("No periodic model review process")

        if issues:
            return (False, "Model risk governance issues: " + "; ".join(issues))

        return (True, "Model risk governance requirements satisfied")


class DataPrivacyCheck(ComplianceCheck):
    """
    Check for data privacy compliance

    Ensures proper handling of personal information in accordance with privacy laws
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = "Checks for compliance with data privacy requirements"
        self.regulation_references = ["GLBA", "CCPA", "GDPR", "Regulation P"]
        self.severity = "high"

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for data privacy compliance

        Args:
            data: Dictionary containing data handling and privacy information

        Returns:
            Tuple of (is_compliant, message)
        """
        issues = []

        # Check for privacy notice
        privacy_notice = data.get("privacy_notice", {})

        if not privacy_notice:
            issues.append("No privacy notice provided")
        else:
            # Check for required privacy notice elements
            required_notice_elements = [
                "information_collected",
                "information_sharing_practices",
                "opt_out_rights",
                "security_measures",
                "contact_information",
            ]

            missing_notice_elements = [
                element
                for element in required_notice_elements
                if element not in privacy_notice
            ]

            if missing_notice_elements:
                issues.append(
                    f"Privacy notice missing required elements: {', '.join(missing_notice_elements)}"
                )

        # Check for consent for information sharing
        if data.get("information_shared_with_third_parties", False):
            if not data.get("customer_consent_for_sharing", False):
                issues.append(
                    "Information shared with third parties without customer consent"
                )

        # Check for data security measures
        security_measures = data.get("data_security_measures", {})

        if not security_measures:
            issues.append("No data security measures documented")
        else:
            # Check for required security measures
            required_security_measures = [
                "encryption",
                "access_controls",
                "data_retention_policy",
                "incident_response_plan",
            ]

            missing_security_measures = [
                measure
                for measure in required_security_measures
                if measure not in security_measures
            ]

            if missing_security_measures:
                issues.append(
                    f"Missing required security measures: {', '.join(missing_security_measures)}"
                )

        # Check for alternative data usage compliance
        if data.get("alternative_data_used", False):
            if not data.get("alternative_data_disclosure", False):
                issues.append("Alternative data used without proper disclosure")

            if not data.get("alternative_data_opt_out", False):
                issues.append("No opt-out mechanism for alternative data usage")

        if issues:
            return (False, "Data privacy issues: " + "; ".join(issues))

        return (True, "Data privacy requirements satisfied")


class UDAPCheck(ComplianceCheck):
    """
    Check for Unfair, Deceptive, or Abusive Acts or Practices (UDAAP) compliance

    Ensures lending practices are fair, transparent, and non-abusive
    """

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.description = "Checks for compliance with UDAAP requirements"
        self.regulation_references = ["UDAAP", "Dodd-Frank Act", "FTC Act"]
        self.severity = "critical"

    def check(self, data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check for UDAAP compliance

        Args:
            data: Dictionary containing lending practices and communications

        Returns:
            Tuple of (is_compliant, message)
        """
        issues = []

        # Check for clear and conspicuous disclosures
        marketing_materials = data.get("marketing_materials", {})

        if marketing_materials:
            # Check for misleading statements
            if marketing_materials.get("contains_misleading_statements", False):
                issues.append(
                    "Marketing materials contain potentially misleading statements"
                )

            # Check for hidden fees
            if marketing_materials.get("discloses_all_fees", False) == False:
                issues.append("Not all fees clearly disclosed in marketing materials")

            # Check for clear terms and conditions
            if marketing_materials.get("clear_terms_and_conditions", False) == False:
                issues.append("Terms and conditions not clearly presented")

        # Check loan terms for potential unfairness
        loan_terms = data.get("loan_terms", {})

        if loan_terms:
            # Check for excessive fees
            if loan_terms.get("excessive_fees", False):
                issues.append("Loan contains potentially excessive fees")

            # Check for prepayment penalties
            if loan_terms.get("prepayment_penalty", False):
                issues.append("Loan contains prepayment penalties")

            # Check for balloon payments
            if loan_terms.get("balloon_payment", False) and not loan_terms.get(
                "balloon_payment_disclosed", False
            ):
                issues.append("Balloon payment not properly disclosed")

        # Check for abusive practices
        if data.get("takes_unreasonable_advantage", False):
            issues.append("Practices may take unreasonable advantage of consumers")

        if data.get("prevents_understanding", False):
            issues.append("Practices may prevent consumer understanding of terms")

        # Check for fair treatment of consumers
        if data.get("fair_treatment", False) == False:
            issues.append("Evidence of unfair treatment of consumers")

        if issues:
            return (False, "UDAAP compliance issues: " + "; ".join(issues))

        return (True, "UDAAP requirements satisfied")


class ComplianceAuditTrail:
    """
    Maintains an audit trail of compliance checks and actions

    Records all compliance-related activities for reporting and examination
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the compliance audit trail

        Args:
            config: Configuration dictionary for the audit trail
        """
        self.config = config or {}
        self.audit_records = []
        self.audit_dir = self.config.get(
            "audit_dir",
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "audit_logs",
            ),
        )
        os.makedirs(self.audit_dir, exist_ok=True)

    def log_check(
        self, check_name: str, data_id: str, is_compliant: bool, message: str
    ) -> None:
        """
        Log a compliance check

        Args:
            check_name: Name of the compliance check
            data_id: Identifier for the data being checked
            is_compliant: Whether the check passed
            message: Compliance check message
        """
        record = {
            "timestamp": datetime.now().isoformat(),
            "check_name": check_name,
            "data_id": data_id,
            "is_compliant": is_compliant,
            "message": message,
            "record_id": str(uuid.uuid4()),
        }

        self.audit_records.append(record)

        # Write to audit log file
        self._write_to_log(record)

    def log_action(
        self, action_type: str, data_id: str, description: str, user_id: str = None
    ) -> None:
        """
        Log a compliance-related action

        Args:
            action_type: Type of action (e.g., 'override', 'review', 'approval')
            data_id: Identifier for the data being acted upon
            description: Description of the action
            user_id: Identifier for the user performing the action
        """
        record = {
            "timestamp": datetime.now().isoformat(),
            "action_type": action_type,
            "data_id": data_id,
            "description": description,
            "user_id": user_id,
            "record_id": str(uuid.uuid4()),
        }

        self.audit_records.append(record)

        # Write to audit log file
        self._write_to_log(record)

    def _write_to_log(self, record: Dict[str, Any]) -> None:
        """
        Write a record to the audit log file

        Args:
            record: Audit record to write
        """
        # Create a daily log file
        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(self.audit_dir, f"compliance_audit_{date_str}.jsonl")

        try:
            with open(log_file, "a") as f:
                f.write(json.dumps(record) + "\n")
        except Exception as e:
            logger.error(f"Error writing to audit log: {e}")

    def get_records(
        self,
        start_time: datetime = None,
        end_time: datetime = None,
        check_name: str = None,
        is_compliant: bool = None,
    ) -> List[Dict[str, Any]]:
        """
        Get filtered audit records

        Args:
            start_time: Filter records after this time
            end_time: Filter records before this time
            check_name: Filter by check name
            is_compliant: Filter by compliance status

        Returns:
            List of matching audit records
        """
        filtered_records = self.audit_records

        if start_time:
            filtered_records = [
                r
                for r in filtered_records
                if datetime.fromisoformat(r["timestamp"]) >= start_time
            ]

        if end_time:
            filtered_records = [
                r
                for r in filtered_records
                if datetime.fromisoformat(r["timestamp"]) <= end_time
            ]

        if check_name:
            filtered_records = [
                r for r in filtered_records if r.get("check_name") == check_name
            ]

        if is_compliant is not None:
            filtered_records = [
                r for r in filtered_records if r.get("is_compliant") == is_compliant
            ]

        return filtered_records

    def generate_report(
        self, start_time: datetime = None, end_time: datetime = None
    ) -> Dict[str, Any]:
        """
        Generate a compliance audit report

        Args:
            start_time: Start time for the report period
            end_time: End time for the report period

        Returns:
            Dictionary with report data
        """
        # Get records for the specified period
        records = self.get_records(start_time, end_time)

        # Filter check records
        check_records = [r for r in records if "check_name" in r]

        # Calculate compliance statistics
        total_checks = len(check_records)
        compliant_checks = len(
            [r for r in check_records if r.get("is_compliant", False)]
        )
        non_compliant_checks = total_checks - compliant_checks

        compliance_rate = compliant_checks / total_checks if total_checks > 0 else 0

        # Group non-compliant checks by check name
        non_compliant_by_check = {}
        for record in check_records:
            if not record.get("is_compliant", True):
                check_name = record.get("check_name", "Unknown")
                if check_name not in non_compliant_by_check:
                    non_compliant_by_check[check_name] = 0
                non_compliant_by_check[check_name] += 1

        # Generate report
        report = {
            "report_id": str(uuid.uuid4()),
            "generated_at": datetime.now().isoformat(),
            "period_start": start_time.isoformat() if start_time else None,
            "period_end": end_time.isoformat() if end_time else None,
            "total_checks": total_checks,
            "compliant_checks": compliant_checks,
            "non_compliant_checks": non_compliant_checks,
            "compliance_rate": compliance_rate,
            "non_compliant_by_check": non_compliant_by_check,
            "summary": f"Compliance rate: {compliance_rate:.1%} ({compliant_checks}/{total_checks} checks passed)",
        }

        return report


class ComplianceFramework:
    """
    Main compliance framework class

    Coordinates compliance checks, audit logging, and reporting
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the compliance framework

        Args:
            config: Configuration dictionary for the framework
        """
        self.config = config or {}
        self.checks = {}
        self.audit_trail = ComplianceAuditTrail(self.config.get("audit_trail", {}))

        # Initialize default checks
        self._init_default_checks()

    def _init_default_checks(self) -> None:
        """Initialize default compliance checks"""
        self.register_check(
            "equal_opportunity",
            EqualOpportunityCheck(self.config.get("equal_opportunity", {})),
        )
        self.register_check(
            "fair_credit_reporting",
            FairCreditReportingCheck(self.config.get("fair_credit_reporting", {})),
        )
        self.register_check(
            "truth_in_lending",
            TruthInLendingCheck(self.config.get("truth_in_lending", {})),
        )
        self.register_check(
            "anti_money_laundering",
            AntiMoneyLaunderingCheck(self.config.get("anti_money_laundering", {})),
        )
        self.register_check(
            "model_risk_governance",
            ModelRiskGovernanceCheck(self.config.get("model_risk_governance", {})),
        )
        self.register_check(
            "data_privacy", DataPrivacyCheck(self.config.get("data_privacy", {}))
        )
        self.register_check("udaap", UDAPCheck(self.config.get("udaap", {})))

    def register_check(self, name: str, check: ComplianceCheck) -> None:
        """
        Register a compliance check

        Args:
            name: Name for the check
            check: ComplianceCheck instance
        """
        self.checks[name] = check
        logger.info(f"Registered compliance check: {name}")

    def get_check(self, name: str) -> Optional[ComplianceCheck]:
        """
        Get a registered compliance check by name

        Args:
            name: Name of the check

        Returns:
            ComplianceCheck instance or None if not found
        """
        return self.checks.get(name)

    def run_check(
        self, check_name: str, data: Dict[str, Any], data_id: str = None
    ) -> Tuple[bool, str]:
        """
        Run a specific compliance check

        Args:
            check_name: Name of the check to run
            data: Data to check for compliance
            data_id: Identifier for the data being checked

        Returns:
            Tuple of (is_compliant, message)
        """
        check = self.get_check(check_name)
        if not check:
            logger.warning(f"Compliance check not found: {check_name}")
            return (False, f"Check not found: {check_name}")

        # Generate data_id if not provided
        if data_id is None:
            data_id = hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

        try:
            # Run the check
            is_compliant, message = check.check(data)

            # Log the check
            self.audit_trail.log_check(check_name, data_id, is_compliant, message)

            return (is_compliant, message)
        except Exception as e:
            error_message = f"Error running compliance check {check_name}: {e}"
            logger.error(error_message)

            # Log the error
            self.audit_trail.log_check(check_name, data_id, False, error_message)

            return (False, error_message)

    def run_all_checks(
        self, data: Dict[str, Any], data_id: str = None
    ) -> Dict[str, Tuple[bool, str]]:
        """
        Run all registered compliance checks

        Args:
            data: Data to check for compliance
            data_id: Identifier for the data being checked

        Returns:
            Dictionary mapping check names to (is_compliant, message) tuples
        """
        # Generate data_id if not provided
        if data_id is None:
            data_id = hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

        results = {}

        for check_name in self.checks:
            results[check_name] = self.run_check(check_name, data, data_id)

        return results

    def is_compliant(
        self, data: Dict[str, Any], data_id: str = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if data is compliant with all checks

        Args:
            data: Data to check for compliance
            data_id: Identifier for the data being checked

        Returns:
            Tuple of (overall_compliance, detailed_results)
        """
        check_results = self.run_all_checks(data, data_id)

        # Overall compliance is True only if all checks pass
        overall_compliance = all(result[0] for result in check_results.values())

        # Create detailed results
        detailed_results = {
            "overall_compliance": overall_compliance,
            "check_results": check_results,
            "timestamp": datetime.now().isoformat(),
            "data_id": data_id,
        }

        return (overall_compliance, detailed_results)

    def log_action(
        self, action_type: str, data_id: str, description: str, user_id: str = None
    ) -> None:
        """
        Log a compliance-related action

        Args:
            action_type: Type of action
            data_id: Identifier for the data being acted upon
            description: Description of the action
            user_id: Identifier for the user performing the action
        """
        self.audit_trail.log_action(action_type, data_id, description, user_id)

    def generate_report(
        self, start_time: datetime = None, end_time: datetime = None
    ) -> Dict[str, Any]:
        """
        Generate a compliance audit report

        Args:
            start_time: Start time for the report period
            end_time: End time for the report period

        Returns:
            Dictionary with report data
        """
        return self.audit_trail.generate_report(start_time, end_time)

    def get_available_checks(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all available compliance checks

        Returns:
            Dictionary mapping check names to their metadata
        """
        return {name: check.get_metadata() for name, check in self.checks.items()}


class ComplianceDocumentGenerator:
    """
    Generates compliance-related documentation

    Creates policy documents, disclosures, and reports
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the document generator

        Args:
            config: Configuration dictionary for the generator
        """
        self.config = config or {}
        self.templates_dir = self.config.get(
            "templates_dir",
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "docs",
                "templates",
            ),
        )
        self.output_dir = self.config.get(
            "output_dir",
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "docs",
                "generated",
            ),
        )

        os.makedirs(self.templates_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_adverse_action_notice(self, data: Dict[str, Any]) -> str:
        """
        Generate an adverse action notice

        Args:
            data: Dictionary with application and decision data

        Returns:
            Path to the generated document
        """
        # Extract required data
        applicant_name = data.get("applicant_name", "Applicant")
        application_date = data.get(
            "application_date", datetime.now().strftime("%Y-%m-%d")
        )
        decision_date = data.get("decision_date", datetime.now().strftime("%Y-%m-%d"))
        credit_score = data.get("credit_score", "Not applicable")
        score_factors = data.get("score_factors", ["Information not available"])

        # Format the factors as a list
        factors_text = "\n".join([f"- {factor}" for factor in score_factors])

        # Create the notice content
        content = f"""
NOTICE OF ADVERSE ACTION

Date: {decision_date}

To: {applicant_name}

Re: Loan Application dated {application_date}

Dear {applicant_name},

We regret to inform you that your application for credit has been denied. This decision was based in whole or in part on information obtained from:

1. Your credit report
2. Information you provided in your application
3. Our internal credit policies

CREDIT SCORE DISCLOSURE:
Your credit score: {credit_score}

Key factors affecting your credit score:
{factors_text}

You have the right to obtain a free copy of your credit report within 60 days from the consumer reporting agency identified below. You also have the right to dispute the accuracy or completeness of any information in your credit report.

[CREDIT BUREAU CONTACT INFORMATION]

NOTICE OF RIGHTS UNDER THE EQUAL CREDIT OPPORTUNITY ACT:
The federal Equal Credit Opportunity Act prohibits creditors from discriminating against credit applicants on the basis of race, color, religion, national origin, sex, marital status, age (provided the applicant has the capacity to enter into a binding contract); because all or part of the applicant's income derives from any public assistance program; or because the applicant has in good faith exercised any right under the Consumer Credit Protection Act.

If you believe you have been discriminated against, you may contact the Federal Trade Commission at:
Federal Trade Commission
Equal Credit Opportunity
Washington, DC 20580

Sincerely,

LendSmart Credit Department
        """

        # Save the notice to a file
        filename = f"adverse_action_{data.get('application_id', 'unknown')}_{datetime.now().strftime('%Y%m%d%H%M%S')}.txt"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, "w") as f:
            f.write(content)

        return filepath

    def generate_privacy_policy(
        self, institution_name: str, contact_info: Dict[str, str]
    ) -> str:
        """
        Generate a privacy policy document

        Args:
            institution_name: Name of the financial institution
            contact_info: Dictionary with contact information

        Returns:
            Path to the generated document
        """
        # Create the policy content
        content = f"""
PRIVACY POLICY

{institution_name}
Last Updated: {datetime.now().strftime('%Y-%m-%d')}

FACTS: WHAT DOES {institution_name.upper()} DO WITH YOUR PERSONAL INFORMATION?

WHY?
Financial companies choose how they share your personal information. Federal law gives consumers the right to limit some but not all sharing. Federal law also requires us to tell you how we collect, share, and protect your personal information. Please read this notice carefully to understand what we do.

WHAT?
The types of personal information we collect and share depend on the product or service you have with us. This information can include:
- Social Security number and income
- Account balances and payment history
- Credit history and credit scores
- Transaction history and account transactions
- Alternative data such as utility payment history, digital footprint, and other non-traditional data sources

HOW?
All financial companies need to share customers' personal information to run their everyday business. In the section below, we list the reasons financial companies can share their customers' personal information; the reasons {institution_name} chooses to share; and whether you can limit this sharing.

REASONS WE CAN SHARE YOUR PERSONAL INFORMATION:

For our everyday business purposes — such as to process your transactions, maintain your account(s), respond to court orders and legal investigations, or report to credit bureaus
- Do we share? Yes
- Can you limit this sharing? No

For our marketing purposes — to offer our products and services to you
- Do we share? Yes
- Can you limit this sharing? No

For joint marketing with other financial companies
- Do we share? Yes
- Can you limit this sharing? Yes

For our affiliates' everyday business purposes — information about your transactions and experiences
- Do we share? Yes
- Can you limit this sharing? No

For our affiliates' everyday business purposes — information about your creditworthiness
- Do we share? Yes
- Can you limit this sharing? Yes

For our affiliates to market to you
- Do we share? Yes
- Can you limit this sharing? Yes

For nonaffiliates to market to you
- Do we share? No
- Can you limit this sharing? We don't share

TO LIMIT OUR SHARING:
- Call {contact_info.get('phone', '[phone number]')}
- Visit us online: {contact_info.get('website', '[website]')}
- Mail the form below

Please note: If you are a new customer, we can begin sharing your information 30 days from the date we sent this notice. When you are no longer our customer, we continue to share your information as described in this notice. However, you can contact us at any time to limit our sharing.

QUESTIONS?
Call {contact_info.get('phone', '[phone number]')} or go to {contact_info.get('website', '[website]')}

ALTERNATIVE DATA USAGE:
We may collect and use alternative data sources such as utility payment history, rental payment history, digital footprint information, and other non-traditional data to enhance our credit decisions. You have the right to:
- Be informed about the types of alternative data we use
- Request that we not use certain types of alternative data
- Dispute inaccurate alternative data

To exercise these rights, please contact us at {contact_info.get('email', '[email]')}.

WHAT WE DO:

How does {institution_name} protect my personal information?
To protect your personal information from unauthorized access and use, we use security measures that comply with federal law. These measures include computer safeguards and secured files and buildings.

How does {institution_name} collect my personal information?
We collect your personal information, for example, when you:
- Open an account or deposit money
- Pay your bills or apply for a loan
- Use your credit or debit card
We also collect your personal information from others, such as credit bureaus, affiliates, or other companies.

Why can't I limit all sharing?
Federal law gives you the right to limit only:
- Sharing for affiliates' everyday business purposes—information about your creditworthiness
- Affiliates from using your information to market to you
- Sharing for nonaffiliates to market to you
State laws and individual companies may give you additional rights to limit sharing.

DEFINITIONS:

Affiliates
Companies related by common ownership or control. They can be financial and nonfinancial companies.

Nonaffiliates
Companies not related by common ownership or control. They can be financial and nonfinancial companies.

Joint marketing
A formal agreement between nonaffiliated financial companies that together market financial products or services to you.

OTHER IMPORTANT INFORMATION:
For California Residents: We will not share information we collect about you with nonaffiliated third parties, except as permitted by California law.

For Vermont Residents: We will not share information we collect about you with nonaffiliated third parties, except as permitted by Vermont law.

For Nevada Residents: We are providing this notice pursuant to Nevada law.
        """

        # Save the policy to a file
        filename = f"privacy_policy_{datetime.now().strftime('%Y%m%d')}.txt"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, "w") as f:
            f.write(content)

        return filepath

    def generate_model_documentation(self, model_data: Dict[str, Any]) -> str:
        """
        Generate model documentation

        Args:
            model_data: Dictionary with model information

        Returns:
            Path to the generated document
        """
        # Extract model information
        model_name = model_data.get("model_name", "Credit Risk Model")
        model_version = model_data.get("model_version", "1.0")
        model_type = model_data.get("model_type", "Unknown")
        model_purpose = model_data.get("model_purpose", "Credit risk assessment")
        model_owner = model_data.get("model_owner", "Risk Department")

        # Format features
        traditional_features = model_data.get("traditional_features", [])
        alternative_features = model_data.get("alternative_features", [])

        trad_features_text = "\n".join(
            [f"- {feature}" for feature in traditional_features]
        )
        alt_features_text = "\n".join(
            [f"- {feature}" for feature in alternative_features]
        )

        # Format performance metrics
        performance = model_data.get("performance_metrics", {})
        performance_text = "\n".join(
            [f"- {metric}: {value}" for metric, value in performance.items()]
        )

        # Create the documentation content
        content = f"""
MODEL DOCUMENTATION

MODEL OVERVIEW:
Name: {model_name}
Version: {model_version}
Type: {model_type}
Purpose: {model_purpose}
Owner: {model_owner}
Date Created: {model_data.get('creation_date', datetime.now().strftime('%Y-%m-%d'))}

MODEL DESCRIPTION:
{model_data.get('description', 'No description provided.')}

MODEL METHODOLOGY:
{model_data.get('methodology', 'No methodology provided.')}

TRADITIONAL FEATURES:
{trad_features_text if trad_features_text else "No traditional features specified."}

ALTERNATIVE DATA FEATURES:
{alt_features_text if alt_features_text else "No alternative features specified."}

MODEL ASSUMPTIONS:
{model_data.get('assumptions', 'No assumptions provided.')}

MODEL LIMITATIONS:
{model_data.get('limitations', 'No limitations provided.')}

DATA SOURCES:
{model_data.get('data_sources', 'No data sources provided.')}

PERFORMANCE METRICS:
{performance_text if performance_text else "No performance metrics provided."}

MODEL VALIDATION:
{model_data.get('validation_summary', 'No validation summary provided.')}

FAIRNESS AND BIAS ASSESSMENT:
{model_data.get('fairness_assessment', 'No fairness assessment provided.')}

APPROVAL PROCESS:
{model_data.get('approval_process', 'No approval process provided.')}

MONITORING PLAN:
{model_data.get('monitoring_plan', 'No monitoring plan provided.')}

REGULATORY CONSIDERATIONS:
{model_data.get('regulatory_considerations', 'No regulatory considerations provided.')}
        """

        # Save the documentation to a file
        filename = f"{model_name.replace(' ', '_').lower()}_{model_version}_documentation_{datetime.now().strftime('%Y%m%d')}.txt"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, "w") as f:
            f.write(content)

        return filepath

    def generate_compliance_report(self, report_data: Dict[str, Any]) -> str:
        """
        Generate a compliance report

        Args:
            report_data: Dictionary with report information

        Returns:
            Path to the generated document
        """
        # Extract report information
        report_id = report_data.get("report_id", str(uuid.uuid4()))
        period_start = report_data.get("period_start", "Not specified")
        period_end = report_data.get("period_end", "Not specified")

        # Format compliance statistics
        total_checks = report_data.get("total_checks", 0)
        compliant_checks = report_data.get("compliant_checks", 0)
        non_compliant_checks = report_data.get("non_compliant_checks", 0)
        compliance_rate = report_data.get("compliance_rate", 0)

        # Format non-compliant checks by type
        non_compliant_by_check = report_data.get("non_compliant_by_check", {})
        non_compliant_text = "\n".join(
            [
                f"- {check}: {count} issues"
                for check, count in non_compliant_by_check.items()
            ]
        )

        # Create the report content
        content = f"""
COMPLIANCE AUDIT REPORT

Report ID: {report_id}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Period: {period_start} to {period_end}

EXECUTIVE SUMMARY:
This report provides an overview of compliance checks performed during the specified period.

COMPLIANCE STATISTICS:
- Total Checks Performed: {total_checks}
- Compliant Checks: {compliant_checks}
- Non-Compliant Checks: {non_compliant_checks}
- Overall Compliance Rate: {compliance_rate:.1%}

NON-COMPLIANT CHECKS BY TYPE:
{non_compliant_text if non_compliant_text else "No non-compliant checks."}

RECOMMENDATIONS:
{report_data.get('recommendations', 'No recommendations provided.')}

CONCLUSION:
{report_data.get('conclusion', 'No conclusion provided.')}

ATTESTATION:
This report was generated automatically by the Compliance Framework.
        """

        # Save the report to a file
        filename = f"compliance_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.txt"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, "w") as f:
            f.write(content)

        return filepath
