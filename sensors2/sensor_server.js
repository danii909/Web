const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const { randomInt } = require("crypto")

const app = express();
const server = http.createServer(app)
const io = socketIo(server)
const port = 8080

app.use(express.json());
app.use(express.static("www"));

class User{
    constructor(email, pass){
        this.email = email;
        this.password = pass;
    }
}

class Sensor{
    constructor(nome, tipo, agg){
        this.name = nome;
        this.type = tipo;
        this.update = agg;
    }
}

var users = new Array();
var sensor = new Array();

//registrazione
app.post("/Register", (req, res)=>{
    const {email, password} = req.body
    us = new User(email, password)
    users.push(us);

    res.json({success:true});
    console.log(users)
});

app.post("/Login", (req, res)=>{
    const {email, password} = req.body
    let found = false;
    for(let i = 0; i<users.length; i++){
        if(users[i].email==email && users[i].password==password){
            found = true;
            res.json({success:true});
        }
    }

    if (!found)
        return res.status(404).json({error:"Wrong email or password"});
});

app.post("/AddSensor", (req, res)=>{
    const {name, type, update} = req.body;
    console.log(name, type, update)
    sens = new Sensor(name, type, update);
    sensor.push(sens);
    console.log(sensor);
    io.emit("sensorAdd");
    res.json({success:true});
});

app.get("/loadSensor", (req, res)=>{
    res.json({sensori: sensor});
})

app.post("/RemoveSensor", (req, res)=>{
    const {name} = req.body;
    let found = false;
    console.log(name);
    for(let i = 0; i<sensor.length; i++){
        console.log(sensor[i].name, name);
        if(sensor[i].name==name){
            found=true;
            console.log("if");
            sensor.splice(i,1);
            console.log(sensor);
            let n = sensor.length;
            io.emit("sensorRem", n);
            res.json({success:true});
        }
    }
    if (!found)
        return res.status(404).json({error:"Wrong sensor name"});
});

const simulateSensors=()=>{
    sensor.forEach(sensore =>{
        newValue = randomInt(10);
        io.emit("sensorUpdate", {name: sensore.name, value: newValue});
    });
};

setInterval(simulateSensors, 1000);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});