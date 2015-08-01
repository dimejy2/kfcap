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

router.get('/update', function(req, res){

	parameters = {
		query:"KFC, Nairobi, kenya, restaurant" 
	};
	googlePlaces.textSearch(parameters, function (err, response) {
		var locations = []; 
		if(response === null){
			console.log(err); 
			return; 
		}


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
		res.send(locations);
		res.end(); 
	});
}); 



router.get('/closest', function(req, res){
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query; 
	//console.log(query); 
	var lat = query.lat;
	var lng = query.lng; 
	var rad = query.rad; 
	if(lat === null || lng === null || rad === null ){		

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
	}); }



router.get('/addMenuItem', function(req, res){
	var url_parts = url.parse(req.url, true); 
	var query = url_parts.query; 
	var item = query.item; 
	var price = query.price; 
	if(item !== null && price !== null){
		client.sadd("menuset", item); 
		res.send(client.hset("menu",item,price, redis.print));
		res.end(); 
	}
	else{
		res.send("please include a valid item and price ")
			res.end();
	} 
}); 

router.get('/allMenuItems', function(req, res){
	var menuset = client.smembers('menuset', function(err, cont){
		console.log( cont);
		res.send(cont);
		res.end(); 
	});
}); 


router.get('/allMenuItemsPrice', function(req, res ){
	var menuWithPrice = client.hgetall('menu', function(err, cont){
		console.log(cont); 
		res.send(cont);
		res.end(); 	
	}); 

}); 

module.exports = router;
