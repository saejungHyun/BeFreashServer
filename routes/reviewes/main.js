//localhost:3000/reviewes/main
//localhost:3000/reviewes/main/registration


const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
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
          callback("getConnecntion error: " + err, null);
        }
				else callback(null, connection);
			});
		},
    //2. 쿼리문을 가지고 reviewes 테이블에서 전체 데이터를 다 가져옴
    function(connection, callback){
      let query = 'select * from reviewes ';
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
    //3. 가져온 데이터를 가지고 그중 id를 제외하고 content, writer만 재가공
    function(data, connection, callback){
      let finalData = {
          content: data[0].content,
          writer: data[0].writer
      };
      callback(null, finalData, connection);

    },
    //4. 재가공한 데이터를 클라이언트에게 전송
    function(finalData, connection, callback){
      res.status(201).send({
        msg : "ok",
        data : finalData
      });
       callback(null,connection);
    },
    //5. 커넥션 해제
    function(connection, callback){
      connection.release();
      callback(null,"o~~~~k");

    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});


router.post('/registration',function(req,res){

     let task_array = [
       //처음에는 받는거 없으니까 콜백 하나 들어감
       function(callback){
         pool.getConnection(function(err, connection){
           if(err){
             res.status(500).send({
               msg : "500 Connection error"
             });
             callback("getConnecntion error: " + err, null);
           }
           else callback(null, connection);
         });

       },
       //받은 데이터 가공
        function(connection,callback){
          console.log(req.body.writer);
          let writer = req.body.writer;
          let text = req.body.text;
          //디비의 컬럽과 순서 맞추어야함
          let data = {
            content:text,
            writer:writer
          };
          callback(null,data,connection);

        },
       //쿼리문
        function(data,connection,callback){
          //업데이트는 일부분을 업데이트하는 것이지만 인설트는 한번에 넣는것이므로
            let query = 'insert into reviewes set ?';
            connection.query(query,data,function(err){
              if (err) {
                res.status(500).send({
                msg : "query err" + err
              });
               connetion.release();
               callback("query err : " + err, null);
            }
              else{
               callback(null,connection);
              }

            });

        },
        //커넥션
        function(connection, callback){
          res.status(200).send({
            msg:"ok"
          });
            connection.release();
          callback(null,"o~~~~k");
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
      content : 리뷰내용
      writer : 작성자
    },
    {
      content : 리뷰내용
      writer : 작성자
    },
    ......
    ]
  }
}

*/


/*
  post 요청메세지
{
  writer : "쓴 사람",
  text : "내용"
}
*/



module.exports = router;
