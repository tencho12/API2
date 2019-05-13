//use express module
const express = require('express');
//use bodyParser middleware
const bodyParser = require('body-parser');
//use mysql database
const mysql = require('mysql');
const app = express();
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt= require('jsonwebtoken')
//Setting port number
const port = process.env.PORT || 47;

process.env.SECRET_KEY = 'secret'

const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'home_automation_db'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())

//connecting to database
mysqlConnection.connect((err) => {
    if (!err)
        console.log('DB connection successful');
    else
        console.log('connection failed \n Error: ' + JSON.stringify(err, undefined, 2));
});

//server listening
app.listen(port, () => {
    console.log('Server is running at port ' + port);
});


app.get('/home', function (req, res) {
    var sql = "SELECT room_tb.room_id, room_tb.room_name, room_tb.automated, status_tb.component_id, status_tb.component_name, status_tb.status FROM status_tb INNER JOIN room_tb ON status_tb.room_id = room_tb.room_id";
    mysqlConnection.query(sql, (err, rows, fields) => {
        if (!err) {
            res.send(rows)
        }
        else
            res.send("error")
    });
}); 

app.post('/updateAuto', function (req, res) {
    var sql = "UPDATE room_tb SET automated=? WHERE room_id=?";
    var value=[req.body.auto, req.body.room_id]
    mysqlConnection.query(sql, value, (err, rows, fields) => {
        if (!err) {
             res.send(rows)
        }
        else
            res.send("error")
    });
});

app.post('/updateStatus', function (req, res) {
    var sql = "UPDATE status_tb SET status=? WHERE component_id=?";
    var value = [req.body.auto, req.body.comp_id]
    mysqlConnection.query(sql, value, (err, rows, fields) => {
        if (!err) {
            res.send(rows)
        } else {
            res.send(err)
        }
    });
});

app.post('/login', function (req, res) {
    var sql = "SELECT * from user_tb where email=? LIMIT 1";
    var value = req.body.email;
    mysqlConnection.query(sql, value, (err, rows, fields) => {
        if (rows.length>0 && !null) {
            var password = rows[0].password;
            var userData = {}
            userData['user_id'] = rows[0].user_id
            userData['email'] = rows[0].email
            userData['password'] = rows[0].password
            userData['user_name'] = rows[0].user_name
            userData['location'] = rows[0].location
            userData['house_number'] = rows[0].house_number
            if (rows.length) {
                if (bcrypt.compareSync(req.body.password, password)) {
                    let token = jwt.sign(userData, process.env.SECRET_KEY, {
                        expiresIn: '1440h'
                    })
                    res.send(token)
                } else {
                    res.send({
                        errorOccurred: 'true',
                        error: 'Password does not match!'
                    });
                }
            } else {
                res.send({
                    errorOccurred: 'true',
                    error: 'No such user!'
                });
            }
        } else {
            res.send({
                errorOccurred: 'true'
            });

        }    
    });
});

// app.post('/register', (req, res) => {
    
//     let sql = "SELECT * FROM user_tb WHERE email=?";
//     let values = req.body.email;
//     mysqlConnection.query(sql, values, (err, rows, fields) => {
//         console.log(rows.length)
//         if (rows.length<0) {
//             res.send("check")
//             bcrypt.hash(req.body.password, 10, (err, hash) => {
//                 var pass = hash

//                 let sql = "INSERT INTO user_tb(user_name,email,password,location,house_number) VALUES (?,?,?,?,?)";
//                 let values = [req.body.user_name, req.body.email, pass, req.body.location, req.body.house_number];
//                 mysqlConnection.query(sql, values, (err, rows, fields) => { 
//                     res.send(rows)
//                 })
//             })
//         } else {
//              res.json({ error: "user already exist" })
//         }
//     })
// });

app.post('/updateProfile', function (req, res) {

    var sql = "SELECT password from user_tb WHERE user_id=?";
    var value = req.body.user_id;
    mysqlConnection.query(sql, value, (err, rows, fields) => {
        if (rows.length) {
            var cpass = rows[0].password
            if (bcrypt.compareSync(req.body.cpassword, cpass)) {
                var sql = "UPDATE user_tb SET user_name=?, email=?, password=?, location=?, house_number=? WHERE user_id=?";
                var password;
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    password = hash
                    var value = [req.body.user_name, req.body.email, password, req.body.location, req.body.house_number, req.body.user_id]
                    mysqlConnection.query(sql, value, (err, rows, fields) => {
                        if (rows) {
                            res.send(rows)
                        } else {
                            res.send({
                                errorOccurred: 'true',
                                error: 'Something is wrong'
                            });
                        }
                    });
                });
            } else {
                res.send({
                    errorOccurred: 'true',
                    error:'Password does not match!'
                });
            }
            
        } else {
            res.send({
                errorOccurred: 'true',
                error: 'No such user found!'
            });
        }
    });
});