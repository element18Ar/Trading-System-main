// Change: This line is correct for ES Modules.
import Item from '../models/Item.js'; 


export const listItem = async (req, res) => {
  try {
    console.log("File received:", req.file);
    console.log("Body received:", req.body);

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const { name, description, seller, price } = req.body;

    const item = await Item.create({
      name,
      description,
      seller,
      price: price || 0,
      image: req.file.path, // <--- save path from multer
      status: "pending",
      isListed: false,
    });

    res.status(201).json({
      success: true,
      item,
    });

  } catch (error) {
    console.error("List item failed:", error);
    res.status(500).json({ error: "Server error, cannot list item." });
  }
};


/**
 * @desc    Get a list of all available items (for browsing/catalog)
 * @route   GET /api/products/items
 * @access  Public
 */
// Change: Use 'export const' instead of 'exports.getAllItems ='
export const getAllItems = async (req, res) => {
    try {
        // 1. Fetch all items that are currently listed
        const items = await Item.find({ isListed: true });
        
        // 2. Send a success response (Status 200: OK)
        res.status(200).json({
            status: 'success',
            results: items.length,
            data: {
                items: items
            }
        });

    } catch (error) {
        // Handle errors
        res.status(500).json({
            status: 'error',
            message: 'Could not fetch items.'
        });
    }
};