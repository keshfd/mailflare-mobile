/**
 * Expo dynamic configuration.
 * Extends app.json to dynamically inject environment-dependent file paths and variables.
 */
module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      // In EAS Cloud builds, GOOGLE_SERVICES_JSON is injected via an EAS File environment variable.
      // For local development, falls back to ./google-services.json in the project root.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
  };
};
