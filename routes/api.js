import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Data files paths
const productsPath = path.join(__dirname, '..', 'data', 'products.json');
const reviewsPath = path.join(__dirname, '..', 'data', 'reviews.json');
const ordersPath = path.join(__dirname, '..', 'data', 'orders.json');
const staffPath = path.join(__dirname, '..', 'data', 'staff.json');
const analyticsPath = path.join(__dirname, '..', 'data', 'analytics.json');

// Initialize data files
function initializeDataFile(filePath, initialData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
}

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize all data files
initializeDataFile(productsPath, [
  {
    id: 1,
    name: "Basic Website",
    description: "A simple yet elegant website for small businesses",
    price: 799,
    features: ["Responsive Design", "5 Pages", "Contact Form", "Basic SEO"]
  },
  {
    id: 2,
    name: "E-commerce Solution",
    description: "Complete online store setup with payment integration",
    price: 2499,
    features: ["Product Management", "Shopping Cart", "Payment Gateway", "Order Tracking"]
  },
  {
    id: 3,
    name: "Corporate Portal",
    description: "Advanced web solution for medium to large businesses",
    price: 3999,
    features: ["Custom CMS", "User Management", "Advanced Analytics", "Multi-language Support"]
  }
]);

initializeDataFile(reviewsPath, [
  {
    id: 1,
    name: "John Smith",
    company: "TechStart Inc.",
    rating: 5,
    comment: "NEURIX transformed our online presence. The website they built increased our leads by 40%!",
    date: "2023-06-15",
    verified: true
  }
]);

initializeDataFile(ordersPath, []);
initializeDataFile(staffPath, []);
initializeDataFile(analyticsPath, {
  visitors: [],
  pageViews: [],
  conversions: []
});

// Analytics tracking middleware
router.use((req, res, next) => {
  const analytics = JSON.parse(fs.readFileSync(analyticsPath));
  const today = new Date().toISOString().split('T')[0];
  
  // Update visitors
  const visitorIndex = analytics.visitors.findIndex(v => v.date === today);
  if (visitorIndex === -1) {
    analytics.visitors.push({ date: today, count: 1 });
  } else {
    analytics.visitors[visitorIndex].count++;
  }
  
  // Update page views
  const page = req.path;
  const pageViewIndex = analytics.pageViews.findIndex(p => p.date === today && p.page === page);
  if (pageViewIndex === -1) {
    analytics.pageViews.push({ date: today, page, count: 1 });
  } else {
    analytics.pageViews[pageViewIndex].count++;
  }
  
  fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
  next();
});

// Get analytics data
router.get('/analytics', verifyToken, (req, res) => {
  try {
    const analytics = JSON.parse(fs.readFileSync(analyticsPath));
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate daily, weekly, and monthly stats
    const dailyStats = analytics.visitors.find(v => v.date === today) || { count: 0 };
    const weeklyStats = analytics.visitors
      .filter(v => {
        const date = new Date(v.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      })
      .reduce((sum, v) => sum + v.count, 0);
    
    const monthlyStats = analytics.visitors
      .filter(v => {
        const date = new Date(v.date);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      })
      .reduce((sum, v) => sum + v.count, 0);
    
    // Get top pages
    const topPages = analytics.pageViews
      .reduce((acc, view) => {
        if (!acc[view.page]) acc[view.page] = 0;
        acc[view.page] += view.count;
        return acc;
      }, {});
    
    res.json({
      visitors: {
        today: dailyStats.count,
        thisWeek: weeklyStats,
        thisMonth: monthlyStats
      },
      topPages: Object.entries(topPages)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

// Products routes
router.get('/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(productsPath));
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.post('/products', verifyToken, upload.single('image'), (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(productsPath));
    
    // Parse features from comma-separated string
    let features = req.body.features || '';
    if (typeof features === 'string') {
      features = features.split(',').map(f => f.trim()).filter(f => f);
    }
    
    const newProduct = {
      id: Date.now(),
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      features: features,
      image: req.file ? req.file.filename : null
    };
    
    products.push(newProduct);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
});

router.put('/products/:id', verifyToken, upload.single('image'), (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(productsPath));
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Parse features from comma-separated string
    let features = req.body.features || '';
    if (typeof features === 'string') {
      features = features.split(',').map(f => f.trim()).filter(f => f);
    }
    
    // Update product
    products[index] = {
      ...products[index],
      name: req.body.name || products[index].name,
      description: req.body.description || products[index].description,
      price: req.body.price ? parseFloat(req.body.price) : products[index].price,
      features: features.length ? features : products[index].features,
    };
    
    // Update image if a new one is uploaded
    if (req.file) {
      // Delete old image if it exists
      if (products[index].image) {
        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', products[index].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      products[index].image = req.file.filename;
    }
    
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json(products[index]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

router.delete('/products/:id', verifyToken, (req, res) => {
  try {
    let products = JSON.parse(fs.readFileSync(productsPath));
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    
    if (product && product.image) {
      // Delete product image
      const imagePath = path.join(__dirname, '..', 'public', 'uploads', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    products = products.filter(p => p.id !== id);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Reviews routes
router.get('/reviews', (req, res) => {
  try {
    const reviews = JSON.parse(fs.readFileSync(reviewsPath));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

router.post('/reviews', (req, res) => {
  try {
    const reviews = JSON.parse(fs.readFileSync(reviewsPath));
    const newReview = {
      id: Date.now(),
      ...req.body,
      date: new Date().toISOString().split('T')[0],
      verified: false
    };
    reviews.push(newReview);
    fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review' });
  }
});

router.put('/reviews/:id', verifyToken, (req, res) => {
  try {
    const reviews = JSON.parse(fs.readFileSync(reviewsPath));
    const index = reviews.findIndex(r => r.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }
    reviews[index] = { ...reviews[index], ...req.body };
    fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
    res.json(reviews[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating review' });
  }
});

router.delete('/reviews/:id', verifyToken, (req, res) => {
  try {
    let reviews = JSON.parse(fs.readFileSync(reviewsPath));
    reviews = reviews.filter(r => r.id !== parseInt(req.params.id));
    fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review' });
  }
});

// Staff routes
router.get('/staff', verifyToken, (req, res) => {
  try {
    const staff = JSON.parse(fs.readFileSync(staffPath));
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

router.post('/staff', verifyToken, (req, res) => {
  try {
    const staff = JSON.parse(fs.readFileSync(staffPath));
    const newStaff = {
      id: Date.now(),
      ...req.body,
      dateAdded: new Date().toISOString()
    };
    staff.push(newStaff);
    fs.writeFileSync(staffPath, JSON.stringify(staff, null, 2));
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(500).json({ message: 'Error adding staff member' });
  }
});

router.delete('/staff/:id', verifyToken, (req, res) => {
  try {
    let staff = JSON.parse(fs.readFileSync(staffPath));
    staff = staff.filter(s => s.id !== parseInt(req.params.id));
    fs.writeFileSync(staffPath, JSON.stringify(staff, null, 2));
    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing staff member' });
  }
});

// Order submission with file upload
router.post('/orders', upload.single('attachment'), (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersPath));
    const newOrder = {
      id: Date.now(),
      ...req.body,
      attachment: req.file ? req.file.filename : null,
      date: new Date().toISOString(),
      status: 'pending'
    };
    orders.push(newOrder);
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting order' });
  }
});

router.get('/orders', verifyToken, (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersPath));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

router.put('/orders/:id', verifyToken, (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ordersPath));
    const index = orders.findIndex(o => o.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    orders[index] = { ...orders[index], ...req.body };
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order' });
  }
});

export default router;