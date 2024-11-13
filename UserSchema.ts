export const UserSchema = {
  name: "User",
  properties: {
    userId: "int", // Integer type for auto-incrementing
    username: "string",
    email: "string",
    dateJoined: "date",
  },
  primaryKey: "userId",
  };