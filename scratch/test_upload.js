const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

async function testUpload() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'admin' });
  const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="name"\r\n\r\n';
  body += 'Test Product\r\n';
  
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="sku"\r\n\r\n';
  body += 'TEST-SKU-123\r\n';
  
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="price"\r\n\r\n';
  body += '100\r\n';
  
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="image"; filename="test.png"\r\n';
  body += 'Content-Type: image/png\r\n\r\n';
  body += 'fake image data\r\n';
  body += '--' + boundary + '--\r\n';

  const res = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'multipart/form-data; boundary=' + boundary
    },
    body: body
  });
  
  const data = await res.json();
  console.log('RES:', data);
  process.exit(0);
}
testUpload().catch(err => { console.error('ERR:', err); process.exit(1); });
