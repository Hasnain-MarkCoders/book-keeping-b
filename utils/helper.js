const { default: mongoose } = require("mongoose");

exports.convertToObjectIdArray = (id) => {
    if (!id) return []; // Return empty array if no ID is provided
  
    let idsArray = Array.isArray(id) ? id : [id]; // Ensure it's an array
    return idsArray
      .filter(x => x && x.trim() !== "") // Remove empty strings or falsy values
      .map(x => new mongoose.Types.ObjectId(x)); // Convert to ObjectId
  };