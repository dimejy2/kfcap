var express = require('express');
var router = express.Router();
var GooglePlaces = require("googleplaces");
var googlePlaces = new GooglePlaces("AIzaSyBmhvJ1oBzoNc_JLakpD6a_cHlf8pNEh-Y", "json"); 
var redis = require('redis'),
    client = redis.createClient(); 
var proximity = require('geo-proximity').initialize(client)
var url = require('url') ;

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.route('/location')
.post(function(req, res){
    var queryString ="KFC, Nairobi, restaurant";   
    if (req.body.query) queryString = req.body.query;  
    parameters = {
        query: queryString 
    };
    googlePlaces.textSearch(parameters, function (err, response) {
        var locations = []; 
        if(err){ res.send(err); }

        var results  = response.results; 
        for(i = 0; i < results.length; i++){
            console.log(i); 
            temp = []; 
            temp[0] = results[i].geometry.location.lat; 
            temp[1] =results[i].geometry.location.lng;  	
            temp[2] = results[i].formatted_address; 
            locations[i] = temp; 
        }	
        proximity.addLocations(locations, function(err, reply){
            if(err) console.error(err); 
            else console.log('added locations:', reply); 
        }); 			
        res.send({"Success" :true, "message" : "updated locations"});
        res.end(); 
    });
})
.get(function(req, res){
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query; 
    var lat = query.lat;
    var lng = query.lng; 
    var rad = query.rad; 
    if(!lat || !lng || !rad ){		

        closest(res, -1.3048035,36.8473969, 10000); 
    }	else{
        console.log(lat);

        closest(res, lat, lng, rad ); 
    }


}); 

var closest = function(res, lat, lng, rad){
    proximity.nearby(lat, lng, rad, function(err, locations){
        if(err){ console.error(err); 
            console.log(err); 
        }else if(locations.length !== 0 ){
            res.send(locations);
            res.end();
        }
        else{
            res.send("your search radius does not include any KFC's"); 		
        }		
    }); 

}



router.route('/menu')
.post( function(req, res){

    var item = req.body.item; 
    var price = req.body.price; 
    if(item && price){
        //the next three lines are really bad code but I was in a hurry ¯\_(ツ)_/¯... there are no
        //guarantees that client.sadd and client.hset will suceed but success will be returned
        //in any case... to whoever forks this, you need to use async.js parallel to fix this. Good luck. 

        client.sadd("menuset", item); 
        client.hset("menu",item,price, redis.print);  
        res.send({"Success" : "true" , "message" : "Successfully updated menu"});
    }
    else{
        res.send({"Success" : false , "message" :"please include a valid item and price"}); 
    }

}).get(function(req, res){
    //what follows should really be using some form of streaming... 
    //bad things can happen if the sets get too large
    //it should also allow more complex queries. I believe in you. 
    if(req.query.price) {
        var menuWithPrice = client.hgetall('menu', function(err, cont){
            res.send(cont);
        }); 

    }
    else{ 
        var menuset = client.smembers('menuset', function(err, cont){
            res.send(cont);
        });
    }
}); 

module.exports = router;
