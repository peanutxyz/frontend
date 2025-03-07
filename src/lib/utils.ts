// src/lib/utils.js

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Philippine Peso currency
 * @param amount - The number to format as currency
 * @returns Formatted currency string with ₱ symbol
 */
export function formatCurrency(amount: number): string {
  // First ensure we're working with exactly 2 decimal places
  const fixedAmount = parseFloat(amount.toFixed(2));
 
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(fixedAmount);
}

/**
 * Formats a date string into a localized date display
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Truncates a string if it's longer than the specified length
 * @param str - The string to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * Credit score utility functions for consistent credit calculations across the app
 */
export const creditScoreUtils = {
  /**
   * Calculates loan limit based on average transaction
   * @param score - The credit score (0-100) - no longer used for calculation but kept for compatibility
   * @param averageTransaction - The average transaction amount
   * @param transactionCount - Number of completed transactions
   * @returns The calculated loan limit in PHP
   */
  calculateCreditLimit: (score: number, averageTransaction: number, transactionCount: number = 0): number => {
    // No loans for suppliers without transaction history
    if (transactionCount < 1 || !averageTransaction || averageTransaction <= 0) return 0;
   
    // Fixed credit percentage of 40% for all suppliers with transaction history
    const creditPercentage = 0.40;
   
    // Calculate with precise math to avoid floating point errors
    // Multiply by 100, round, then divide by 100 to get 2 decimal places precision
    const preciseAmount = Math.round(averageTransaction * creditPercentage * 100) / 100;
   
    // For display purposes, return as integer (completely rounded)
    return Math.round(preciseAmount);
  },

  /**
   * Gets the category label for a credit score
   * @param score - The credit score (0-100)
   * @returns The score category as a string
   */
  getScoreCategory: (score: number): string => {
    if (score <= 0) return "No Score";
    if (score <= 20) return "Poor";
    if (score <= 40) return "Fair";
    if (score <= 60) return "Good";
    if (score <= 75) return "Very Good";
    return "Excellent";
  },

  /**
   * Gets the appropriate text color class for a category
   * @param category - The score category
   * @returns A Tailwind CSS text color class
   */
  getCategoryColor: (category: string): string => {
    switch (category) {
      case "No Score": return "text-gray-400";
      case "Poor": return "text-red-500";
      case "Fair": return "text-yellow-500";
      case "Good": return "text-blue-500";
      case "Very Good": return "text-emerald-500";
      case "Excellent": return "text-green-500";
      default: return "text-gray-500";
    }
  },

  /**
   * Checks if a supplier is eligible for a loan based on transaction history
   * @param score - The credit score (0-100) - no longer used for eligibility but kept for compatibility
   * @param transactionCount - Number of completed transactions
   * @returns Boolean indicating loan eligibility
   */
  isEligibleForLoan: (score: number, transactionCount = 0): boolean => {
    // Must have at least one transaction to be eligible
    return transactionCount >= 1;
  },

  /**
   * Calculates credit score components based on transaction history
   * @param transactions - Array of transaction objects
   * @returns Object containing score components and eligible amount
   */
  calculateCreditScoreComponents: (transactions: any[]) => {
    const transactionCount = transactions?.length || 0;
   
    // No transactions means no score components
    if (transactionCount === 0) {
      return {
        score: 0,
        transactionConsistency: 0,
        totalSupplyScore: 0,
        transactionCountScore: 0,
        eligibleAmount: 0,
        creditPercentage: 0,
        averageTransaction: 0,
        transactionCount: 0,
        isEligible: false
      };
    }
   
    // Get transaction amounts
    const amounts = transactions.map(t => t.total_kilo || t.quantity);
    const totalSupplied = transactions.reduce((sum, t) => sum + (t.total_kilo || t.quantity), 0);
    const averageTransaction = totalSupplied / transactionCount;
   
    let transactionConsistency = 0;
    let totalSupplyScore = 0;
    let transactionCountScore = 0;
    let finalScore = 0;
   
    if (transactionCount >= 2) {
      // For 2+ transactions, use full formula
      const smallestTransaction = Math.min(...amounts);
      const largestTransaction = Math.max(...amounts);
      transactionConsistency = (smallestTransaction / largestTransaction) * 100;
     
      const maxPossibleSupply = largestTransaction * transactionCount;
      totalSupplyScore = (totalSupplied / maxPossibleSupply) * 100;
     
      const idealTransactionCycle = 10;
      transactionCountScore = Math.min(100, (transactionCount / idealTransactionCycle) * 100);
     
      finalScore = Math.round((transactionConsistency + totalSupplyScore + transactionCountScore) / 3);
    } else {
      // For exactly 1 transaction, use starter score of 20
      transactionConsistency = 100;
      totalSupplyScore = 100;
      transactionCountScore = 10;
      finalScore = 20; // Changed from 30 to 20
    }
   
    // Fixed credit percentage of 40% regardless of score
    const creditPercentage = 0.40;
    
    // Calculate eligible amount
    const eligibleAmount = Math.round(averageTransaction * creditPercentage);
   
    return {
      score: finalScore,
      transactionConsistency: Math.round(transactionConsistency),
      totalSupplyScore: Math.round(totalSupplyScore),
      transactionCountScore: Math.round(transactionCountScore),
      eligibleAmount,
      creditPercentage,
      averageTransaction,
      transactionCount,
      isEligible: transactionCount >= 1 // Only require transaction history
    };
  }
};