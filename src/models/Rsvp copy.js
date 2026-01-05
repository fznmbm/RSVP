import mongoose from 'mongoose';

const RsvpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  under5: {
    type: Number,
    default: 0,
    min: 0,
  },
  age5to12: {
    type: Number,
    default: 0,
    min: 0,
  },
  age12plus: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  paymentReference: {
    type: String,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'confirmed'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total amount before saving
RsvpSchema.pre('save', function(next) {
  this.totalAmount = (this.age5to12 * 10) + (this.age12plus * 15);
  next();
});

export default mongoose.models.Rsvp || mongoose.model('Rsvp', RsvpSchema);
