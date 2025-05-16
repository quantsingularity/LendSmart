const Loan = require("../models/LoanModel");
const User = require("../models/UserModel");
// const ErrorResponse = require("../utils/errorResponse"); // For custom error handling

// @desc    Get all loans (can be filtered, e.g., by status or for marketplace)
// @route   GET /api/loans
// @route   GET /api/users/:userId/loans (get loans for a specific user)
// @access  Public (for marketplace), Private (for user-specific loans)
exports.getLoans = async (req, res, next) => {
  try {
    let query;

    if (req.params.userId) {
      // If getting loans for a specific user (borrower or lender)
      // Ensure the requesting user is authorized to see these loans or is the user themselves
      if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Not authorized to view these loans" });
      }
      query = Loan.find({ $or: [{ borrower: req.params.userId }, { lender: req.params.userId }] }).populate("borrower", "username email").populate("lender", "username email");
    } else {
      // General query, e.g., for marketplace (status: 'marketplace') or all loans (admin)
      // Add filtering based on query params (e.g., req.query.status)
      const queryParams = { ...req.query };
      const removeFields = ["select", "sort", "page", "limit"];
      removeFields.forEach(param => delete queryParams[param]);
      
      let queryStr = JSON.stringify(queryParams);
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
      
      query = Loan.find(JSON.parse(queryStr)).populate("borrower", "username email").populate("lender", "username email");
    }

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-applicationDate"); // Default sort
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Loan.countDocuments(query.getFilter()); // Get total count based on current filters

    query = query.skip(startIndex).limit(limit);

    const loans = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: loans.length,
      total,
      pagination,
      data: loans,
    });
  } catch (error) {
    console.error("Get Loans Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching loans", error: error.message });
  }
};

// @desc    Get a single loan by ID
// @route   GET /api/loans/:id
// @access  Public (if on marketplace), Private (otherwise, or for sensitive details)
exports.getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("borrower", "username email firstName lastName").populate("lender", "username email firstName lastName");

    if (!loan) {
      return res.status(404).json({ success: false, message: `Loan not found with id of ${req.params.id}` });
    }

    // Add access control here if needed, e.g., only borrower, lender, or admin can see full details
    // if (loan.status !== 'marketplace' && req.user.id !== loan.borrower.toString() && (loan.lender && req.user.id !== loan.lender.toString()) && req.user.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: "Not authorized to view this loan" });
    // }

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    console.error("Get Loan By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Create a new loan application
// @route   POST /api/loans
// @access  Private (Authenticated users, typically borrowers)
exports.createLoan = async (req, res, next) => {
  try {
    // Set borrower to the logged-in user's ID
    req.body.borrower = req.user.id;

    // Ensure user is not trying to set lender or status on creation (or handle based on role)
    delete req.body.lender;
    // req.body.status = 'pending_approval'; // Or set default in schema

    const loan = await Loan.create(req.body);
    res.status(201).json({
      success: true,
      message: "Loan application created successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Create Loan Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update a loan (e.g., by admin, or lender funding it, or borrower cancelling)
// @route   PUT /api/loans/:id
// @access  Private (Admins, involved parties based on action)
exports.updateLoan = async (req, res, next) => {
  try {
    let loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: `Loan not found with id of ${req.params.id}` });
    }

    // Authorization: Check who can update what
    // Example: Only admin can change certain fields, lender can fund, borrower can cancel if pending
    // This logic can be complex and should be carefully designed based on requirements.
    // For now, a simple check if the user is an admin or the borrower (for limited updates)
    if (req.user.role !== 'admin' && loan.borrower.toString() !== req.user.id) {
        // Further checks needed if it's a lender action, e.g. funding
        if (req.body.status === 'funded' && req.body.lender && req.user.id === req.body.lender && loan.status === 'marketplace') {
            // Allow lender to fund
        } else {
            return res.status(403).json({ success: false, message: "Not authorized to update this loan" });
        }
    }
    
    // Prevent borrower from updating critical fields after certain stages
    if (req.user.id === loan.borrower.toString() && loan.status !== 'pending_approval' && loan.status !== 'marketplace') {
        // Example: borrower can only update purpose/collateral if loan is still pending/marketplace
        const allowedUpdatesForBorrower = ['purpose', 'collateral'];
        for (const key in req.body) {
            if (!allowedUpdatesForBorrower.includes(key)) {
                return res.status(403).json({ success: false, message: `Borrowers cannot update '${key}' at this stage.` });
            }
        }
    }

    // If a lender is funding the loan
    if (req.body.status === 'funded' && !loan.lender && loan.status === 'marketplace') {
        if (!req.body.lender || req.body.lender !== req.user.id) {
            return res.status(400).json({ success: false, message: "Lender ID must be provided and match current user to fund a loan." });
        }
        req.body.fundedDate = Date.now();
    } else if (req.body.status === 'funded' && loan.lender && loan.lender.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "This loan is already funded by another lender." });
    }


    loan = await Loan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Loan updated successfully", data: loan });
  } catch (error) {
    console.error("Update Loan Error:", error);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete a loan (typically by admin, or borrower if application is cancellable)
// @route   DELETE /api/loans/:id
// @access  Private
exports.deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: `Loan not found with id of ${req.params.id}` });
    }

    // Authorization: Only admin or borrower (if loan is in 'pending_approval' or 'marketplace') can delete
    if (req.user.role !== 'admin' && 
        !(loan.borrower.toString() === req.user.id && ['pending_approval', 'marketplace'].includes(loan.status))) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this loan" });
    }

    await loan.deleteOne(); // Mongoose 6+ uses deleteOne()

    res.status(200).json({ success: true, message: "Loan deleted successfully", data: {} });
  } catch (error) {
    console.error("Delete Loan Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

