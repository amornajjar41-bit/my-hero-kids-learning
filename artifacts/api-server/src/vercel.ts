/**
 * Vercel serverless entry point.
 * Exports the Express app directly without calling app.listen().
 * @vercel/node wraps this as a serverless function.
 */
import app from "./app.js";

export default app;
