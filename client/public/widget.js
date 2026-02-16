(function() {
  var SITE = 'https://www.weddingcounselors.com';
  var container = document.getElementById('wc-widget');
  if (!container) return;

  var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var ref = (script && script.getAttribute('data-ref')) || 'widget';

  // Build the widget HTML
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'max-width:520px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

  var iframe = document.createElement('iframe');
  iframe.src = SITE + '/embed/find?ref=' + encodeURIComponent(ref);
  iframe.width = '100%';
  iframe.height = '420';
  iframe.style.cssText = 'border:0;border-radius:12px;overflow:hidden;display:block;';
  iframe.loading = 'lazy';
  iframe.title = 'Find premarital counseling';

  var credit = document.createElement('div');
  credit.style.cssText = 'font-size:12px;margin-top:8px;color:#6b7280;';
  credit.innerHTML = 'Powered by <a href="' + SITE + '/for-churches" target="_blank" rel="noopener" style="color:#0e5e5e;text-decoration:underline;">WeddingCounselors.com</a>';

  wrapper.appendChild(iframe);
  wrapper.appendChild(credit);
  container.appendChild(wrapper);
})();
