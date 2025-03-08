const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Sale = require('../models/Sale');
const InventoryItem = require('../models/InventoryItem.model');
const User = require('../models/User');
const Notification = require('../models/Notification.model');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
exports.getSummary = async (req, res) => {
  try {
    // Get total inventory value
    const inventoryItems = await InventoryItem.find();
    const totalInventoryValue = inventoryItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Get total inventory items
    const totalItems = inventoryItems.length;

    // Get low stock items count
    const lowStockCount = inventoryItems.filter(
      item => item.quantity <= item.minimumStockLevel
    ).length;

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = await Sale.find({
      createdAt: { $gte: today }
    });
    const todaySalesTotal = todaySales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    // Get this month's sales
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await Sale.find({
      createdAt: { $gte: firstDayOfMonth }
    });
    const monthSalesTotal = monthSales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    // Get unread notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      read: false
    });

    res.status(200).json({
      success: true,
      data: {
        totalInventoryValue,
        totalItems,
        lowStockCount,
        todaySalesCount: todaySales.length,
        todaySalesTotal,
        monthSalesCount: monthSales.length,
        monthSalesTotal,
        unreadNotificationsCount
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get low stock items
// @route   GET /api/dashboard/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$minimumStockLevel'] }
    }).sort('quantity');

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get top selling items
// @route   GET /api/dashboard/top-selling
// @access  Private (Admin, Manager)
exports.getTopSellingItems = async (req, res) => {
  try {
    // Aggregate sales to find top selling items
    const topSellingItems = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.item',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Populate item details
    const populatedItems = await InventoryItem.populate(topSellingItems, {
      path: '_id',
      select: 'name category price'
    });

    // Format the response
    const formattedItems = populatedItems.map(item => ({
      item: item._id,
      totalQuantity: item.totalQuantity,
      totalRevenue: item.totalRevenue
    }));

    res.status(200).json({
      success: true,
      count: formattedItems.length,
      data: formattedItems
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get recent sales
// @route   GET /api/dashboard/recent-sales
// @access  Private
exports.getRecentSales = async (req, res) => {
  try {
    const recentSales = await Sale.find()
      .sort('-createdAt')
      .limit(10)
      .populate({
        path: 'items.item',
        select: 'name category price'
      });

    res.status(200).json({
      success: true,
      count: recentSales.length,
      data: recentSales
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get notifications
// @route   GET /api/dashboard/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort('-createdAt')
      .populate({
        path: 'item',
        select: 'name category price quantity minimumStockLevel'
      });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/dashboard/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/dashboard/notifications/read-all
// @access  Private
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        totalInventory: 0,
        lowStockItems: 0,
        totalSales: 0,
        monthlySales: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get sales by period
// @route   GET /api/dashboard/sales-by-period
// @access  Private
exports.getSalesByPeriod = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get inventory status
// @route   GET /api/dashboard/inventory-status
// @access  Private
exports.getInventoryStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 