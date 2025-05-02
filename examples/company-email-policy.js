// company-email-policy.js - only allow specific company domains
export default {
  globalNpmPackage: "validator",
  targetFile: "lib/isEmail.js", 
  beautify: true,
  replacements: [
    [
      `var default_email_options = {
  allow_display_name: false,
  allow_underscores: false,
  require_display_name: false,
  allow_utf8_local_part: true,
  require_tld: true,
  blacklisted_chars: '',
  ignore_max_length: false,
  host_blacklist: [],
  host_whitelist: []
};`,
      `var default_email_options = {
  allow_display_name: false,
  allow_underscores: false,
  require_display_name: false,
  allow_utf8_local_part: true,
  require_tld: true,
  blacklisted_chars: '',
  ignore_max_length: false,
  host_blacklist: [],
  host_whitelist: ['yourcompany.com', 'yourcompany.org']  // Only allow company domains
};` 
    ]
  ]
}