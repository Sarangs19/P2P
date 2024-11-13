import Realm from "realm";
import { UserSchema } from "./UserSchema";
// Define the User model with fields userId, username, email, and dateJoined
export class User extends Realm.Object {
  userId!: number;
  username!: string;
  email!: string;
  dateJoined!: Date;

  static schema = UserSchema;
}

const realm = new Realm({ schema: [User] });

// Function to get the next userId for auto-incrementing
const getNextUserId = () => {
  const maxId : number | undefined= realm.objects<User>("User").max("userId")?.valueOf();
  console.log("MaxId : ", maxId);
  return maxId !== undefined ? maxId + 1 : 1; // Start at 1 if no users exist
};

// Function to add a new user with auto-incremented userId
export const addUser = (username: string, email: string) => {
  try {
    realm.write(() => {
      realm.create("User", {
        userId: getNextUserId(),
        username,
        email,
        dateJoined: new Date(),
      });
    });
    console.log("User added successfully.");
  } catch (error) {
    console.error("Failed to add user:", error);
  }
};

const realmUser = new Realm({ schema: [User] });
export default realmUser;
