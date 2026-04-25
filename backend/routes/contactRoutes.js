const express = require("express");
const router = express.Router();
const { getContacts, addContact, deleteContact } = require("../controllers/contactController");

router.get("/", getContacts);
router.post("/", addContact);
router.delete("/:id", deleteContact);

module.exports = router;
