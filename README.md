## KFC API 

A small REST API written in Node.js with express to serve as the MVP backend for a restaurant 
location and menu storage app. 

##/location
    *Post: post body( query )
        posting to this endpoint will update the locations present in the DB. Adding in the query   
        to the post body will determine the search string used to update the databse. Otherwise it 
        defaults to kfc.
    *GET : query ( lat, lng, rad)
        this returns all the locations within a search radius rad (in km) in increasing order of their  
        distance from the geopoint (lat, lng). If any of these is omitted then it defaults to the geopoint
        representing the Nairobi city center. 


##/menu
    *Post: post body( item, price)
        posting to this endpoint will add a new item with price to the database. 

    *Get: query(price)
        this returns all the items in the menu database. including a non-null price will return 
        the items in addition to their prices.
        
        
