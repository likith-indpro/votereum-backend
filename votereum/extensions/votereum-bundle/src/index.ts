import { defineEndpoint } from "@directus/extensions-sdk";
import usersEndpoint from "./users";
import votersEndpoint from "./voters";
import votereumUsersEndpoint from "./votereum-users";
import registerEndpoint from "./register";

export default {
  id: "votereum-bundle",
  name: "Votereum API Bundle",

  // Register all endpoints from the bundle
  endpoints: {
    users: usersEndpoint,
    voters: votersEndpoint,
    "votereum-users": votereumUsersEndpoint,
    register: registerEndpoint,
  },
};
