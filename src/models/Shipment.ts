import mongoose, { Schema, Document } from 'mongoose';

export type CourierProvider = 'PATHAO' | 'REDX' | 'STEADFAST' | 'PAPERFLY' | 'SUNDARBAN';

export interface IShipment extends Document {
  orderId: mongoose.Types.ObjectId;
  provider: CourierProvider;
  consignmentId?: string;
  trackingId?: string;
  trackingUrl?: string;
  status: string;
  bookedAt?: Date;
  pickedAt?: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  courierResponse?: Record<string, unknown>;
  events: {
    status: string;
    location?: string;
    note?: string;
    time: Date;
  }[];
}

const ShipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: {
      type: String,
      enum: ['PATHAO', 'REDX', 'STEADFAST', 'PAPERFLY', 'SUNDARBAN'],
    },
    consignmentId: String,
    trackingId: String,
    trackingUrl: String,
    status: { type: String, default: 'BOOKED' },
    bookedAt: Date,
    pickedAt: Date,
    estimatedDelivery: Date,
    deliveredAt: Date,
    courierResponse: Schema.Types.Mixed,
    events: [
      {
        status: String,
        location: String,
        note: String,
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);