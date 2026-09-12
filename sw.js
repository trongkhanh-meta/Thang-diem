var CACHE_NAME = "rehab-lib-cache-v1";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  // Never cache Firestore/Firebase network calls - always go to network for those.
  if(e.request.url.indexOf("googleapis.com") !== -1 || e.request.url.indexOf("gstatic.com") !== -1 || e.request.url.indexOf("firestore") !== -1){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise = fetch(e.request).then(function(res){
        if(res && res.status === 200){
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, resClone); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
