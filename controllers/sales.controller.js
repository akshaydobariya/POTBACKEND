const Sale = require('../models/Sale');
const InventoryItem = require('../models/InventoryItem.model');
const Notification = require('../models/Notification.model');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res) => {
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

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
exports.getSale = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    res.status(201).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private/Admin/Manager
exports.updateSale = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private/Admin
exports.deleteSale = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get daily sales stats
// @route   GET /api/sales/stats/daily
// @access  Private (Admin, Manager)
exports.getDailyStats = async (req, res) => {
  try {
    const stats = await Sale.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
          '_id.day': -1
        }
      },
      {
        $limit: 30
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get monthly sales stats
// @route   GET /api/sales/stats/monthly
// @access  Private (Admin, Manager)
exports.getMonthlyStats = async (req, res) => {
  try {
    const stats = await Sale.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1
        }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get yearly sales stats
// @route   GET /api/sales/stats/yearly
// @access  Private (Admin, Manager)
exports.getYearlyStats = async (req, res) => {
  try {
    const stats = await Sale.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      {
        $sort: {
          '_id.year': -1
        }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export sales to PDF
// @route   POST /api/sales/export
// @access  Private (Admin, Manager)
exports.exportSales = async (req, res) => {
  try {
    // Build query
    let query = Sale.find().populate({
      path: 'items.item',
      select: 'name category price'
    });

    // Filter by date range if provided
    if (req.body.startDate && req.body.endDate) {
      query = query.where('createdAt').gte(new Date(req.body.startDate)).lte(new Date(req.body.endDate));
    }

    // Sort by date
    query = query.sort('-createdAt');

    // Execute query
    const sales = await query;

    // Create a PDF document
    const doc = new PDFDocument();
    const filename = `sales-report-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '..', 'public', 'exports', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(filepath));

    // Add content to the PDF
    doc.fontSize(25).text('Sales Report', {
      align: 'center'
    });
    
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: 'center'
    });
    
    if (req.body.startDate && req.body.endDate) {
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${new Date(req.body.startDate).toLocaleDateString()} to ${new Date(req.body.endDate).toLocaleDateString()}`, {
        align: 'center'
      });
    }
    
    doc.moveDown();
    doc.moveDown();

    // Calculate total sales and items sold
    const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalItems = sales.reduce((acc, sale) => acc + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0);

    // Add summary
    doc.fontSize(14).text('Summary', {
      align: 'left'
    });
    doc.moveDown();
    doc.fontSize(12).text(`Total Sales: $${totalSales.toFixed(2)}`);
    doc.fontSize(12).text(`Total Transactions: ${sales.length}`);
    doc.fontSize(12).text(`Total Items Sold: ${totalItems}`);
    
    doc.moveDown();
    doc.moveDown();

    // Add table headers
    const tableTop = 250;
    const dateX = 50;
    const customerX = 150;
    const itemsX = 250;
    const totalX = 450;

    doc.fontSize(10)
      .text('Date', dateX, tableTop)
      .text('Customer', customerX, tableTop)
      .text('Items', itemsX, tableTop)
      .text('Total', totalX, tableTop);

    // Add a line
    doc.moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Add table rows
    let rowTop = tableTop + 30;
    sales.forEach((sale) => {
      doc.fontSize(10)
        .text(new Date(sale.createdAt).toLocaleDateString(), dateX, rowTop)
        .text(sale.customer.name, customerX, rowTop)
        .text(sale.items.length.toString(), itemsX, rowTop)
        .text(`$${sale.total.toFixed(2)}`, totalX, rowTop);

      rowTop += 20;
    });

    // Finalize the PDF
    doc.end();

    // Send the file URL to the client
    res.status(200).json({
      success: true,
      message: 'Sales report exported successfully',
      data: {
        filename,
        url: `/exports/${filename}`
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