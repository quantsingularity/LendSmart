/**
 * Wraps asynchronous route handlers to catch errors and pass them to the next error-handling middleware.
 * This avoids repetitive try-catch blocks in each async controller function.
 * @param {Function} fn - The asynchronous function to execute (typically a route handler).
 * @returns {Function} A new function that handles promise rejections.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

