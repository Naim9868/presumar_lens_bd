// Import all models to ensure they are registered with Mongoose.
// This file is imported by connectDB() so that every database operation
// has access to all model schemas, including those needed for .populate().
import './Brand';
import './Category';
import './Product';
import Order from './Order';
import './Review';
import './Coupon';
import './Customer';
import './Payment';
import './OrderEvent';
import './Shipment';
import './Setting';
import './Attribution';
import './Audience';
import './Campaign';
import './MarketingEvent';
import './Intergration';
import './ReturnRequest';

// Re-export all models for convenience
export { Brand } from './Brand';
export { Category } from './Category';
export { Product } from './Product';
export { Review } from './Review';
export { default as Coupon } from './Coupon';
export { default as Customer } from './Customer';
export { default as Payment } from './Payment';
export { default as OrderEvent } from './OrderEvent';
export { default as Shipment } from './Shipment';
export { default as Setting } from './Setting';
export { default as Attribution } from './Attribution';
export { default as Audience } from './Audience';
export { default as Campaign } from './Campaign';
export { default as MarketingEvent } from './MarketingEvent';
export { default as Integration } from './Intergration';
export { default as ReturnRequest } from './ReturnRequest';
export default Order;
