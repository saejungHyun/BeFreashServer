const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const async = require('async');
const multerS3 = require('multer-s3');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'saejungtest1',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});


router.get('/', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(500).send({
            msg : "500 Connection error"
          });
          callback("getConnecntion error at login: " + err, null);
        }
				else callback(null, connection);
			});
		},
    //2. header의 token 값으로 user_email 받아옴.
    function(connection, callback){
      let token = req.headers.token;
      jwt.verify(token, req.app.get('jwt-secret'), function(err, decoded){
        if(err){
          res.status(501).send({
            msg : "501 user authorization error"
          });
          connection.release();
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(useremail, connection, callback){
       let query = 'select * from my_recipe'+' order by myrecipe_post_time desc'+' limit 6';
       connection.query(query,function(err,myrecipeData){
         if(err){
             res.status(501).send({
               msg : "query err"
             });
             connection.release();
             callback("query err : "+ err, null);
         }
         else{
         let finaldata=[];
          for(let i = 0 ; i < myrecipeData.length ; i++){
            let data;
            data = {
              id : myrecipeData[i].myrecipe_id,
              imageUrl : myrecipeData[i].myrecipe_image_url,
              title : null,
              from : 2
            };
            finaldata.push(data);
          }
          callback(null,finaldata,useremail,connection);
        }
      });
    },
    function(myrecipeData,useremail,connection,callback){
      let query = 'select restaurant_id,restaurant_image_url from restaurant order by restaurant_id desc limit 6';
      let finaldata = [];
      connection.query(query, function(err, restaurantdata){
        if(err){
          res.status(501).send({
            msg : "query err"
          });
          callback("query err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < restaurantdata.length; i++){
            let data;
            data = {
              id : restaurantdata[i].restaurant_id,
              imageUrl : restaurantdata[i].restaurant_image_url,
              title : null,
              from : 3
            };
            finaldata.push(data);
          }
          callback(null, finaldata, myrecipeData, useremail, connection);
        }
      });
    },
    function(restaurantdata, myrecipeData, useremail, connection, callback){
      let query = 'select * from magazine order by magazine_id desc limit 6';
      let finaldata = [];
      connection.query(query, function(err, magazineData){
        if(err){
          res.status(501).send({
            msg : "query err"
          });
          callback("query err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < magazineData.length; i++){
            let data;
            data = {
              id : magazineData[i].magazine_id,
              imageUrl : magazineData[i].magazine_image_url,
              title : magazineData[i].magazine_title,
              from : 4
            };
            finaldata.push(data);
          }
          callback(null, finaldata, restaurantdata, myrecipeData, useremail, connection);
        }
      });
    },
    function(magazineData, restaurantdata, myrecipeData, useremail, connection, callback){
      let query = 'select save.my_savelist_id, origin.myrecipe_id, origin.myrecipe_image_url'+
      ' from my_savelist save inner join my_recipe origin'+
      ' on save.my_savelist_origin_id = origin.myrecipe_id and save.my_savelist_from = 2 and save.user_email = ?'+
      ' order by save.my_savelist_id desc'+
      ' limit 6';
      connection.query(query, useremail, function(err, savedreciphoto){
        if(err){
          res.status(501).send({
            msg : "query err"
          });
          connection.release();
          callback("query err : "+ err, null);
        }
        else{
          let finaldata = [];
          for(let i = 0; i< savedreciphoto.length; i++){
            let data;
            data = {
              id : savedreciphoto[i].myrecipe_id,
              imageUrl : savedreciphoto[i].myrecipe_image_url,
              title : null,
              from : 2,
              checkSaveList : true,
              forSort : savedreciphotoo[i].my_savelist_id
            };
            finaldata.push(data);
          }
          callback(null, finaldata, magazineData, restaurantdata, myrecipeData, useremail, connection);
        }
      });
    },
    function(savelist, magazineData, restaurantdata, myrecipeData, useremail, connection, callback){
      let query = 'select save.my_savelist_id, origin.restaurant_id, origin.restaurant_image_url'+
      ' from my_savelist save inner join restaurant origin'+
      ' on save.my_savelist_origin_id = origin.restaurant_id and save.my_savelist_from = 3 and save.user_email = ?'+
      ' order by save.my_savelist_id desc'+
      ' limit 6';
      connection.query(query, useremail, function(err, saveres){
        if(err){
          res.status(501).send({
            msg : "query err"
          });
          connection.release();
          callback("query err : "+ err, null);
        }
        else{
          for(let i = 0; i< saveres.length; i++){
            let data;
            data = {
              id : saveres[i].restaurant_id,
              imageUrl : saveres[i].restaurant_image_url,
              title : null,
              from : 3,
              checkSaveList : true,
              forSort : saveres[i].my_savelist_id
            };
            savelist.push(data);
          }
          callback(null, savelist, magazineData, restaurantdata, myrecipeData, useremail, connection);
        }
      });
    },
    function(savelist, magazineData, restaurantdata, myrecipeData, useremail, connection, callback){
      let query = 'select save.my_savelist_id, origin.magazine_id, origin.magazine_title, origin.magazine_image_url'+
      ' from my_savelist save inner join magazine origin'+
      ' on save.my_savelist_origin_id = origin.magazine_id and save.my_savelist_from = 4 and save.user_email = ?'+
      ' order by save.my_savelist_id desc'+
      ' limit 6';
      connection.query(query, useremail, function(err, savemagazine){
        if(err){
          res.status(501).send({
            msg : "query err"
          });
          connection.release();
          callback("query err : "+ err, null);
        }
        else{
          for(let i = 0; i< savemagazine.length; i++){
            let data;
            data = {
              id : savemagazine[i].magazine_id,
              imageUrl : savemagazine[i].magazine_image_url,
              title : savemagazine[i].magazine_title,
              from : 4,
              checkSaveList : true,
              forSort : savemagazine[i].my_savelist_id
            };
            savelist.push(data);
          }
          callback(null, savelist, magazineData, restaurantdata, myrecipeData, useremail, connection);
        }
      });
    },
    function(savelist, magazineData, restaurantdata, myrecipeData, useremail, connection, callback){
      if(savelist.length <7){
        callback(null, savelist, magazineData, restaurantdata, myrecipeData, useremail, connection);
      }
      else{
        let by = function(name) {
          return function(o, p) {
            let a, b;
            a = o[name];
            b = p[name];
            return a < b ? 1 : -1;
          };
        };
        savelist.sort(by('forSort'));

        let finalSaved = [];
        for(let i = 0 ; i < 6; i++){
          finalSaved.push(savelist[i]);
        }
        callback(null, finalSaved, magazineData, restaurantdata, myrecipeData, useremail, connection);
      }
    },
    function(saveData,magazineData, restaurantdata, myrecipeData, useremail, connection, callback){
      var finalData = {
        RecipePhoto : myrecipeData,
        Restaurant : restaurantdata,
        Magazine : magazineData,
        SaveList : saveData
      };
      res.status(200).send({
        msg : "Success",
        data : finalData
      });
      connection.release();
      callback(null, "successful find main data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err){
      err = moment().format('MM/DDahh:mm:ss//') + err;
      console.log(err);
    }
    else{
      result = moment().format('MM/DDahh:mm:ss//') + result;
      console.log(result);
    }
  });
});



module.exports = router;
