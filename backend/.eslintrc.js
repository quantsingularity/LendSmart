module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["eslint:recommended", "airbnb-base"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "no-console": "off", // Allow console logs for development/server logs
    "import/prefer-default-export": "off",
    "no-underscore-dangle": ["error", { "allow": ["_id"] }], // Allow _id for MongoDB
    "consistent-return": "off", // Allow functions to sometimes not return a value
    "no-shadow": "off", // Can be useful but sometimes restrictive
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_|next" }], // Warn for unused vars, ignore if starts with _ or is next
    "no-param-reassign": ["error", { "props": false }], // Allow reassigning props (e.g. req.user)
    "func-names": ["error", "as-needed"],
    "no-prototype-builtins": "off",
    "class-methods-use-this": "off",
    "linebreak-style": ["error", "unix"], // Enforce Unix linebreaks
    "object-curly-newline": "off", // More flexible with object formatting
    "comma-dangle": ["error", "always-multiline"],
    "arrow-parens": ["error", "as-needed"],
    "max-len": ["warn", { "code": 120, "ignoreUrls": true, "ignoreStrings": true, "ignoreTemplateLiterals": true }],
  },
  ignorePatterns: ["node_modules/", "build/", "dist/"],
};

