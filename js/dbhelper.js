/*
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
  return `http://localhost:${port}`;
  }
  // Creating indexedDB database
  static openIDB(){
          let dbPromise = idb.open("restaurant_stage-2",1, upgradeDB => {
          upgradeDB.createObjectStore("restaurants", {keyPath:"id"})
          .createIndex('restaurants', 'id');
          });
    return dbPromise
  }

  // facting data fromt the server, port:1337
  static fetchRestaurants(callback) {
          fetch(`${DBHelper.DATABASE_URL}/restaurants`)
          .then(response => response.json())
          .then(restaurants => {
           DBHelper.idbOpenTransaction(restaurants);
           callback(null, restaurants);
           });
        }
  // create indexedDB transaction
  static idbOpenTransaction(restaurants){
    let dbPromise = DBHelper.openIDB();
        dbPromise.then(function(db){
            var tx = db.transaction("restaurants", "readwrite");
            var restaurantStore = tx.objectStore("restaurants");
            restaurants.forEach(restaurant => restaurantStore.put(restaurant));
          return tx.complete })
          .then(function() { // successfully added restaurants to IndexDB
           console.log("Restaurants added to Index DB successfully")
          })
          .catch(function(error) {
           // failed adding restaurants to IndexDB
              console.log(error);
          });
  }

  /*** Offline data request from indexedDB if there is no connection
     **  Method takes callback parameter
     **
  **/
  static offlineIDBRequest(callback){
    let offline = online = !window.navigator.onLine;
    let dbPromise = DBHelper.openIDB();
      dbPromise.then(db=>{
        let tx = db.transaction('restaurants', 'readwrite');
        let restaurants = objectStore('restaurants');
        return restaurants.getAll();})
        .then(restaurants=>{
        if(!restaurants.length == 0 && offline){
          callback(null, restaurants);
        }
      });
  }

    /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
      }
    );
    return marker;

  }
static updateFav(id, isFav) {
    const linkStat = DBHelper.DATABASE_URL+`/restaurants/${id}/?is_favorite=${isFav}`;
    let dbPromise = DBHelper.openIDB();

    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      if (error) return;
      restaurant.is_favorite = isFav;
      dbPromise.then(db => {
        const storeName = "restaurants";
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.put(restaurant).then(id => {
          console.log(tx);
          console.log(linkStat);
          console.log(restaurant.is_favorite);
          if(navigator.online){
          fetch(linkStat, {
            method: "PUT"
          });}

        });
        return tx.complete;
      });
      return restaurant;
    });
  }


/*// updating server and hadling favourite offline
  static handleFavouriteWheneOffline(isFav, restaurant) {
    window.addEventListener('online', (event)=>{
      DBHelper.handleFavourite(isFav, restaurant);
    });
  }
  static handleFavourite(isFav,restaurant) {
    fetch(`${DBHelper.DATABASE_URL}${restaurant.id}/?is_favorite=${isFav}`,{
      method: 'PUT'
    }).then((response) => {
      return response.json();
    }).then((json) => {
      let dbPromise = DBHelper.openIDB();
       dbPromise.then((db) => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants').index('id');
        store.put(restaurant);
        return tx.complete;
    });
      updateFavoriteRestaurantOS(restaurant) ;
      console.log('test '+json).stringify();
    }).catch((err) => {
      const error = (`Request failed. Returned status of ${err}`);
      console.log(error);
    });
  }
*/
// Favorite update to the server




}
