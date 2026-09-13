const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const connectDB = require('./config/db');

(async () => {
     await connectDB();
     const product = await Product.findOne({}).lean();
     console.log('Product name:', product.name);
     console.log('Product images array type:', Array.isArray(product.images));
     console.log('Product images count:', product.images?.length);
     if (product.images && product.images.length > 0) {
          console.log('First image keys:', Object.keys(product.images[0]));
          console.log('First image data type:', typeof product.images[0].data);
          console.log('First image data:', product.images[0].data?.toString('base64').substring(0, 50));
     }
     process.exit(0);
})();
