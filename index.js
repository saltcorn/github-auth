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
    callbackURL: `${addSlash(cfg_base_url)}auth/callback/github`,
  };
  return {
    github: {
      icon: '<i class="fab fa-github"></i>',
      label: "GitHub",
      parameters: { scope: ["user:email"] },
      strategy: new GitHubStrategy(
        params,
        function (accessToken, refreshToken, profile, cb) {
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

const addSlash = (s) => (s[s.length - 1] === "/" ? s : s + "/");

const configuration_workflow = () => {
  const cfg_base_url = getState().getConfig("base_url"),
    base_url = addSlash(cfg_base_url || "http://base_url");
  const blurb = [
    !cfg_base_url
      ? "You should set the 'Base URL' configration property. "
      : "",
    `Create a new OAuth App at the <a href="https://github.com/settings/developers">GitHub Developer Settings</a>
(you should be logged in to GitHub to access this link). 
you should obtain the API key and secret to enter below
and set the Authorization callback URL to ${base_url}auth/callback/github.`,
  ];
  return new Workflow({
    steps: [
      {
        name: "API keys",
        form: () =>
          new Form({
            labelCols: 3,
            blurb,
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
};
module.exports = {
  sc_plugin_api_version: 1,
  authentication,
  configuration_workflow,
};
