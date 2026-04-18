const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper functon to generate jwt token 
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// @desc    Register new Admin user (Used once to set up your account)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user (role defaults to 'user' if not provided)
        const user = await User.create({ name, email, password: hashedPassword, role: role || 'user' });

        if (user) {
            res.status(201).json({ _id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }


}


// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        // Check password
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user._id) });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser };
