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

router.post('/',upload.single('image'), function(req, res){
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
    function(useremail,connection,callback){
             console.log(useremail.userEmail);
      let query = 'insert into my_recipe_comment set ?';

        let data = {
          myrecipe_title : req.body.title,
          myrecipe_text : req.body.content,
          myrecipe_image_url : imageUrl,
          myrecipe_count : 0,
          user_email : useremail,
          myrecipe_post_time : moment().format('MMMM Do YYYY, h:mm:ss a')
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
