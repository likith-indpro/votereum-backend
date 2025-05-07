import { defineEndpoint } from "@directus/extensions-sdk";
import { ErrorCode } from "../utils/error-codes";

export default defineEndpoint((router, { services, database, getSchema }) => {
  const { ItemsService, UsersService } = services;

  // Get a list of users (with pagination and filters)
  router.get("/", async (req, res, next) => {
    try {
      const userService = new UsersService({
        schema: await getSchema(),
        accountability: req.accountability,
        knex: database,
      });

      // Extract query parameters for filtering, sorting, pagination
      const query = req.query;
      const filter = query.filter ? JSON.parse(String(query.filter)) : {};
      const sort = query.sort ? String(query.sort).split(",") : [];
      const limit = query.limit ? Number(query.limit) : 20;
      const page = query.page ? Number(query.page) : 1;
      const fields = query.fields ? String(query.fields).split(",") : ["*"];

      // Fetch users with the given parameters
      const users = await userService.readByQuery({
        filter,
        sort,
        limit,
        page,
        fields,
      });

      // Get total count for pagination
      const count = await userService.count({ filter });

      // Send response with pagination headers
      res.setHeader("X-Total-Count", count);
      res.json({
        data: users,
        meta: {
          total: count,
          page: page,
          limit: limit,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Get a specific user by ID
  router.get("/:id", async (req, res, next) => {
    try {
      const userService = new UsersService({
        schema: await getSchema(),
        accountability: req.accountability,
        knex: database,
      });

      const id = req.params.id;

      // Extract fields to return from query parameters
      const fields = req.query.fields
        ? String(req.query.fields).split(",")
        : ["*"];

      const user = await userService.readOne(id, { fields });

      if (!user) {
        return res.status(404).json({
          error: {
            code: ErrorCode.USER_NOT_FOUND,
            message: "User not found",
          },
        });
      }

      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  });

  // Create a new user
  router.post("/", async (req, res, next) => {
    try {
      // Check if the authenticated user has admin privileges for creating users
      if (req.accountability?.admin !== true) {
        return res.status(403).json({
          error: {
            code: ErrorCode.FORBIDDEN,
            message: "You do not have permission to create users",
          },
        });
      }

      const userService = new UsersService({
        schema: await getSchema(),
        accountability: req.accountability,
        knex: database,
      });

      // Extract user data from request body
      const userData = req.body;

      // Validate required fields
      if (!userData.email || !userData.password) {
        return res.status(400).json({
          error: {
            code: ErrorCode.INVALID_PAYLOAD,
            message: "Email and password are required",
          },
        });
      }

      // Create the user
      const userId = await userService.createOne({
        ...userData,
        status: "active",
        provider: "default",
        role: userData.role || process.env.DEFAULT_ROLE_ID, // Use default role if none provided
      });

      // Fetch the created user
      const newUser = await userService.readOne(userId);

      res.status(201).json({ data: newUser });
    } catch (error) {
      // Handle duplicate email error
      if (
        error.message?.includes("duplicate key") ||
        error.message?.includes("UNIQUE constraint failed")
      ) {
        return res.status(409).json({
          error: {
            code: ErrorCode.USER_EXISTS,
            message: "User with this email already exists",
          },
        });
      }
      next(error);
    }
  });

  // Register a new voter (special endpoint that allows public registration)
  router.post("/register", async (req, res, next) => {
    try {
      const userService = new UsersService({
        schema: await getSchema(),
        knex: database,
      });

      // Extract user data from request body
      const userData = req.body;

      // Validate required fields
      if (!userData.email || !userData.password || !userData.first_name) {
        return res.status(400).json({
          error: {
            code: ErrorCode.INVALID_PAYLOAD,
            message: "Email, password, and first name are required",
          },
        });
      }

      // Create the user as a voter
      const userId = await userService.createOne({
        ...userData,
        status: "active",
        provider: "default",
        is_voter: true,
        verification_status: "unverified",
        role: process.env.VOTER_ROLE_ID || process.env.DEFAULT_ROLE_ID, // Use voter role or default role
      });

      // Fetch the created user
      const newUser = await userService.readOne(userId);

      // Create voter profile
      try {
        const voterProfilesService = new ItemsService("voter_profiles", {
          schema: await getSchema(),
          knex: database,
        });

        await voterProfilesService.createOne({
          user_id: userId,
        });
      } catch (profileError) {
        console.error("Failed to create voter profile:", profileError);
        // Continue even if profile creation fails
      }

      res.status(201).json({ data: newUser });
    } catch (error) {
      // Handle duplicate email error
      if (
        error.message?.includes("duplicate key") ||
        error.message?.includes("UNIQUE constraint failed")
      ) {
        return res.status(409).json({
          error: {
            code: ErrorCode.USER_EXISTS,
            message: "User with this email already exists",
          },
        });
      }
      next(error);
    }
  });

  // Update a user
  router.patch("/:id", async (req, res, next) => {
    try {
      const userService = new UsersService({
        schema: await getSchema(),
        accountability: req.accountability,
        knex: database,
      });

      const id = req.params.id;
      const updates = req.body;

      // Check if user exists
      const userExists = await userService.readOne(id).catch(() => null);

      if (!userExists) {
        return res.status(404).json({
          error: {
            code: ErrorCode.USER_NOT_FOUND,
            message: "User not found",
          },
        });
      }

      // Prevent non-admins from updating certain fields
      if (req.accountability?.admin !== true) {
        // Filter out sensitive fields
        const allowedFields = [
          "first_name",
          "last_name",
          "email",
          "avatar",
          "ethereum_address",
        ];
        const filteredUpdates = Object.fromEntries(
          Object.entries(updates).filter(([key]) => allowedFields.includes(key))
        );

        // Check if the user is updating themselves
        if (req.accountability?.user !== id) {
          return res.status(403).json({
            error: {
              code: ErrorCode.FORBIDDEN,
              message: "You do not have permission to update this user",
            },
          });
        }

        await userService.updateOne(id, filteredUpdates);
      } else {
        // Admins can update any field
        await userService.updateOne(id, updates);
      }

      // Fetch the updated user
      const updatedUser = await userService.readOne(id);

      res.json({ data: updatedUser });
    } catch (error) {
      next(error);
    }
  });

  // Delete a user
  router.delete("/:id", async (req, res, next) => {
    try {
      // Only admins can delete users
      if (req.accountability?.admin !== true) {
        return res.status(403).json({
          error: {
            code: ErrorCode.FORBIDDEN,
            message: "You do not have permission to delete users",
          },
        });
      }

      const userService = new UsersService({
        schema: await getSchema(),
        accountability: req.accountability,
        knex: database,
      });

      const id = req.params.id;

      // Check if user exists
      const userExists = await userService.readOne(id).catch(() => null);

      if (!userExists) {
        return res.status(404).json({
          error: {
            code: ErrorCode.USER_NOT_FOUND,
            message: "User not found",
          },
        });
      }

      await userService.deleteOne(id);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Get the current user's information
  router.get("/me/profile", async (req, res, next) => {
    try {
      if (!req.accountability?.user) {
        return res.status(401).json({
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: "Not authenticated",
          },
        });
      }

      const userService = new UsersService({
        schema: await getSchema(),
        accountability: req.accountability,
        knex: database,
      });

      const userId = req.accountability.user;
      const user = await userService.readOne(userId);

      // Get additional voter profile data if available
      try {
        const voterProfilesService = new ItemsService("voter_profiles", {
          schema: await getSchema(),
          accountability: req.accountability,
          knex: database,
        });

        const [voterProfile] = await voterProfilesService.readByQuery({
          filter: { user_id: userId },
          limit: 1,
        });

        if (voterProfile) {
          res.json({
            data: {
              ...user,
              voter_profile: voterProfile,
            },
          });
          return;
        }
      } catch (profileError) {
        // Continue without voter profile data
      }

      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  });
});
