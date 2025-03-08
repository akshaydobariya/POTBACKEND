const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_stock', 'out_of_stock', 'system', 'custom'],
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message']
  },
  item: {
    type: mongoose.Schema.ObjectId,
    ref: 'InventoryItem'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema); 