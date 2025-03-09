const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const Notification = require('../models/Notification.model');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
exports.getSummary = asyncHandler(async (req, res, next) => {
  try {
    // Get inventory statistics
    const inventoryItems = await Inventory.find();
    const totalInventoryValue = inventoryItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const totalItems = inventoryItems.length;
    const lowStockItems = inventoryItems.filter(
      item => item.quantity <= (item.reorderLevel || 5)
    );
    const lowStockCount = lowStockItems.length;
    const outOfStockCount = inventoryItems.filter(item => item.quantity === 0).length;
    
    // Get categories
    const categories = [...new Set(inventoryItems.map(item => item.category))];
    
    // Get sales statistics
    const sales = await Sale.find().populate('items.product');
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((total, sale) => total + sale.total, 0);
    
    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = sales.filter(sale => new Date(sale.createdAt) >= today);
    const todayRevenue = todaySales.reduce((total, sale) => total + sale.total, 0);
    
    // Get this month's sales
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = sales.filter(sale => new Date(sale.createdAt) >= firstDayOfMonth);
    const monthRevenue = monthSales.reduce((total, sale) => total + sale.total, 0);
    
    // Get user statistics
    const users = await User.find();
    const totalUsers = users.length;
    const userRoles = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    // Get recent sales (last 5)
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('items.product');
    
    // Get top selling products
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product._id || item.product;
        if (!productSales[productId]) {
          productSales[productId] = {
            quantity: 0,
            revenue: 0,
            name: item.product.name || 'Unknown Product'
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.price * item.quantity;
      });
    });
    
    const topProducts = Object.keys(productSales)
      .map(key => ({
        id: key,
        name: productSales[key].name,
        quantity: productSales[key].quantity,
        revenue: productSales[key].revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    res.status(200).json({
      success: true,
      data: {
        inventory: {
          totalItems,
          totalValue: totalInventoryValue,
          lowStockCount,
          outOfStockCount,
          categories: categories.length,
          lowStockItems: lowStockItems.map(item => ({
            id: item._id,
            name: item.name,
            quantity: item.quantity,
            reorderLevel: item.reorderLevel || 5
          }))
        },
        sales: {
          totalSales,
          totalRevenue,
          todaySales: todaySales.length,
          todayRevenue,
          monthSales: monthSales.length,
          monthRevenue,
          recentSales: recentSales.map(sale => ({
            id: sale._id,
            customer: sale.customer,
            total: sale.total,
            date: sale.createdAt,
            items: sale.items.length
          })),
          topProducts
        },
        users: {
          totalUsers,
          roles: userRoles
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    return next(new ErrorResponse('Error getting dashboard summary', 500));
  }
});

// @desc    Get low stock items
// @route   GET /api/dashboard/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
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
    const populatedItems = await Inventory.populate(topSellingItems, {
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
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  try {
    // Get inventory statistics
    const inventoryItems = await Inventory.find();
    const totalInventoryValue = inventoryItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const totalItems = inventoryItems.length;
    const lowStockCount = inventoryItems.filter(
      item => item.quantity <= (item.reorderLevel || 5)
    ).length;
    
    // Get sales statistics
    const sales = await Sale.find();
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((total, sale) => total + sale.total, 0);
    
    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = sales.filter(sale => new Date(sale.createdAt) >= today);
    const todayRevenue = todaySales.reduce((total, sale) => total + sale.total, 0);
    
    // Get this month's sales
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = sales.filter(sale => new Date(sale.createdAt) >= firstDayOfMonth);
    const monthRevenue = monthSales.reduce((total, sale) => total + sale.total, 0);
    
    // Get user statistics
    const users = await User.find();
    const totalUsers = users.length;
    
    res.status(200).json({
      success: true,
      data: {
        inventory: {
          totalItems,
          totalValue: totalInventoryValue,
          lowStockCount
        },
        sales: {
          totalSales,
          totalRevenue,
          todaySales: todaySales.length,
          todayRevenue,
          monthSales: monthSales.length,
          monthRevenue
        },
        users: {
          totalUsers
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return next(new ErrorResponse('Error getting dashboard data', 500));
  }
});

// @desc    Get sales by period
// @route   GET /api/dashboard/sales-by-period
// @access  Private
exports.getSalesByPeriod = asyncHandler(async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    let startDate;
    const endDate = new Date();
    const today = new Date();
    
    // Calculate start date based on period
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    }
    
    // Get sales within the period
    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Group sales by date
    const salesByDate = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          count: 0,
          revenue: 0
        };
      }
      salesByDate[date].count += 1;
      salesByDate[date].revenue += sale.total;
    });
    
    // Convert to array for easier consumption by frontend
    const salesData = Object.keys(salesByDate).map(date => ({
      date,
      count: salesByDate[date].count,
      revenue: salesByDate[date].revenue
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Error getting sales by period:', error);
    return next(new ErrorResponse('Error getting sales by period', 500));
  }
});

// @desc    Get inventory status
// @route   GET /api/dashboard/inventory-status
// @access  Private
exports.getInventoryStatus = asyncHandler(async (req, res, next) => {
  try {
    const inventoryItems = await Inventory.find();
    
    // Group items by category
    const categoryCounts = {};
    inventoryItems.forEach(item => {
      if (!categoryCounts[item.category]) {
        categoryCounts[item.category] = {
          count: 0,
          value: 0,
          lowStock: 0
        };
      }
      categoryCounts[item.category].count += 1;
      categoryCounts[item.category].value += item.price * item.quantity;
      if (item.quantity <= (item.reorderLevel || 5)) {
        categoryCounts[item.category].lowStock += 1;
      }
    });
    
    // Convert to array for easier consumption by frontend
    const categoryData = Object.keys(categoryCounts).map(category => ({
      category,
      count: categoryCounts[category].count,
      value: categoryCounts[category].value,
      lowStock: categoryCounts[category].lowStock
    }));
    
    res.status(200).json({
      success: true,
      data: {
        categories: categoryData,
        totalItems: inventoryItems.length,
        totalValue: inventoryItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
        lowStockCount: inventoryItems.filter(
          item => item.quantity <= (item.reorderLevel || 5)
        ).length,
        outOfStockCount: inventoryItems.filter(
          item => item.quantity === 0
        ).length
      }
    });
  } catch (error) {
    console.error('Error getting inventory status:', error);
    return next(new ErrorResponse('Error getting inventory status', 500));
  }
}); 