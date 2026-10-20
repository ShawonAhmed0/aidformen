/**
 * Backward-compatible route for links shared before the News & Media Center
 * launched. It renders the same server content; canonical metadata points to
 * /news so search engines keep one authoritative URL.
 */
export { generateMetadata, default } from "../news/page";
