const chatServer = require('./chat-server');

const WebSocketServer = require("ws").Server
const PORT = process.env.PORT || 8000;

const express = require('express');
const app = express();
var mysql = require('mysql');
const bp = require('body-parser');
app.use(bp.json());
app.use(bp.urlencoded({
  extended: true
}));


var bodyParser = require('body-parser');
/*
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  //password: "",
  password: "bigpassword",
  database: "Medly"
});

con.connect(function(err) {
  if (err) throw err;
  console.log('Connected!');
  
  con.query('CREATE DATABASE Medly', function (err, result) {  
    if (err) throw err;  
    console.log('Database created'); 
  })
 
  var sql = "CREATE TABLE user (id INT AUTO_INCREMENT PRIMARY KEY, login VARCHAR(255), password VARCHAR(255), mail VARCHAR(255), phone INTEGER, vitalnumber INTEGER, type TINYINT(1))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
  });
  
  var sql = "INSERT INTO user (login, password, mail, phone, vitalnumber, type) VALUES ('Rayan', 'rayan', 'rayan.boudjemai@eemi.com', '058448547', '4848974', '1')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
  
});
*/
const server = require('http').createServer(app);
app.set("views", __dirname + "/views");
app.get('/userpage', function (req, res) {
  app.use(express.static(__dirname + '/public'));
  app.get('/', function (req, res) {
    res.render('Connection.ejs');
  });
  app.get('/drive', function (req, res) {
    res.render('drive.ejs');
  });
  app.get('/connection', function (req, res) {
    res.render('Connection.ejs');

  });

  app.post('/test/submit', function (req, data) {
    //recupere le password
    var Password = req.body.loginPassword;
    //recupere le login
    var Name = req.body.loginName;

  });
  app.get('/signup', function (req, res) {
    res.render('SignUp.ejs');
  });
  app.get('/pageuser', function (req, res) {
    res.render('UserPageJoe.ejs');
  });
  app.set('view engine', 'ejs');


  // con.query("SELECT * FROM user", function (err, result, fields) {
  //   if (err) throw err;
  //   try {
  //     Object.keys(result).forEach(function (key) {
  //       var row = result[key];
  //       var login = row.login;
  //       var mail = row.mail;
  //       var phone = row.phone;
  //       var vitalnumber = row.vitalnumber;
  //       var type = row.type;
  //       res.render("UserPage", {
  //         login: login,
  //         mail: mail,
  //         phone: phone,
  //         vitalnumber: vitalnumber,
  //         type: type
  //       });

  //     });

  //   } catch {
  //     res.send("error");
  //   }
  // });
});
app.get('/visio', function (req, res) {
  res.render('visio.ejs');
});
server.listen(PORT);

const wss = new WebSocketServer({
  server
});

let sockets = [];

wss.on('connection', function (socket) {
  sockets.push(socket);

  socket.on('message', function (msg) {
    handleMessage(parseMsg(msg), this);
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function () {
    sockets = sockets.filter(s => s !== socket);
    handleMessage({
      type: TYPES.DISCONNECTING
    }, socket);
  });
});

const TYPES = {
  NEW_USER: 'newUser',
  SIGNAL_MESSAGE_FROM_CLIENT: 'signal_message_from_client',
  DISCONNECTING: 'disconnecting',
  JOINED_ROOM: 'joined_room',
  SIGNAL_MESSAGE_TO_CLIENT: 'signal_message_to_client'
}

const SIGNAL_TYPES = {
  USER_HERE: 'userHere'
}

function handleMessage({
  type,
  content
}, socket) {
  switch (type) {
    case TYPES.NEW_USER:
      onNewUser(content, socket);
      break;
    case TYPES.SIGNAL_MESSAGE_FROM_CLIENT:
      onSignal(content, socket);
      break;
    case TYPES.DISCONNECTING:
      onDisconnecting(socket);
      break;
    default:
      break;
  };
}

function onNewUser({
  userFrom,
  userTo
}, socket) {

  chatServer.connectUsers(userFrom, userTo, socket);
  const signalingUiid = chatServer.generateSignalingIdForRoom(socket.room);

  const roomMsg = prepareMsg({
    type: TYPES.JOINED_ROOM,
    content: {
      room: socket.room
    }
  });
  broadcastToMe(roomMsg, socket);

  const signalingMsg = prepareMsg({
    type: TYPES.SIGNAL_MESSAGE_TO_CLIENT,
    content: {
      signalType: SIGNAL_TYPES.USER_HERE,
      message: signalingUiid
    }
  });
  broadcastToMe(signalingMsg, socket);

  if (chatServer.areUsersConnected(userFrom, userTo)) {
    console.log(`User ${userFrom} and user ${userTo} are now connected to room ${socket.room}`);
  }
}

function onSignal({
  signalType,
  message
}, socket) {
  const signalingMsg = prepareMsg({
    type: TYPES.SIGNAL_MESSAGE_TO_CLIENT,
    content: {
      signalType,
      message,
      room: socket.room
    }
  });
  console.log('signaling message to broadcast', signalingMsg);
  broadcastToRoomButMe(signalingMsg, socket);
}

function onDisconnecting(socket) {
  console.log('disconnecting from socket');
  chatServer.disconnectUsers(socket.room);
}

function prepareMsg(msg) {
  return JSON.stringify(msg);
}

function parseMsg(msg) {
  return JSON.parse(msg);
}

function broadcastToMe(msg, socket) {
  socket.send(msg);
}

function broadcastToRoomButMe(msg, currSocket) {
  sockets.filter(socket => socket.room === currSocket.room && socket !== currSocket).forEach((socket, i) => {
    socket.send(msg)
  });
}