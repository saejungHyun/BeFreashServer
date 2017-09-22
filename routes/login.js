//localhost:3000/login
//회원가입 하나 비밃번호 두개 입력받아서 비교하는 과정을 거쳐야 함.
//테이블에 컬럼 이름대로 저장해야함 인서트 시키고 로그인시에는 포스트로 받은걸
//디비랑 비교해서 찾아야함
//입력받는 이메일을 찾아서 있으면 그 이메일에 대한 비밀번호를 비교해서 둘다 맞으면
//로그인 시키는것
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const saltRounds = 10;

router.post('/', function(req, res){
	let task_array = [
		//1. connection설정
		function(callback){
			pool.getConnection(function(err, connection){
				if(err) callback("getConnecntion error at login: " + err, null);
				else callback(null, connection);
			});
		},
		//2. 입력된 email을 DB에서 찾음
		function(connection, callback){
			let getMailPwdQuery = 'select user_email, user_pwd from users where users.user_email=?';
			connection.query(getMailPwdQuery, req.body.email, function(err,userdata){
				if(err){
					connection.release();
					callback("1st query err at login : "+err, null);
				}
				else callback(null, userdata, connection);
			});
		},
		//3. 입력된 email이 없을시 이메일이 없다고함, 비밀번호 틀릴시 비밀번호 틀렸다고함
		function(userdata, connection, callback){
			if(userdata.length===0){
				connection.release();
				res.status(401).send({
					msg : "non signed in user"
				});
				callback("non signed in user", null);
				}
			else{
				bcrypt.compare(req.body.pwd, userdata[0].user_pwd, function(err, login){
					if(err) callback("password compare error : "+ err,null);
					else{
						if(login){
							callback(null, userdata[0].user_email, connection);
						}
						else{
							connection.release();
							res.status(401).send({
								msg : "wrong password"
							});
							callback("wrong password", null);
						}
					}
				});
			}
		},
    //4. email이 있고 password 일치시 로그인 성공후 jwt 토큰발행, connection 해제.
    function(userEmail, connection, callback){
			const secret = req.app.get('jwt-secret');
			console.log(secret);
			console.log(userEmail);
      let option = {
        algorithm : 'HS256',
			  expiresIn : 3600 * 24 * 10 // 토큰의 유효기간이 10일
      };
      let payload = {
        user_email :userEmail
      };
      let token = jwt.sign(payload, req.app.get('jwt-secret'), option);
      res.status(201).send(
        {
					msg : "Success",
          token : token
        });
			connection.release();
			callback(null, "successful login");
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
