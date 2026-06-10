export function getDoctorReadState(message = {}, messages = [], index = 0) {
  if (message.readStatus === "read" || message.read === true) return "read";
  if (message.readStatus === "unread" || message.read === false) return "unread";
  return messages.slice(index + 1).some((item) => item.from === "patient") ? "read" : "unread";
}

export function markDoctorMessageRead(message) {
  if (!message || message.from !== "doctor" || message.recalled) return;
  message.readStatus = "read";
  message.read = true;
}

export function syncDoctorMessageReadState(messages = []) {
  messages.forEach((message, index) => {
    if (message.from !== "doctor" || message.recalled) return;
    if (getDoctorReadState(message, messages, index) === "read") {
      markDoctorMessageRead(message);
    }
  });
}

export function markDoctorMessagesReadWhenPatientReplies(messages = []) {
  messages.forEach((message) => {
    if (message.from === "doctor") {
      markDoctorMessageRead(message);
    }
  });
}
