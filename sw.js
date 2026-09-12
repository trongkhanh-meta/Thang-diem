var CACHE_NAME = "rehab-lib-cache-v2";
var STATIC_ASSETS = ["./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(STATIC_ASSETS); }));
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
  var url = e.request.url;

  if(url.indexOf("googleapis.com") !== -1 || url.indexOf("gstatic.com") !== -1 || url.indexOf("firestore") !== -1){
    return;
  }

  var isAppShell = e.request.mode === "navigate" || url.indexOf(".html") !== -1 || url.slice(-1) === "/";

  if(isAppShell){
    e.respondWith(
      fetch(e.request).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, resClone); });
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){ return cached || caches.match("./index.html"); });
      })
    );
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
