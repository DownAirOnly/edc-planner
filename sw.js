const STATIC='edcpocket-static-v2';
const MAP='edcpocket-map-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(STATIC).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
   caches.keys().then(keys=>Promise.all(keys.filter(key=>![STATIC,MAP].includes(key)).map(key=>caches.delete(key)))),
   self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin){
   if(url.pathname.endsWith('edco_2026_de_festival_map_1080x1350_r02.png')){
     event.respondWith(caches.open(MAP).then(async cache=>{
       const existing=await cache.match(event.request);if(existing)return existing;
       try{const response=await fetch(event.request);if(response.ok||response.type==='opaque')await cache.put(event.request,response.clone());return response;}catch{return Response.error();}
     }));
   }
   return;
 }
 // Fetch fresh pages when online so updates and safety notices aren't stuck behind an old cache.
 if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')){
   event.respondWith(fetch(event.request).then(response=>{
     if(response.ok){const copy=response.clone();caches.open(STATIC).then(c=>c.put('./index.html',copy));}
     return response;
   }).catch(()=>caches.match('./index.html')));
   return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
   if(response.ok)caches.open(STATIC).then(c=>c.put(event.request,response.clone()));
   return response;
 })));
});
