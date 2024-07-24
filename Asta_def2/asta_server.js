const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 8080;

class User{
    constructor(mail, pass) {
        this.email = mail;
        this.password = pass;
    }
}

class Asta{
    constructor(name, id){
        this.name = name;
        this.id = id;
        this.timer = 15;
        this.offers = new Array();
        this.offers.push("No offers yet");
        this.chat = new Array();
        this.chat.push("No messages yet");
        this.over = false;
    }

    startTimer() {
        let intervalId = setInterval(() => {
            if (this.timer > 0) {
                //console.log(`Tempo rimanente per ${this.name}: ${this.timer} secondi`);
                this.timer--;
            } else {
                console.log(`Il timer per ${this.name} è scaduto!`);
                let numbers = new Array(); 
                this.offers.forEach(of =>{
                    numbers.push(of.split(":")[1]);
                });
                let max = Math.max(...numbers);
                let user = this.offers.find((p) => max == p.split(":")[1]);
                io.emit("astaEnd", this.id, user.split(":")[0], max);
                this.over = true;
                clearInterval(intervalId);
            }
        }, 1000);
    }
}

var users = new Array();
var aste = new Array();

app.use(express.json());
app.use(express.static('./www'));

app.post("/Register", (req, res) =>{
    const{email, password} = req.body;
    let user = new User(email, password);
    users.push(user);

    res.json({success:true});
})

app.post("/Login", (req, res) => {
    const{email, password} = req.body;
    let found = false;

    users.forEach(user => {
        if (user.email == email && user.password == password){
            found = true;
            res.json({success:true});
        }})
    
    if (!found)
        return res.status(404).json({error:"Wrong email or password"});
})

app.post("/add", (req, res) =>{
    const{name, id} = req.body;
    let asta = new Asta(name, id);
    aste.push(asta);
    asta.startTimer();
    io.emit("astaAdd");

    res.json({success:true});
})

app.get("/load", (req, res) => {
    let timers = new Array();
    aste.forEach(asta => {
        timers.push(asta.timer);
    })
    res.json({aste: aste, timers: timers});
})

app.get("/enter", (req, res) =>{
    res.json({aste: aste});
})

app.post("/offer", (req, res) => {
    const {offer, id} = req.body;
    if (aste[id-1].offers[0] == "No offers yet")
        aste[id-1].offers = [];
    aste[id-1].offers.push(offer);

    res.json({success:true});
})

app.post("/message", (req, res) => {
    const {message, id} = req.body;
    if (aste[id-1].chat[0] == "No messages yet")
        aste[id-1].chat = [];
    aste[id-1].chat.push(message);

    res.json({success: true});
})

server.listen(port, () =>{
    console.log(`Server is running on http://localhost:${port}`);
})

