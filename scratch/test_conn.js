const mongoose = require('mongoose');
const uri = "mongodb://subinms128_db_user:okfw4Zt80k2sJ0KV@ac-rdpkh6e-shard-00-00.oes4or9.mongodb.net:27017,ac-rdpkh6e-shard-00-01.oes4or9.mongodb.net:27017,ac-rdpkh6e-shard-00-02.oes4or9.mongodb.net:27017/soleverse?ssl=true&replicaSet=atlas-nnx6md-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESS: Connected with standard URI");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAILED: Connection error:", err.message);
    process.exit(1);
  });
