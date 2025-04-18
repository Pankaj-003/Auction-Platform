import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 330); // Convert UTC to IST
      return now;
    },
  },
});

const ContactMessage = mongoose.model("ContactMessage", contactSchema);

export default ContactMessage;
