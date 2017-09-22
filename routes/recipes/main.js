//localhost:3000/recipes/all


const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/', function(req, res) {
    let task_array = [
        //1. connection 설정
        function(callback) {
            pool.getConnection(function(err, connection) {
                if (err) {
                    res.status(500).send({
                        msg: "500 Connection error"
                    });
                    callback("getConnecntion error: " + err, null);
                } else callback(null, connection);
            });
        },
        //2. 쿼리문을 가지고 recipes 테이블에서 전체 데이터를 다 가져옴
        function(connection, callback) {
            let query = 'select * from recipes ';
            connection.query(query, function(err, data) {
                if (err) {
                    res.status(200).send({
                        msg: "query err" + err
                    });
                    connetion.release();
                    callback("query err : " + err, null);
                } else {
                    console.log(data);
                    callback(null, data, connection);
                }
            });


        },
        //3. 가져온 데이터를 가지고 그중 id, subtitle를 제외하고
        // title, image만 재가공
        function(data, connection, callback) {
            let finalData = {
                title: data[0].title,
                image: data[0].image
            };
            callback(null, finalData, connection);

        },
        //4. 재가공한 데이터를 클라이언트에게 전송
        function(finalData, connection, callback) {
            res.status(201).send({
                msg: "ok",
                data: finalData
            });
            callback(null, connection);
        },
        //5. 커넥션 해제
        function(connection, callback) {
            connection.release();
            callback(null, "okokok");

        }
    ];
    async.waterfall(task_array, function(err, result) {
        if (err) console.log(err);
        else console.log(result);
    });
});

/*
클라이언트에게 반환하는 데이터 예
{
  msg : "OK" or "Error + 원인"
  data : {
    reviewes : [
    {
      title : 제목
      image_url : 이미지url
    },
    {
      title : 제목
      image_url : 이미지url
    },
    ......
    ]
  }
}

*/







module.exports = router;
