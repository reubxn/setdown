export default {
  providers: [
    {
      domain:
        process.env.CONVEX_SITE_URL ??
        "https://accurate-hummingbird-316.eu-west-1.convex.site",
      applicationID: "convex",
    },
  ],
};
