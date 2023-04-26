const mongoose = require('mongoose');

const connection = function () {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        error.message = 'could not connect to database, the server may be down';
        reject(error);
      });
  });
};

module.exports = { connection };