import { defineEndpoint } from "@directus/extensions-sdk";
import { ErrorCode } from "../utils/error-codes";
import { createHash } from "crypto";

export default defineEndpoint(
  (router, { services, exceptions, database, getSchema, logger }) => {
    const { UsersService, ItemsService, MailService } = services;
    const { ServiceUnavailableException } = exceptions;

    // Public endpoint for user registration
    router.post("/", async (req, res, next) => {
      try {
        const userData = req.body;

        // Validate required fields
        if (!userData.email || !userData.password || !userData.first_name) {
          return res.status(400).json({
            errors: [
              {
                code: ErrorCode.INVALID_PAYLOAD,
                message: "Email, password, and first name are required",
              },
            ],
          });
        }

        // Create user service without accountability to allow public registration
        const userService = new UsersService({
          schema: await getSchema(),
          knex: database,
        });

        // Check if a user with this email already exists
        try {
          const existingUsers = await userService.readByQuery({
            filter: { email: { _eq: userData.email } },
            limit: 1,
          });

          if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({
              errors: [
                {
                  code: ErrorCode.USER_EXISTS,
                  message: "User with this email already exists",
                },
              ],
            });
          }
        } catch (err) {
          // If there's an error checking for existing users, continue anyway
          logger.warn(`Error checking for existing user: ${err}`);
        }

        // Set default values
        const newUserData = {
          ...userData,
          status: "active",
          provider: "default",
          is_voter: true,
          verification_status: "unverified",
          role: process.env.VOTER_ROLE_ID || process.env.DEFAULT_ROLE_ID,
        };

        // Create the user
        const userId = await userService.createOne(newUserData);

        // Optional: Create additional voter profile
        try {
          const voterProfileService = new ItemsService("voter_profiles", {
            schema: await getSchema(),
            knex: database,
          });

          await voterProfileService.createOne({
            user_id: userId,
            registered_region: userData.registered_region || null,
            age: userData.age || null,
          });
        } catch (err) {
          // If there's an error creating the voter profile, log it but continue
          logger.warn(
            `Error creating voter profile for user ${userId}: ${err}`
          );
        }

        // Optional: Generate and send verification email
        if (process.env.SEND_VERIFICATION_EMAILS === "true") {
          try {
            const mailService = new MailService({
              schema: await getSchema(),
              knex: database,
            });

            // Generate verification token
            const verificationToken = createHash("sha256")
              .update(`${userData.email}-${Date.now()}-${Math.random()}`)
              .digest("hex");

            // Store the token in user metadata or a dedicated table
            // (Implementation depends on your specific database schema)

            // Send verification email
            await mailService.send({
              to: userData.email,
              subject: "Verify your Votereum account",
              template: {
                name: "user-verification",
                data: {
                  firstname: userData.first_name,
                  url: `${process.env.PUBLIC_URL}/verify?token=${verificationToken}`,
                },
              },
            });
          } catch (err) {
            logger.warn(`Error sending verification email: ${err}`);
          }
        }

        // Return success without exposing sensitive user data
        res.status(201).json({
          data: {
            id: userId,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            is_voter: true,
            verification_status: "unverified",
            ethereum_address: userData.ethereum_address || null,
          },
        });
      } catch (error) {
        // Log the detailed error
        logger.error(`Registration error: ${error}`);

        // Return user-friendly error
        if (
          error.message &&
          (error.message.includes("duplicate key") ||
            error.message.includes("UNIQUE constraint failed") ||
            error.message.includes("Duplicate entry"))
        ) {
          return res.status(409).json({
            errors: [
              {
                code: ErrorCode.USER_EXISTS,
                message: "User with this email already exists",
              },
            ],
          });
        }

        next(error);
      }
    });

    // Verify user email endpoint
    router.get("/verify/:token", async (req, res, next) => {
      try {
        const token = req.params.token;

        // Here you would:
        // 1. Lookup the token in your database
        // 2. Verify it's valid and not expired
        // 3. Update the user's verified status

        // This is a placeholder implementation
        res.send(
          "Email verification endpoint - Implement token validation logic"
        );
      } catch (error) {
        next(error);
      }
    });

    // Check if email exists (for frontend validation)
    router.get("/check-email/:email", async (req, res, next) => {
      try {
        const email = req.params.email;

        const userService = new UsersService({
          schema: await getSchema(),
          knex: database,
        });

        const users = await userService.readByQuery({
          filter: { email: { _eq: email } },
          limit: 1,
          fields: ["id"],
        });

        res.json({
          exists: users && users.length > 0,
        });
      } catch (error) {
        next(error);
      }
    });
  }
);
