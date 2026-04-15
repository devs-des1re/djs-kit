const { default: mongoose } = require("mongoose");

const exampleSchema = mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true }
})

module.exports = mongoose.model('Example', exampleSchema)