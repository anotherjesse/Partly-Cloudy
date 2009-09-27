var $ = function(x) { return document.getElementById(x); };

Components.utils.import("resource://partly/auth.js");

function init() {
  try {
    var creds = s3_auth.get();
    S3Ajax.KEY_ID = creds.key;
    S3Ajax.SECRET_KEY = creds.secret;

    $('setup').style.display = 'none';
    $('view').style.display = '';

    S3Ajax.listBuckets(
      function(xml, objs) {
        var buckets = xml.responseXML.getElementsByTagName('Bucket');
                        for (var i=0; i<buckets.length; i++) {
                          var name = buckets[i].getElementsByTagName('Name')[0].textContent;
                          var option = document.createElement('option');
                          option.value = name;
                          option.innerHTML = name;
                          $('buckets').appendChild(option);
                        }
      });
  }
  catch(e) {
    $('view').style.display = 'none';
    $('setup').style.display = '';
  }
}

init();

function save() {
  function trim(val) {
    if (val) {
      return val.replace(/^\s+|\s+$/g, '');
    }
  }

  var key = trim($('s3-key').value);
  var secret = trim($('s3-secret-key').value);

  if (key && key.length > 0 && secret && secret.length > 0) {
    s3_auth.set(key, secret);
  }
  else {
    s3_auth.clear();
  }

  init();
}

function list(newBucket) {
  bucket = newBucket;
  $('files').innerHTML = '<ul id="start" class="jqueryFileTree"><li class="wait">Loading...</li></ul></div>';
  showTree($('files'), '', true);
}

var xslt = new XSLTProcessor();
var req = new XMLHttpRequest();
req.open("GET", "chrome://s3/content/sidebar.xsl", false);
req.send(null);
xslt.importStylesheet(req.responseXML);

function clicked(event) {
  if (event.target.nodeName != 'span') {
    return false;
  }
  var element = event.target;
  var p = element.parentNode;
  if (p.className == 'directory' ) {
    if (p.getAttribute('open') ) {
      p.removeAttribute('open');
      while (p.childNodes.length > 1) {
        p.removeChild(p.lastChild);
      }
    } else {
      showTree( p, element.getAttribute('rel') );
      p.setAttribute('open', true);
    }
  } else {
    openUILinkIn(S3Ajax.httpFor(bucket, element.getAttribute('rel')),
                 whereToOpenLink(event));
  }

  return true;
}

function aws_setup() {
  openUILinkIn("http://aws-portal.amazon.com/gp/aws/developer/account/index.html?action=access-key", 'tab');
  return false;
}

document.addEventListener('click', clicked, false);

function showTree(li, directory, first) {
  li.setAttribute('wait', true);
  S3Ajax.listKeys(bucket, {prefix: directory, delimiter: '/'},
    function(req) {
      if (first) { li.innerHTML = ''; }
      var fragment = xslt.transformToFragment(req.responseXML, document);
      li.appendChild(fragment);
      li.removeAttribute('wait');
    }, function(req) {
      alert('error');
    });
}
