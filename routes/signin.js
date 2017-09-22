const mysql = require('mysql');
const express = require('express');
const async = require('async');
const bcrypt = require('bcryptjs');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const saltRounds = 10;

router.post('/', function(req, res) {
  let task_array = [
    //1.connection 설정
    function(callback) {
      pool.getConnection(function(err, connection) {
        if (err) callback("getConnection error : " + err, null);
        else callback(null, connection);
      });
    },
    //2. 입력받은 email값이 data에 있는지 검사
    function(connection, callback) {
      console.log(req.body.email);
      let checkEmailQuery = 'select * from users where users.user_email = ?';
      connection.query(checkEmailQuery, req.body.email, function(err, mail) {
        if (err) {res.status(401).send({
          msg : "query err." + err
        });
          connection.release();
          callback("1st query err : " + err, null);
        } else{
          console.log(mail);
          callback(null, mail, connection);
        }
      });
    },
    //3. 없으면 회원가입진행 -> 비밀번호 암호화
    function(mail, connection, callback) {
      if (mail.length === 0) {
        bcrypt.hash(req.body.pwd, saltRounds, function(err, hash) {
          if (err) {
            connection.release();
            callback("Password hashing error : " + err, null);
          } else callback(null, hash, connection);
        });
      } else {
        res.status(401).send({
          msg : "email overlap."
        });
        connection.release();
        callback("email overlap", null);
      }
    },
    //4. 암호화된 비밀번호를 이용해 회원가입 완료.
    function(hash, connection, callback) {
      let query = 'insert into users values(?,?,?,?,?,?)';
      connection.query(query, [req.body.email,hash ,req.body.name, 'N', null, 0], function(err) {
        if (err) {
          connection.release();
          callback("insert error : " + err, null);
        } else {
          res.status(201).send({
            msg : "Success"
          });
          callback(null, connection);
        }
      });
    },
    //5. connection 해제.email overlap
    function(connection, callback) {
      connection.release();
      callback(null, "Successful signin");
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
