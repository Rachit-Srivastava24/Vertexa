# Vertexa — Notes (Video Conferencing App)

## 1. IP Address, Protocol, Router — Basics

- **IP Address** = internet pe device ka address (jaise ghar ka pata).
- **Protocol** = baat karne ke fixed rules (HTTP = website dekhna, TCP = reliable data, UDP = fast but no guarantee — video calls me UDP jaisa behavior use hota hai).
- **Router / NAT** = ghar ke andar sab devices ek hi WiFi share karte hain, router har device ko ek **private IP** deta hai (jaise `192.168.1.5`), aur bahar ki duniya ko sirf ek **public IP** dikhta hai. Router hi track karta hai kaunsa data kis device ka hai (NAT = Network Address Translation).

## 2. Sockets

- Normal HTTP request = ek letter bhejna, jawaab aana, connection band ho jana.
- **Socket** = ek khula, do-tarfa (bidirectional) connection jo client aur server ke beech zinda rehta hai — jaise phone call. Real-time cheezon (chat, video call) ke liye zaroori.
- **Socket.io** = ek library jo raw WebSocket ko easy banati hai — rooms, auto-reconnect jaisi features deti hai.
- Core pattern: **emit** (bhejna) aur **on** (sunna). Dono taraf same event name hona chahiye.

```js
// Server
socket.emit('welcome-message', 'Hi there!');
socket.on('join-room', (roomId) => { ... });

// Client
socket.on('welcome-message', (data) => { console.log(data); });
socket.emit('join-room', 'room-123');
```

## 3. WebRTC — Video Call Kaise Kaam Karta Hai

- **Problem:** Video/audio data seedha browser-se-browser (peer-to-peer) jana chahiye, server ke through nahi (bahut heavy hota hai).
- **STUN server** — batata hai "duniya se tumhara public IP/address kya dikhta hai" (kyunki router ke peeche private IP chhupa hota hai).
- **TURN server** — agar direct connection na ho paye (strict firewall/NAT), toh ye beech me relay karta hai data (backup, thoda slow).
- **ICE (Interactive Connectivity Establishment)** — sab possible connection raaste (local IP, STUN wala public IP, TURN relay) ko **live test** karta hai aur jo sabse pehle/best kaam kare, wahi choose karta hai. Ye calculation nahi, actual trial hai (Google Maps jaisa route-calculation se alag).
- **Signaling (Socket.io ka kaam)** — WebRTC khud do peers ko connect nahi kar sakta bina unko ek dusre ka address pata chale. Socket.io "matchmaker" ka kaam karta hai: offer/answer/ICE candidates exchange karwata hai. Ek baar connection ban jaye, socket ka kaam khatam — video/audio seedha peer-to-peer jata hai.

**1-to-1 call flow:**
1. User A offer banata hai → Socket se User B ko jata hai
2. User B answer banata hai → Socket se wapas User A ko
3. Dono ICE candidates exchange karte hain (Socket se)
4. Peer connection ban jata hai → video/audio seedha peer-to-peer

**Multi-user (3-4 log) ke liye — Mesh architecture:**
Har user, baaki har user se seedha connect hota hai. 4 log = har ek ke 3 connections. Simple hai, 3-4 users tak sahi chalega (SFU/MCU bade scale ke liye hote hain, production-grade, abhi ke project ke liye zaroori nahi).

## 4. CORS (Cross-Origin Resource Sharing)

- **Origin** = protocol + domain + port. Teeno match hone chahiye tabhi "same origin."
- Browser ek security check lagata hai: agar koi site (jaise `hacker.com`) doosre origin (`mybank.com`) ko chupke se request bheje, toh ye rokta hai — warna malicious sites tumhare login se data chura sakti hain.
- Server response me header bhejta hai: `Access-Control-Allow-Origin: delta.com` — jo allowed origins batata hai.
- **Browser enforce karta hai**, server nahi — server data bhej deta hai, browser use JS tak pahunchne se rokta hai agar origin match na kare.
- Code me: `app.use(cors())` — abhi sab origins allow hain (dev ke liye theek), production me specific origin daalna better hai.

## 5. Project Setup — Ab Tak Kya Bana

**Folder structure:**
```
Backend/
├── node_modules/
├── src/
│   ├── controllers/
│   │   └── socketManager.js
│   ├── models/
│   ├── routes/
│   └── app.js
├── package.json
└── package-lock.json
Frontend/   (React — abhi shuru nahi kiya)
```

**Packages installed:** express, socket.io, cors, mongoose, bcrypt, nodemon, http-status, status

**MongoDB Atlas:** "Vertexa" naam se free-tier cluster banaya, database user credentials mile (`.env` me store karna hai, code me hardcode nahi).

### `src/app.js`

```js
import express from "express";
import {createServer} from "node:http";
import {Server} from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";

const app = express();
const server = createServer(app);       // Express ko raw HTTP server me wrap kiya
const io = connectToSocket(server);      // Socket.io ko usi server se joda

app.set("port", (process.env.PORT || 3000));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));

const start = async () => {
  const connectionDb = await mongoose.connect("<mongodb-connection-string>");
  console.log(`MONGO connected Db Host: ${connectionDb.connection.host}`);

  server.listen(app.get("port"), () => {   // app.listen() NAHI — server.listen(), taaki socket.io bhi kaam kare
    console.log(`Server is running on port ${app.get("port")}`);
  });
};

start();
```

**Kyun `server.listen()`, `app.listen()` nahi?**
`app` sirf Express hai (HTTP request-response). `server` = Express + Socket.io dono wrap kiya hua hai. Agar `app.listen()` karte, Socket.io kaam nahi karta.

### `src/controllers/socketManager.js`

```js
import {Server} from "socket.io";

export const connectToSocket = (server) => {
  const io = new Server(server);
  return io;
};
```

Abhi ye sirf Socket.io ko server se jodta hai. Next step: isi file me `io.on('connection', ...)` likhna hoga jisme room join, offer/answer, ICE candidates handle honge.

## 6. Zaroori Reminders

- **`.env` file banao** aur MongoDB connection string wahan rakho — code me kabhi hardcode/commit mat karna GitHub pe.
- **Project ka naam: Vertexa** — README, GitHub repo, sab jagah consistent rakhna.
- `npm run dev` use karo (`nodemon` ke through), `node app.js` nahi — auto-restart hota hai code change pe.
- 3-4 din ka plan: Din 1 signaling + 1-to-1 call → Din 2 multi-user rooms → Din 3 chat/mute/screen-share → Din 4 polish + deploy.

## 7. Express Router — Routes Ko Organize Karna

**Problem:** Agar saare routes (`/login`, `/register`, `/add_to_activity`, ...) seedhe `app.js` me likhte jao, file bahut messy ho jati hai.

**Solution — `Router`:** Express ka feature hai jisse routes ko **alag file** me likh sakte hain, jaise ek mini-app. Phir usko `app.js` me import karke ek group ki tarah use karte hain.

### `src/routes/users.routes.js` (Final Version)

```js
import { Router } from "express";
import { login, register } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);

export default router;
```
- `login`, `register` — controller se import kiye gaye actual functions (Section 8 me dekho)
- `.post(login)` — jab is route pe **POST** request aaye, `login` function chalao. GET nahi, POST isliye kyunki client data bhej raha hai (username/password), sirf maang nahi raha.

**`app.js` me use hota hai:**
```js
import userRoutes from "./routes/users.routes.js";
app.use("/api/v1/users", userRoutes);
```
Isse poora URL banega: `/api/v1/users/login`, `/api/v1/users/register`. Route sirf "raasta" batata hai, controller "asal kaam" karta hai.

## 8. Authentication — Login & Register Controller

**Key concepts:**
- `bcrypt.hash(password, 10)` — register ke time password ko hash karke save karo, kabhi plain text save mat karo. `10` = salt rounds (security level).
- `bcrypt.compare(enteredPassword, hashedPassword)` — login ke time compare karne ke liye. **Ye async hai — `await` lagana zaroori hai**, warna hamesha true jaisa result dega.
- `crypto.randomBytes(20).toString("hex")` — random login token banata hai (Node's built-in `crypto` module se, `import crypto from "crypto"` chahiye). Login ke baad ye token user ko milta hai, aage har request me bhejega apna proof dene ke liye.
- `User.findOne({ username })` — ek user dhoondhta hai, object/null return karta hai.
- `User.find({ username })` — **hamesha array return karta hai**, chahe ek match ho ya zero. Login/register me single user chahiye hota hai, isliye hamesha `findOne` use karo, `find` nahi.
- `httpStatus.OK` (200), `NOT_FOUND` (404), `CREATED` (201), `INTERNAL_SERVER_ERROR` (500), `CONFLICT` (409, "already exists" ke liye) — readable status codes.

**`register` flow:** username already exists check → password hash karo → naya User object banao → save karo → `201 CREATED` bhejo.

**`login` flow:** username se user dhoondo (`findOne`) → password `bcrypt.compare` se check karo (`await` ke saath) → match ho toh random token banao → token ko user document me save karo → token response me bhejo.

**Common bugs to remember (mila apne code me):**
- `User.find()` ki jagah `User.findOne()` use karna tha login me — warna `user` array hoga, `.password` access nahi hoga.
- `bcrypt.compare(...)` ke aage `await` missing tha — Promise hamesha truthy hota hai, isliye check galat result dega.
- `crypto` module import karna bhoolna — `import crypto from "crypto";` upar add karna zaroori.

## 9. Bugs Fixed + Routes Connected + MongoDB Whitelist

**Controller bugs fixed:**
- `User.find()` → `User.findOne()` in login — `find` always returns an array, `findOne` returns a single object (or null).
- Added `await` before `bcrypt.compare(...)` — it's async, without `await` it always evaluates truthy.
- Added missing `import crypto from "crypto";`
- Added explicit `isPasswordValid` check with `401 UNAUTHORIZED` — earlier a wrong password wasn't handled at all.
- Added `return` before every `res.status(...)` — prevents code running after a response is already sent ("headers already sent" errors).
- `export { login, register };` at the end — needed so routes file can import and use them.

**Routes wired into app.js:**
```js
import userRoutes from "./routes/users.routes.js";
app.use("/api/v1/users", userRoutes);
```
Full endpoints now live: `/api/v1/users/login`, `/api/v1/users/register`.

**Better DB error handling in app.js:**
```js
try {
  const connectionDb = await mongoose.connect(...);
  server.listen(...);
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exit(1);
}
```
`process.exit(1)` = stop the whole process on failure (1 = exited with error, 0 = success) — better than silently failing.

**MongoDB Atlas — "IP not whitelisted" error:**
MongoDB blocks all IPs by default until explicitly allowed. If network changes (new WiFi, hotspot, VPN), old whitelisted IP stops working — reconnect fails with "Could not connect to any servers." Fix: MongoDB Atlas → Network Access → **Add Current IP Address**. For frequent network changes during learning, `0.0.0.0/0` (allow all) is an option — not for production.

## 10. `socketManager.js` — Final Version (poora explain, interview-ready)

**Ek line me poora file ka kaam:** Ye server ka "operator" hai — kaun room me aaya, kaun gaya, do log ka video-address exchange, aur chat — ye 4 cheezein handle karta hai.

**Top pe 3 registers (data store karne ki jagah, RAM me — database nahi):**
```js
let connections = {};   // { roomId: [socketId1, socketId2, ...] } — kaun kaunse room me hai
let messages = {};      // { roomId: [{data, sender, ...}] } — har room ka chat history
let timeOnLine = {};    // { socketId: joinTime } — kab se connected hai
```

**Server setup — CORS bhi add hua:**
```js
const io = new Server(server, {
  cors: { origins: "*", methods: ["GET", "POST"], allowedHeaders: ["*"], credentials: true },
});
```
Pehle CORS sirf Express (`app.use(cors())`) pe tha — ab Socket.io ko bhi apna CORS chahiye (alag cheez hai), warna frontend se socket connect nahi hoga.

---

### Event 1 — `join-call` (naya banda room join kare)

**Interview me bologe:** "Jab user room join karta hai, main check karta hoon room pehle se exist karta hai ya nahi, agar nahi toh bana deta hoon, fir uski ID us room ki list me daal deta hoon."

```js
socket.on("join-call", (path) => {
  if (connections[path] === undefined) {
    connections[path] = [];              // naya room banaya
  }
  connections[path].push(socket.id);      // naya user add kiya
  timeOnLine[socket.id] = new Date();     // join time note kiya

  connections[path].forEach((elem) => {
    io.to(elem).emit("user-joined", socket.id);   // sabko (khud ko bhi) bataya naya user aaya
  });

  if (messages[path] !== undefined) {              // agar purani chat hai
    for (let a = 0; a < messages[path].length; a++) {
      const message = messages[path][a];
      io.to(socket.id).emit("chat-message", message.data, message.sender, message["socket-id-sender"]);
      // sirf naye user ko purani chat bheji — WhatsApp group join karne jaisa
    }
  }
});
```

### Event 2 — `signal` (WebRTC ka offer/answer/ICE)

**Interview me bologe:** "Ye event ek postman ki tarah kaam karta hai — server ko data ka matlab nahi pata (offer hai ya answer), bas jisko bhejna hai usko forward kar deta hai."

```js
socket.on("signal", (toId, message) => {
  io.to(toId).emit("signal", socket.id, message);
});
```

### Event 3 — `chat-message` (group chat)

**Interview me bologe:** "Pehle main dhoondta hoon ye banda kaunse room me hai (kyunki message ke saath room ID nahi aati), fir uska message us room ki chat history me save karta hoon aur room ke sabhi logo ko bhej deta hoon."

```js
socket.on("chat-message", (data, sender) => {
  let matchingRoom = null;
  for (const [roomKey, roomValue] of Object.entries(connections)) {
    if (roomValue.includes(socket.id)) {
      matchingRoom = roomKey;   // ye room mil gaya
      break;
    }
  }
  if (matchingRoom === null) return;   // kisi room me nahi hai toh kuch mat karo

  if (messages[matchingRoom] === undefined) messages[matchingRoom] = [];
  messages[matchingRoom].push({ data, sender, "socket-id-sender": socket.id });

  connections[matchingRoom].forEach((elem) => {
    io.to(elem).emit("chat-message", data, sender, socket.id);   // room ke sabko bheja
  });
});
```
*(Pehle wala complex `reduce()` wala tareeka simple `for` loop se replace ho gaya hai — same kaam karta hai, samajhna asaan hai.)*

### Event 4 — `disconnect` (jab koi chala jaye)

**Interview me bologe:** "Jab user disconnect hota hai, main uska room dhoondta hoon, list se hata deta hoon, baaki logo ko batata hoon ye chala gaya, aur agar room khali ho gaya toh poora room hi delete kar deta hoon — memory clean rakhne ke liye."

```js
socket.on("disconnect", () => {
  if (timeOnLine[socket.id]) {
    delete timeOnLine[socket.id];   // uska time-record hata diya
  }

  let matchingRoom = null;
  for (const [roomKey, roomValue] of Object.entries(connections)) {
    if (roomValue.includes(socket.id)) {
      matchingRoom = roomKey;
      break;
    }
  }
  if (matchingRoom === null) return;

  const index = connections[matchingRoom].indexOf(socket.id);
  if (index !== -1) connections[matchingRoom].splice(index, 1);   // list se naam hataya

  connections[matchingRoom].forEach((elem) => {
    io.to(elem).emit("user-left", socket.id);   // baaki sabko bataya
  });

  if (connections[matchingRoom].length === 0) {
    delete connections[matchingRoom];   // khali room delete
    delete messages[matchingRoom];      // uski chat bhi delete
  }
});
```

---

## 11. Mongoose Models — User aur Meeting Schema

**Model kya hota hai:** Database me data kaisa dikhega, uska **blueprint/structure**. Jaise form banane se pehle decide karna "kaunse fields honge, kaunse zaroori hain."

### `src/models/user.models.js`
```js
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
```
- `required: true` — is field ke bina document save nahi hoga
- `unique: true` — do users same username nahi rakh sakte (database khud check karega)
- `token` — required nahi, kyunki register ke time token nahi hota, sirf login ke baad milta hai
- `{ timestamps: true }` — Mongoose khud `createdAt` aur `updatedAt` fields add kar deta hai, track karne ke liye kab banaya/update hua

### `src/models/meeting.model.js`
```js
import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
  meetingId: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },
});

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting };
```
- Ye har meeting ka **record** save karta hai — kaunsa user ne kab meeting create ki
- `default: Date.now` — agar date na di jaye, khud current time le lega
- Interview me kaam aayega agar poochein "meeting history kaise store hoti hai" — yehi model use hota hai `/api/v1/users/add_to_activity` jaisi routes me

**Note:** `user.models.js` ka export style `default` hai (`export default User;`), `meeting.model.js` ka `named` hai (`export {Meeting};`) — dono valid hain, bas import karte waqt syntax alag hoga:
```js
import User from "../models/user.models.js";       // default import
import { Meeting } from "../models/meeting.model.js"; // named import (curly braces)
```

## 12. Interview me Project Explain Karne Ka Short Pitch

Agar poochein **"apna project batao"**, ye bolo (30 second version):

> "Maine Vertexa banaya — ek real-time video conferencing app, Zoom jaisa. Backend Node.js/Express hai, MongoDB database hai auth ke liye (bcrypt se password hash, token-based login), aur real-time video ke liye WebRTC use kiya — peer-to-peer video/audio, taaki server pe load na aaye. WebRTC connection banane ke liye Socket.io se signaling ki — offer/answer/ICE candidates exchange karwaye. Room-based architecture hai, mesh topology use ki 3-4 users tak, chat bhi hai jisme purani history bhi naye user ko milti hai jab wo join kare."

Agar poochein **"WebRTC/Socket.io ka role kya hai, alag alag kyun"**:
> "Socket.io sirf 'introduction' karwata hai — connection banwane ke liye do logo ka address exchange. Ek baar connection ban jaye, actual video/audio data seedha peer-to-peer jata hai, server ke through nahi — isliye scalable hai."

Agar poochein **"koi bug/challenge mila"**:
> "Haan, login me `User.find()` use kar liya tha jo array return karta hai, `findOne()` chahiye tha single object ke liye — aisi chhoti debugging cheezein seekhi. MongoDB IP whitelist ka bhi issue aaya jab network change hui."