const User = require('../models/User');
const Loan = require('../models/Loan');
const { getAuditLogger } = require('../compliance/auditLogger');
const { logger } = require('../utils/logger');

/**
 * Credit Scoring Service
 * Implements sophisticated credit assessment algorithms for loan applications
 */
class CreditScoringService {
    constructor() {
        this.auditLogger = getAuditLogger();

        // Credit scoring weights and thresholds
        this.scoringWeights = {
            creditHistory: 0.35,
            paymentHistory: 0.3,
            debtToIncomeRatio: 0.2,
            employmentStability: 0.1,
            accountAge: 0.05,
        };

        this.riskThresholds = {
            excellent: 750,
            good: 650,
            fair: 550,
            poor: 450,
        };

        this.maxDebtToIncomeRatio = 0.43; // 43% DTI ratio limit
        this.minCreditScore = 300;
        this.maxCreditScore = 850;
    }

    /**
     * Assess creditworthiness for loan application
     * @param {Object} assessmentData - Assessment data
     * @returns {Object} Credit assessment result
     */
    async assessCreditworthiness(assessmentData) {
        try {
            const {
                userId,
                requestedAmount,
                income,
                employmentStatus,
                existingLoans = [],
            } = assessmentData;

            // Get user data
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Calculate base credit score
            const baseScore = await this.calculateBaseCreditScore(user);

            // Calculate debt-to-income ratio
            const dtiRatio = await this.calculateDebtToIncomeRatio(
                userId,
                income,
                requestedAmount,
                existingLoans,
            );

            // Assess employment stability
            const employmentScore = this.assessEmploymentStability(employmentStatus);

            // Calculate payment history score
            const paymentHistoryScore = await this.calculatePaymentHistoryScore(userId);

            // Calculate account age score
            const accountAgeScore = this.calculateAccountAgeScore(user.createdAt);

            // Combine all factors for final credit score
            const finalCreditScore = this.calculateFinalCreditScore({
                baseScore,
                dtiRatio,
                employmentScore,
                paymentHistoryScore,
                accountAgeScore,
            });

            // Determine risk level
            const riskLevel = this.determineRiskLevel(finalCreditScore);

            // Check approval criteria
            const approvalResult = this.checkApprovalCriteria({
                creditScore: finalCreditScore,
                dtiRatio,
                requestedAmount,
                income,
                riskLevel,
            });

            // Calculate recommended interest rate
            const recommendedRate = this.calculateRecommendedInterestRate(
                finalCreditScore,
                riskLevel,
                requestedAmount,
            );

            // Generate recommendations
            const recommendations = this.generateRecommendations({
                creditScore: finalCreditScore,
                dtiRatio,
                riskLevel,
                approved: approvalResult.approved,
            });

            const assessment = {
                creditScore: Math.round(finalCreditScore),
                riskLevel,
                approved: approvalResult.approved,
                reason: approvalResult.reason,
                recommendedRate,
                recommendations,
                assessmentDetails: {
                    baseScore: Math.round(baseScore),
                    dtiRatio: Math.round(dtiRatio * 100) / 100,
                    employmentScore: Math.round(employmentScore),
                    paymentHistoryScore: Math.round(paymentHistoryScore),
                    accountAgeScore: Math.round(accountAgeScore),
                },
            };

            // Audit log
            await this.auditLogger.logCreditAssessment({
                action: 'credit_assessment_completed',
                userId,
                requestedAmount,
                creditScore: assessment.creditScore,
                riskLevel,
                approved: assessment.approved,
                dtiRatio,
                timestamp: new Date().toISOString(),
            });

            return assessment;
        } catch (error) {
            logger.error('Credit assessment error', {
                error: error.message,
                userId: assessmentData.userId,
                requestedAmount: assessmentData.requestedAmount,
            });

            throw new Error('Credit assessment failed');
        }
    }

    /**
     * Calculate base credit score from user data
     * @param {Object} user - User object
     * @returns {number} Base credit score
     */
    async calculateBaseCreditScore(user) {
        // Start with user's existing credit score or default
        let baseScore = user.creditScore || 600;

        // Adjust based on KYC verification
        if (user.kycStatus === 'verified') {
            baseScore += 50;
        } else if (user.kycStatus === 'pending') {
            baseScore += 20;
        }

        // Adjust based on account verification
        if (user.emailVerified) {
            baseScore += 25;
        }

        if (user.phoneVerified) {
            baseScore += 25;
        }

        // Ensure score is within valid range
        return Math.max(this.minCreditScore, Math.min(this.maxCreditScore, baseScore));
    }

    /**
     * Calculate debt-to-income ratio
     * @param {string} userId - User ID
     * @param {number} income - Monthly income
     * @param {number} requestedAmount - Requested loan amount
     * @param {Array} existingLoans - Existing loans
     * @returns {number} DTI ratio
     */
    async calculateDebtToIncomeRatio(userId, income, requestedAmount, existingLoans) {
        if (!income || income <= 0) {
            return 1; // 100% DTI if no income provided
        }

        // Calculate existing monthly debt payments
        let existingMonthlyDebt = 0;

        for (const loan of existingLoans) {
            if (loan.status === 'active' || loan.status === 'funded') {
                // Estimate monthly payment (simplified calculation)
                const monthlyPayment = this.estimateMonthlyPayment(
                    loan.amount,
                    loan.interestRate,
                    loan.term,
                    loan.termUnit,
                );
                existingMonthlyDebt += monthlyPayment;
            }
        }

        // Estimate monthly payment for new loan (assuming 12 months if not specified)
        const estimatedNewPayment = this.estimateMonthlyPayment(
            requestedAmount,
            12, // Default 12% APR for estimation
            12,
            'months',
        );

        const totalMonthlyDebt = existingMonthlyDebt + estimatedNewPayment;
        const monthlyIncome = income;

        return totalMonthlyDebt / monthlyIncome;
    }

    /**
     * Estimate monthly payment for a loan
     * @param {number} principal - Loan principal
     * @param {number} annualRate - Annual interest rate
     * @param {number} term - Loan term
     * @param {string} termUnit - Term unit (months, years)
     * @returns {number} Monthly payment
     */
    estimateMonthlyPayment(principal, annualRate, term, termUnit) {
        const monthlyRate = annualRate / 100 / 12;
        const termInMonths = termUnit === 'years' ? term * 12 : term;

        if (monthlyRate === 0) {
            return principal / termInMonths;
        }

        const monthlyPayment =
            (principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths))) /
            (Math.pow(1 + monthlyRate, termInMonths) - 1);

        return monthlyPayment;
    }

    /**
     * Assess employment stability
     * @param {string} employmentStatus - Employment status
     * @returns {number} Employment score
     */
    assessEmploymentStability(employmentStatus) {
        const employmentScores = {
            'full-time': 100,
            'part-time': 70,
            contract: 60,
            'self-employed': 50,
            unemployed: 0,
            student: 40,
            retired: 80,
        };

        return employmentScores[employmentStatus] || 30;
    }

    /**
     * Calculate payment history score
     * @param {string} userId - User ID
     * @returns {number} Payment history score
     */
    async calculatePaymentHistoryScore(userId) {
        try {
            // Get user's loan history
            const loans = await Loan.find({
                $or: [{ borrower: userId }, { lender: userId }],
                status: { $in: ['repaid', 'active', 'defaulted'] },
            });

            if (loans.length === 0) {
                return 600; // Neutral score for no history
            }

            let totalLoans = 0;
            let onTimePayments = 0;
            let latePayments = 0;
            let defaults = 0;

            for (const loan of loans) {
                if (loan.borrower.toString() === userId) {
                    totalLoans++;

                    if (loan.status === 'repaid') {
                        // Check if repaid on time (simplified - would need more detailed payment tracking)
                        onTimePayments++;
                    } else if (loan.status === 'defaulted') {
                        defaults++;
                    }

                    // Analyze repayment patterns if available
                    if (loan.repayments && loan.repayments.length > 0) {
                        // Count late payments (simplified logic)
                        const lateCount = loan.repayments.filter((payment) => {
                            // Would implement actual late payment detection logic
                            // Check for common fraud patterns
        const fraudIndicators = [];
        
        // Check for unusual patterns
        if (loanAmount > creditScore * 500) {
            fraudIndicators.push('loan_amount_exceeds_creditworthiness');
        }
        
        // Check employment duration
        if (employmentDuration < 6) {
            fraudIndicators.push('short_employment_duration');
        }
        
        // Check debt-to-income ratio
        const debtToIncomeRatio = (existingDebt + loanAmount) / monthlyIncome;
        if (debtToIncomeRatio > 0.5) {
            fraudIndicators.push('high_debt_to_income_ratio');
        }
        
        return fraudIndicators.length > 2; // Flag as fraud if 3+ indicators
                        }).length;
                        latePayments += lateCount;
                    }
                }
            }

            if (totalLoans === 0) {
                return 600;
            }

            // Calculate score based on payment history
            const onTimeRatio = onTimePayments / totalLoans;
            const defaultRatio = defaults / totalLoans;

            let score = 600; // Base score
            score += onTimeRatio * 200; // Up to 200 points for on-time payments
            score -= defaultRatio * 300; // Penalty for defaults
            score -= latePayments * 10; // Penalty for late payments

            return Math.max(300, Math.min(850, score));
        } catch (error) {
            logger.error('Payment history calculation error', {
                error: error.message,
                userId,
            });
            return 600; // Default neutral score
        }
    }

    /**
     * Calculate account age score
     * @param {Date} accountCreatedDate - Account creation date
     * @returns {number} Account age score
     */
    calculateAccountAgeScore(accountCreatedDate) {
        const now = new Date();
        const accountAge = now - new Date(accountCreatedDate);
        const ageInMonths = accountAge / (1000 * 60 * 60 * 24 * 30);

        // Score increases with account age, maxing out at 24 months
        const maxMonths = 24;
        const scoreMultiplier = Math.min(ageInMonths / maxMonths, 1);

        return 50 + scoreMultiplier * 50; // 50-100 points based on age
    }

    /**
     * Calculate final credit score
     * @param {Object} scores - Individual scores
     * @returns {number} Final credit score
     */
    calculateFinalCreditScore(scores) {
        const { baseScore, dtiRatio, employmentScore, paymentHistoryScore, accountAgeScore } =
            scores;

        // Apply weights to different factors
        let finalScore = baseScore * this.scoringWeights.creditHistory;
        finalScore += paymentHistoryScore * this.scoringWeights.paymentHistory;
        finalScore += employmentScore * this.scoringWeights.employmentStability;
        finalScore += accountAgeScore * this.scoringWeights.accountAge;

        // Apply DTI penalty
        if (dtiRatio > this.maxDebtToIncomeRatio) {
            const penalty = (dtiRatio - this.maxDebtToIncomeRatio) * 500;
            finalScore -= penalty;
        } else {
            // Bonus for low DTI
            const bonus = (this.maxDebtToIncomeRatio - dtiRatio) * 100;
            finalScore += bonus;
        }

        return Math.max(this.minCreditScore, Math.min(this.maxCreditScore, finalScore));
    }

    /**
     * Determine risk level based on credit score
     * @param {number} creditScore - Credit score
     * @returns {string} Risk level
     */
    determineRiskLevel(creditScore) {
        if (creditScore >= this.riskThresholds.excellent) {
            return 'low';
        } else if (creditScore >= this.riskThresholds.good) {
            return 'medium';
        } else if (creditScore >= this.riskThresholds.fair) {
            return 'high';
        } else {
            return 'very-high';
        }
    }

    /**
     * Check approval criteria
     * @param {Object} criteria - Approval criteria
     * @returns {Object} Approval result
     */
    checkApprovalCriteria(criteria) {
        const { creditScore, dtiRatio, requestedAmount, income, riskLevel } = criteria;

        // Minimum credit score requirement
        if (creditScore < this.riskThresholds.poor) {
            return {
                approved: false,
                reason: 'Credit score below minimum requirement',
            };
        }

        // Maximum DTI ratio
        if (dtiRatio > this.maxDebtToIncomeRatio) {
            return {
                approved: false,
                reason: 'Debt-to-income ratio too high',
            };
        }

        // Income verification
        if (!income || income <= 0) {
            return {
                approved: false,
                reason: 'Income verification required',
            };
        }

        // Maximum loan amount based on income
        const maxLoanAmount = income * 12 * 0.3; // 30% of annual income
        if (requestedAmount > maxLoanAmount) {
            return {
                approved: false,
                reason: 'Requested amount exceeds income-based limit',
            };
        }

        // Risk-based approval
        if (riskLevel === 'very-high') {
            return {
                approved: false,
                reason: 'Risk level too high for approval',
            };
        }

        return {
            approved: true,
            reason: 'Application meets all approval criteria',
        };
    }

    /**
     * Calculate recommended interest rate
     * @param {number} creditScore - Credit score
     * @param {string} riskLevel - Risk level
     * @param {number} requestedAmount - Requested amount
     * @returns {number} Recommended interest rate
     */
    calculateRecommendedInterestRate(creditScore, riskLevel, requestedAmount) {
        // Base rates by risk level
        const baseRates = {
            low: 8.0,
            medium: 12.0,
            high: 18.0,
            'very-high': 25.0,
        };

        let rate = baseRates[riskLevel] || 15.0;

        // Adjust based on credit score within risk level
        if (riskLevel === 'low' && creditScore >= 800) {
            rate -= 1.0;
        } else if (riskLevel === 'medium' && creditScore >= 700) {
            rate -= 1.5;
        } else if (riskLevel === 'high' && creditScore >= 600) {
            rate -= 2.0;
        }

        // Adjust based on loan amount (larger loans get slightly better rates)
        if (requestedAmount >= 50000) {
            rate -= 0.5;
        } else if (requestedAmount >= 25000) {
            rate -= 0.25;
        }

        return Math.max(5.0, Math.min(30.0, rate));
    }

    /**
     * Generate recommendations for improvement
     * @param {Object} assessmentData - Assessment data
     * @returns {Array} Recommendations
     */
    generateRecommendations(assessmentData) {
        const { creditScore, dtiRatio, riskLevel, approved } = assessmentData;
        const recommendations = [];

        if (!approved) {
            if (creditScore < this.riskThresholds.fair) {
                recommendations.push({
                    type: 'credit_improvement',
                    message:
                        'Focus on building credit history through smaller loans or secured credit products',
                    priority: 'high',
                });
            }

            if (dtiRatio > this.maxDebtToIncomeRatio) {
                recommendations.push({
                    type: 'debt_reduction',
                    message:
                        'Reduce existing debt or increase income to improve debt-to-income ratio',
                    priority: 'high',
                });
            }
        } else {
            if (riskLevel === 'high') {
                recommendations.push({
                    type: 'rate_improvement',
                    message: 'Consider a smaller loan amount to qualify for better interest rates',
                    priority: 'medium',
                });
            }

            if (creditScore < this.riskThresholds.good) {
                recommendations.push({
                    type: 'future_improvement',
                    message: 'Continue building credit history for better rates on future loans',
                    priority: 'low',
                });
            }
        }

        return recommendations;
    }

    /**
     * Update user credit score based on loan performance
     * @param {string} userId - User ID
     * @param {string} action - Action type (repayment, default, etc.)
     * @param {Object} details - Action details
     */
    async updateCreditScore(userId, action, details = {}) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            let scoreChange = 0;

            switch (action) {
                case 'on_time_payment':
                    scoreChange = 5;
                    break;
                case 'late_payment':
                    scoreChange = -10;
                    break;
                case 'loan_repaid':
                    scoreChange = 15;
                    break;
                case 'loan_defaulted':
                    scoreChange = -100;
                    break;
                case 'new_loan_funded':
                    scoreChange = 10;
                    break;
                default:
                    scoreChange = 0;
            }

            // Apply score change
            const newScore = Math.max(
                this.minCreditScore,
                Math.min(this.maxCreditScore, (user.creditScore || 600) + scoreChange),
            );

            user.creditScore = newScore;
            user.creditScoreLastUpdated = new Date();
            await user.save();

            // Audit log
            await this.auditLogger.logCreditScoreUpdate({
                action: 'credit_score_updated',
                userId,
                oldScore: user.creditScore - scoreChange,
                newScore,
                scoreChange,
                reason: action,
                details,
                timestamp: new Date().toISOString(),
            });

            logger.info('Credit score updated', {
                userId,
                action,
                scoreChange,
                newScore,
            });
        } catch (error) {
            logger.error('Credit score update error', {
                error: error.message,
                userId,
                action,
            });
        }
    }
}

module.exports = new CreditScoringService();
