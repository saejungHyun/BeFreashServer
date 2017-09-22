const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

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
    //메인에서 메거진 항목으로 보일 6개를 불러옴
    function(useremail,connection,callback){
      let query = 'select * from restaurant order by restaurant_id desc limit 6';
      connection.query(query,function(err,restaurantData){
        if(err){
            res.status(501).send({
              msg : "query err"
            });
            connection.release();
            callback("query err : "+ err, null);
        }
        else{
        let finaldata=[];
        for(let i = 0 ; i < restaurantData.length ; i++){
          let data = {
            id : restaurantData[i].restaurant_id,
            imageUrl : restaurantData[i].restaurant_image_url,
            title : restaurantData[i].restaurant_title,
            location : restaurantData[i].restaurant_location_image_url,
            content : restaurantData[i].restaurant_content,
            checkSaveList : false
                     };
                     finaldata.push(data);
                }
         callback(null,finaldata,useremail,connection);
       }
      });
    },
    //데이터 가공
    function(datalist,useremail,connection,callback){
      let query = 'select my_savelist_origin_id from my_savelist where user_email = ? and my_savelist_from = 3';
      connection.query(query, useremail, function(err, saveddata){
        if(err){
          res.status(501).send({
            msg : "savelist query err"
          });
          connection.release();
          callback("query err : "+err,null);
        }
        else{
          callback(null,saveddata,datalist,useremail,connection);
        }
      });
    },
    function(saveddata,datalist,useremail,connection,callback){
      let count = 0;
      async.whilst(
        function(){
          return count < datalist.length;
        },
        function(loop){
          for(let i = 0 ; i < saveddata.length; i++){
            if(datalist[count].id == saveddata[i].my_savelist_origin_id){
              datalist[count].checkSaveList = true;
            }
          }
          count++;
          loop(null);
        },
        function(err){
          callback(null,datalist,connection);
        }
      );
    },
    //가공한데이터 클라에게 전송
    function(resfinaldata, connection, callback){
      res.status(201).send({
        msg : "ok",
        data : resfinaldata
      });
      callback(null,connection);
    },

    //커넥션 해제
    function(connection, callback){
        connection.release();
      callback(null,"o~~~~k");
    }



  ];

  async.waterfall(task_array, function(err, result){
    if(err){
      console.log(err);
    }
    else console.log(result);
  });
 });

  module.exports = router;
