
//this is a given cache name that can be update by cache version
var staticCacheName = 'restaurant-cache-v1';
// Cache the files
var restaurantFileToCache = [
'/',
'./index.html',
'./restaurant.html',
'./css/styles.css',
'./js/dbhelper.js',
'./js/idb.js',
'./js/swr.js',
'./js/main.js',
'./js/restaurant_info.js',
// './data/restaurants.json',  // no long need as the server retriving data from server running on port 1337
'./img/1.jpg',
'./img/2.jpg',
'./img/3.jpg',
'./img/4.jpg',
'./img/5.jpg',
'./img/6.jpg',
'./img/7.jpg',
'./img/8.jpg',
'./img/9.jpg',
'./img/10.jpg'
];
// downloading the files
self.addEventListener('install', function(event){
	event.waitUntil(
	caches.open(staticCacheName).then(function(cache){
			return cache.addAll(restaurantFileToCache);
		})
	);
});
// Request to fetch the files from the server
self.addEventListener('fetch', function(event) {
  // respond with high jacks the request and takes control of the request
  event.respondWith(
    caches.open(staticCacheName).then(function(cache) {
      return cache.match(event.request,{ignoreSearch: true}).then(function (response) {
        // checks to see if respond is true, if it is then it returns response
        if (response) {
          return response;
        }
        else {
          return fetch(event.request).then(function(networkResponse) {
            return networkResponse;
          }).catch(function(error) {
            console.log("Unable to fetch data from network", event.request.url, error);
          });
        }
      });
    }).catch(function(error) {
      console.log("Something went wrong with Service Worker fetch intercept", error);
    })
  );
});
// update the old version of cache to new version
self.addEventListener('activate', function(event){
	var cacheWhitelist = [staticCacheName];
	event.waitUntil(
		caches.keys().then(function(cacheNames){
			return Promise.all(
				cacheNames.map(function(cacheName){
					if(cacheWhitelist.indexOf(cacheName)=== -1){
						return caches.delete(cacheName)
					}
				})
			)
		})
	)
})

