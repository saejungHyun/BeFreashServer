const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/:id', function(req,res){
  task_array=[
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
    function(useremail,connection,callback){
      let query = 'select * from magazine where magazine_id = ?';
      connection.query(query,req.params.id,function(err,magazinedata){
        if(err){
          res.status(501).send({
            msg : "501 get magazine content error"
          });
          connection.release();
          callback("getDataQuery err : "+ err, null);
        }
      else{
        let newdata = {
          id : magazinedata[0].magazine_id,
          content : magazinedata[0].magazine_content_image_url,
          checkSaveList : false
        };
        callback(null,newdata,useremail,connection);
        }
      });
    },
    function(newdata,useremail,connection,callback){
      let query = 'select my_savelist_origin_id from my_savelist where user_email = ? and my_savelist_from = 4';
      connection.query(query,useremail,function(err,magsavelist){
        if(err){
          res.status(501).send({
            msg : "save query err"
          });
          connection.release();
          callback("query err : "+ err, null);
        }
        else{
          callback(null,magsavelist,newdata,useremail,connection);
        }
      });
    },
    function(magsavelist,newdata,useremail,connection,callback){
      for(let i=0 ; i<magsavelist.length; i++){
        if(newdata.id == magsavelist[i].my_savelist_origin_id){
          newdata.checkSaveList = true;
        }
      }
      callback(null,newdata,connection);
    },

   function(newdata, connection, callback){
     res.status(201).send({
       msg : "ok",
       data : newdata
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
