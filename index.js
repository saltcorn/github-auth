var GitHubStrategy = require("passport-github2").Strategy;
const User = require("@saltcorn/data/models/user");
const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");
const db = require("@saltcorn/data/db");

const { getState } = require("@saltcorn/data/db/state");

const authentication = (config) => {
  const cfg_base_url = getState().getConfig("base_url");
  const params = {
    clientID: config.clientID || "nokey",
    clientSecret: config.clientSecret || "nosecret",
    callbackURL: `${cfg_base_url}auth/callback/github`,
  };
  return {
    github: {
      icon: '<i class="fab fa-github"></i>',
      label: "GitHub",
      parameters: { scope: ["user:email"] },
      strategy: new GitHubStrategy(
        params,
        function (accessToken, refreshToken, profile, cb) {
          db.sql_log(profile);
          let email = "";
          if (profile._json && profile._json.email) email = profile._json.email;
          else if (profile.emails && profile.emails.length)
            email = profile.emails[0].value;
          User.findOrCreateByAttribute("githubId", profile.id, {
            email,
          }).then((u) => {
            return cb(null, u.session_object);
          });
        }
      ),
    },
  };
};

const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "API keys",
        form: () =>
          new Form({
            labelCols: 3,
            fields: [
              {
                name: "clientID",
                label: "GitHub Client ID",
                type: "String",
                required: true,
              },
              {
                name: "clientSecret",
                label: "GitHub Client Secret",
                type: "String",
                required: true,
              },
            ],
          }),
      },
    ],
  });

module.exports = {
  sc_plugin_api_version: 1,
  authentication,
  configuration_workflow,
};
