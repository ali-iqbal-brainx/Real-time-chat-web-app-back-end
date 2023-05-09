const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const oneToOneSchema = new Schema({
    ids: []
});

const one_to_one = mongoose.model("one_to_one", oneToOneSchema);
module.exports = one_to_one;