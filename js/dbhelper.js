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
          let dbPromise = idb.open("restaurant_stage-2",3, upgradeDB => {
             switch(upgradeDB.oldVersion){
                     case 0:
                            upgradeDB.createObjectStore("restaurants", {keyPath:"id"})
                            .createIndex('restaurants', 'id');
                    case 1:
                            upgradeDB.createObjectStore('reviews', {keyPath:'id'})
                            .createIndex('restaurant_id', 'restaurant_id');
                    case 2:
                            upgradeDB.createObjectStore('off_reviews')
                            .createIndex('restaurant', 'restaurant_id');
                    }
        });

    return dbPromise;
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
           console.log("restaurants added to Index DB successfully")
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
// updating server and hadling favourite offline
  static handleFavouriteWheneOffline(isFav, restaurant) {
    window.addEventListener('online', (event)=>{
      DBHelper.handleFavourite(isFav, restaurant);
    });
  }
  static handleFavourite(isFav,restaurant) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${isFav}`,{
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
   /**
   * send review when offline
   */
  static sendReviewsWhenOnline(review){
    addToOffLineReviewsStore(review);
    window.addEventListener('online', (event)=>{
      console.log('online');
      getOfflineReviews(review.restaurant_id).then((reviews)=>{
        reviews.map((review)=>{
          DBHelper.addReview(review);
        });
      }).catch((err)=>{
      });
      let elements = document.querySelectorAll('.offline');

      [].forEach.call(elements, function(element) {
        element.classList.remove('offline');
      });

     clearOffLineReviews();
    });
  }
  //Sedding form review to indexedDB and server
  static addReview(review) {
    // console.log(review + "dsf");
    if(!navigator.onLine){
      console.log('offline');
      DBHelper.sendReviewsWhenOnline(review);
      return;
    }
    let rev = {
      restaurant_id: review.restaurant_id ,
      name: review.name ,
      rating: review.rating ,
      comments: review.comments,
    };
    var url = 'http://localhost:1337/reviews/';
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(rev),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then((json) => {
      // addToReviewsOS(json);
       console.log(json);
    })
    .catch(error => console.error('Error:', error));
  }
  // adding, retriving and deleting data in local storage
  static addToOffLineReviewsStore(reviews){
    let dbPromise = DBHelper.openIDB();
    dbPromise.then((db) => {
        const tx = db.transaction('off_reviews', 'readwrite');
        const store = tx.objectStore('off_reviews');
        if(Array.isArray(reviews)){
            reviews.forEach((review)=>{
                store.put(review, review.comments);
            });
        }else{
            store.put(reviews,reviews.comments);
        }
        return tx.complete;
    }).then(()=>{
        //  console.log('added Items to review  store :) ');
    }).catch((error) => {
        // console.log(error);
    });
  }
  static getOfflineReviews(rest_id){
     let dbPromise = DBHelper.openIDB();
    const  promise = new Promise (function(resolve, reject){
           dbPromise.then((db) => {
            const tx = db.transaction('off_reviews', 'readwrite');
            const store = tx.objectStore('off_reviews');
            const index = store.index('restaurant');
            const reviews = index.getAll(rest_id);
            // console.log(reviews.json());
            // console.log('get items from store ..');
            return reviews;
        }).then((reviews)=>{
            if(reviews){
                // console.log('get items from store ..');
                resolve(reviews);
            }
            else
                reject('no reviews');
                // console.log(reviews);
        }).catch((error) => {
            reject('no data');
            console.log(error);
        });
    });
    return promise;
}
static clearOffLineReviews(){
      let dbPromise = DBHelper.openIDB();
        dbPromise.then((db) => {
            const tx = db.transaction('off_reviews', 'readwrite');
            const store = tx.objectStore('off_reviews');
            const index = store.index('restaurant');
            store.clear();
            return tx.complete;
        }).then(()=>{
            // console.log('cleared');
        }).catch((error) => {
            console.log(error);
        });
}
// Getting reviews from the server port:1337
  static fetchAllRestaurantReviews(id) {
     const promise = new Promise((resolve, reject)=>{
      fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`).then((response) => {
          console.log('fetched');
          return response.json();
      }).then((reviews) => {
          DBHelper.putReviewInIndexDB(reviews);
          resolve(reviews);
      }).catch((err) => {
          console.log(`Request failed. Reviews failed fetched .. ${err}`);
            DBHelper.getReviewsFromIndexedDB(id).then((reviews)=>{
                 console.log('promise hh resolvee',reviews);
                resolve(reviews);
            }).catch((error)=>{
                // console.log('promise  hh reject',error);
                reject(error);
                });
            });
      });
    return promise ;
  }
// Putting it into the indexedDB
  static putReviewInIndexDB(reviews){
    let dbPromise = this.openIDB();
   return dbPromise.then((db) => {
        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        if(Array.isArray(reviews)){
            reviews.forEach((review)=>{
                store.put(review);
            });
        }else{
            store.put(reviews,'reviews');
        }
        return tx.complete;
    }).then(()=>{
         console.log('Reviews Items added to review  store :) ');
    }).catch((error) => {
        console.log(error);
    });
  }

  // get data when offline
  static getReviewsFromIndexedDB(restaurant_id){
    const  promise = new Promise (function(resolve, reject){
        dbPromise.then((db) => {
            const tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            const index = store.index('restaurant_id');
            const reviews = index.getAll(restaurant_id);
            // console.log(reviews.json());
            // console.log('get items from store ..');
            return reviews;
        }).then((reviews)=>{
            if(reviews){
                console.log('get items from store ..');
                resolve(reviews);
            }
            else
                reject('no reviews');
                console.log(reviews);
        }).catch((error) => {
            reject('no data');
            console.log(error);
        });
    });
    return promise;
}

}
