import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig();

const openNextConfig = {
  ...cloudflareConfig,
  buildCommand: "npm run build:next",
};

export default openNextConfig;
