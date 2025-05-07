import { defineHook } from "@directus/extensions-sdk";

export default defineHook(({ action }, { services, env, logger }) => {
  action("users.create", async ({ payload }) => {
    if (!payload) return;

    try {
      const { MailService } = services;
      const mailService = new MailService({
        mailerConfig: {
          pool: true,
          secure: true,
          host: env.EMAIL_SMTP_HOST,
          port: env.EMAIL_SMTP_PORT,
          auth: {
            user: env.EMAIL_SMTP_USER,
            pass: env.EMAIL_SMTP_PASSWORD,
          },
        },
        logger,
      });

      const email = payload.email;

      // Get a proper name for the user with fallback to email username if first_name is not available
      const userName = payload.first_name
        ? payload.first_name
        : email.split("@")[0];

      // Log the name we're going to use
      logger.info(
        `Sending invitation email to ${email} with name: ${userName}`
      );

      // Construct URL based on routing type
      let createPasswordUrl = "http://localhost:5173/login";

      await mailService.send({
        to: email,
        subject: "Welcome to Votereum",
        template: {
          name: "user-invitation",
          data: {
            email: email,
            name: userName,
            url: createPasswordUrl,
          },
        },
      });

      logger.info(`Invitation email sent to ${email}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to send invitation email: ${errorMessage}`);
    }
  });
});
