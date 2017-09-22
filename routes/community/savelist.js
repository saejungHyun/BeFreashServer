const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

//3개만들어야함
router.get('/',function(req,res){
  res.send("OK");
});
router.get('/magazine', function(req, res) {
    let task_array = [
        //1. connection 설정
        function(callback) {
            console.log("########1111111111111111111111");
            pool.getConnection(function(err, connection) {
                if (err) {
                    res.status(500).send({
                        msg: "500 Connection error"
                    });
                    callback("getConnecntion error at login: " + err, null);
                } else callback(null, connection);
            });
        },
        //2. header의 token 값으로 user_email 받아옴.
        function(connection, callback) {
            console.log("########2222222222222222222");
            let token = req.headers.token;
            jwt.verify(token, req.app.get('jwt-secret'), function(err, decoded) {
                if (err) {
                    res.status(501).send({
                        msg: "501 user authorization error"
                    });
                    connection.release();
                    callback("JWT decoded err : " + err, null);
                } else callback(null, decoded.user_email, connection);
            });
        },
        function(useremail, connection, callback) {
            console.log("########33333333333333333333333");
            let query = 'select save.my_savelist_id,origin.magazine_id,origin.magazine_title,origin.magazine_image_url' +
                ' from my_savelist save inner join magazine origin' +
                ' on save.my_savelist_origin_id = origin.magazine_id and save.my_savelist_from=4 and save.user_email = ?' +
                ' order by save.my_savelist_id desc';

            connection.query(query, useremail, function(err, magazinesavedata) {
                if (err) {
                    res.status(501).send({
                        msg: "magazine savelist query err"
                    });
                    connection.release();
                    callback("magazine savelist query err : " + err, null);
                } else {

                  let finaldata = [];
                    console.log("here!!");
                    for (let i = 0; i < magazinesavedata.length; i++) {
                        let tempdata = {
                            id: magazinesavedata[i].magazine_id,
                            imageUrl: magazinesavedata[i].magazine_image_url,
                            title: magazinesavedata[i].magazine_title,
                            checkSaveList: true
                        };
                        finaldata.push(tempdata);
                    }
                    callback(null, finaldata, connection);
                }
            });


        },
        function(finaldata, connection, callback) {
            console.log("########44444444444444444444444");
            res.status(200).send({
                msg: "Success",
                data: finaldata
            });
            connection.release();
            callback(null, "save magazine is ok");
        }



    ];
    async.waterfall(task_array, function(err, result) {
        if (err) {
            err = moment().format('MM/DDahh:mm:ss//') + err;
            console.log(err);
        } else {
            result = moment().format('MM/DDahh:mm:ss//') + result;
            console.log(result);
        }
    });
});




module.exports = router;
