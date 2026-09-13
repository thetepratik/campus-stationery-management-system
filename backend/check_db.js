const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const connectDB = require('./config/db');

(async () => {
     await connectDB();
     const product = await Product.findOne({});
     console.log('Product images count:', product.images?.length);
     console.log('First image keys:', Object.keys(product.images?.[0] || {}));
     console.log('First image data type:', typeof product.images?.[0]?.data);
     console.log('First image buffer length:', product.images?.[0]?.data?.length);
     process.exit(0);
})();
