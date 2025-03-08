const InventoryItem = require('../models/InventoryItem.model');
const Notification = require('../models/Notification.model');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getInventoryItems = async (req, res) => {
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

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getInventoryItem = async (req, res) => {
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

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private/Admin/Manager
exports.createInventoryItem = async (req, res) => {
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

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin/Manager
exports.updateInventoryItem = async (req, res) => {
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

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
exports.deleteInventoryItem = async (req, res) => {
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

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$minimumStockLevel'] }
    });

    res.status(200).json({
      success: true,
      count: inventoryItems.length,
      data: inventoryItems
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all categories
// @route   GET /api/inventory/categories
// @access  Private
exports.getCategories = async (req, res) => {
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

// @desc    Search inventory
// @route   GET /api/inventory/search
// @access  Private
exports.searchInventory = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const inventoryItems = await InventoryItem.find({
      $text: { $search: query }
    });

    res.status(200).json({
      success: true,
      count: inventoryItems.length,
      data: inventoryItems
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export inventory to PDF
// @route   POST /api/inventory/export
// @access  Private
exports.exportInventory = async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.find();

    // Create a PDF document
    const doc = new PDFDocument();
    const filename = `inventory-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '..', 'public', 'exports', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(filepath));

    // Add content to the PDF
    doc.fontSize(25).text('Inventory Report', {
      align: 'center'
    });
    
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: 'center'
    });
    
    doc.moveDown();
    doc.moveDown();

    // Add table headers
    const tableTop = 150;
    const itemNumberX = 50;
    const nameX = 100;
    const categoryX = 250;
    const quantityX = 350;
    const priceX = 450;

    doc.fontSize(10)
      .text('No.', itemNumberX, tableTop)
      .text('Name', nameX, tableTop)
      .text('Category', categoryX, tableTop)
      .text('Quantity', quantityX, tableTop)
      .text('Price', priceX, tableTop);

    // Add a line
    doc.moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Add table rows
    let rowTop = tableTop + 30;
    inventoryItems.forEach((item, i) => {
      doc.fontSize(10)
        .text(i + 1, itemNumberX, rowTop)
        .text(item.name, nameX, rowTop)
        .text(item.category, categoryX, rowTop)
        .text(item.quantity.toString(), quantityX, rowTop)
        .text(`$${item.price.toFixed(2)}`, priceX, rowTop);

      rowTop += 20;
    });

    // Finalize the PDF
    doc.end();

    // Send the file URL to the client
    res.status(200).json({
      success: true,
      message: 'Inventory exported successfully',
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