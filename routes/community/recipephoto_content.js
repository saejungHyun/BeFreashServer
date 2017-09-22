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
      let query = 'select * from my_recipe where myrecipe_id = ?';
      connection.query(query,req.params.id,function(err,photocontentdata){
        if(err){
          res.status(501).send({
            msg : "query error"
          });
          connection.release();
          callback("query err : "+ err, null);
        }
      else{
        let newdata = {
          id : photocontentdata[0].myrecipe_id,
          imageUrl : photocontentdata[0].myrecipe_image_url,
          writerEmail : photocontentdata[0].user_email,
          title : photocontentdata[0].myrecipe_title,
          saveCount : photocontentdata[0].myrecipe_count,
          checkSaveList : false,
          content : photocontentdata[0].myrecipe_text,
        };
        callback(null,newdata,useremail,connection);
        }
      });
    },
    function(newdata,useremail,connection,callback){
      let query = 'select my_savelist_origin_id from my_savelist where user_email = ? and my_savelist_from = 2';
      connection.query(query,useremail,function(err,reciphosavelist){
        if(err){
          res.status(501).send({
            msg : "save query err"
          });
          connection.release();
          callback("query err : "+ err, null);
        }
        else{
          callback(null,reciphosavelist,newdata,useremail,connection);
        }
      });
    },
    function(reciphosavelist,newdata,useremail,connection,callback){
      for(let i=0 ; i<reciphosavelist.length; i++){
        if(newdata.id == reciphosavelist[i].my_savelist_origin_id){
          newdata.checkSaveList = true;
        }
      }
      callback(null,newdata,connection);
    },

    function(postdata,connection,callback){
      let query = 'select * from my_recipe_comment where myrecipe_id = ? order by myrecipe_comment_post_time';
      connection.query(query, postdata.id, function(err, commentdata){
        if(err){
          res.status(501).send({
            msg : "comment query err"
          });
          connection.release();
          callback("comment query err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0 ; i < commentdata.length ; i++){
            let data = {
              commentEmail : commentdata[i].user_email,
              commentContent : commentdata[i].myrecipe_comment_text
            };
            data_list.push(data);
          }
          callback(null,data_list,postdata,connection);
        }
      });
    },
    function(commentdata, postdata, connection, callback){
      let finalData = {
        RecipePhoto : postdata,
        comment : commentdata
      };
      res.status(201).send({
        msg : "Success",
        data : finalData
      });
      connection.release();
      callback(null, "successful find recipe photo content Data");
    }
  ];

  async.waterfall(task_array, function(err, result){
    if(err){
      console.log(err);
    }
    else console.log(result);
  });
 });


 router.post('/comment', function(req,res){
   task_array=[
     function(callback){
       console.log("11");
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
              console.log("22");
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
              console.log(useremail.userEmail);
       let query = 'insert into my_recipe_comment set ?';

         let data = {
           myrecipe_comment_text : req.body.comment,
           myrecipe_comment_post_time : moment().format('MMMM Do YYYY, h:mm:ss a'),
           myrecipe_id : req.body.id,
           user_email : useremail
         };
         console.log(data);
         connection.query(query,data,function(err){
           if(err){
             res.status(501).send({
               msg : "comment err"
             });
             connection.release();
             callback("comment err : "+ err, null);
           }
           else{
             res.status(201).send({
               msg : "Success"
             });
             connection.release();
             callback(null, "okok ");
           }
         });
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
