var EXPORTED_SYMBOLS = ['s3_auth', 'hmacSHA1'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var loginManager = Cc["@mozilla.org/login-manager;1"]
                     .getService(Ci.nsILoginManager);

var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                             Ci.nsILoginInfo,
					     "init");

function hmacSHA1(data, secret) {
  var uconv = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
              .createInstance(Ci.nsIScriptableUnicodeConverter);
  uconv.charset = "utf-8";

  var dataarray = uconv.convertToByteArray(data, []);

  var keyObject = Cc["@mozilla.org/security/keyobjectfactory;1"]
                  .getService(Ci.nsIKeyObjectFactory)
                  .keyFromString(Ci.nsIKeyObject.HMAC, secret);

  var cryptoHMAC = Cc["@mozilla.org/security/hmac;1"]
                   .createInstance(Ci.nsICryptoHMAC);
  cryptoHMAC.init(Ci.nsICryptoHMAC.SHA1, keyObject);
  cryptoHMAC.update(dataarray, dataarray.length);
  return cryptoHMAC.finish(true);
}


function getLogins() {
  return loginManager.findLogins({}, 'chrome://partly/s3', 'S3 Credentials', null);
}


var s3_auth = {
  clear: function s3_auth_clear() {
    var logins = getLogins();

    for (var i = 0; i < logins.length; i++) {
      loginManager.removeLogin(logins[i]);
    }
  },

  get: function s3_auth_get() {
    var logins = getLogins();

    // return just the first entry until we deal with multiple accounts
    if (logins.length > 0) {
      return {key: logins[0].username, secret: logins[0].password};
    }
  },

  set: function s3_auth_set(key, secret) {
    var logins = getLogins();

    var newLogin = new nsLoginInfo('chrome://partly/s3',
                                   'S3 Credentials', null,
                                   key, secret, "", "");

    if (logins.length > 0) {
      loginManager.modifyLogin(logins[0], newLogin);
    } else {
      loginManager.addLogin(newLogin);
    }
  }
};

