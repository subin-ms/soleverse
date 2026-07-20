const { cloudinary } = require('./config/cloudinary');

cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', { folder: 'test' })
  .then(res => console.log('Success:', res.secure_url))
  .catch(err => console.error('Cloudinary Error:', err));
