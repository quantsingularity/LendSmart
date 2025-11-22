/**
 * Validates an email address.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
export const isValidEmail = (email) => {
    if (!email) return false;
    // Basic email regex, consider a more robust one for production
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

/**
 * Validates a password based on minimum length.
 * @param {string} password - The password to validate.
 * @param {number} minLength - The minimum required length for the password.
 * @returns {boolean} True if the password meets the minimum length, false otherwise.
 */
export const isValidPassword = (password, minLength = 8) => {
    if (!password) return false;
    return password.length >= minLength;
};

/**
 * Checks if a value is empty (null, undefined, or empty string/array/object).
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is empty, false otherwise.
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (
        typeof value === 'object' &&
        Object.keys(value).length === 0 &&
        value.constructor === Object
    )
        return true;
    return false;
};

/**
 * Validates if a number is within a given range.
 * @param {number} number - The number to validate.
 * @param {number} min - The minimum allowed value (inclusive).
 * @param {number} max - The maximum allowed value (inclusive).
 * @returns {boolean} True if the number is within the range, false otherwise.
 */
export const isNumberInRange = (number, min, max) => {
    if (typeof number !== 'number' || typeof min !== 'number' || typeof max !== 'number')
        return false;
    return number >= min && number <= max;
};

/**
 * Validates if a string matches a specific pattern (regex).
 * @param {string} text - The string to validate.
 * @param {RegExp} regex - The regular expression to match against.
 * @returns {boolean} True if the string matches the pattern, false otherwise.
 */
export const matchesPattern = (text, regex) => {
    if (typeof text !== 'string' || !(regex instanceof RegExp)) return false;
    return regex.test(text);
};

// Add more specific validators as needed, e.g.:
// - isValidPhoneNumber
// - isValidAmount
// - isFutureDate
// - etc.
