import mongoose, {Schema} from "mongoose";

const meetingSchema = new Schema(
  {
    meetingId: {type: String, required: true, unique: true},
    user_id: {type: String, required: true}, 
    date: {type: Date, default: Date.now, required: true},
}
)

const Meeting = mongoose.model("Meeting", meetingSchema);

export {Meeting};