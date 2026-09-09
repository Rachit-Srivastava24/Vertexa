# Vertexa - Video Conferencing App

Vertexa is a real-time video conferencing web application built using React, Node.js, Socket.IO, WebRTC, and MongoDB. It allows users to join virtual meetings, communicate through video and audio, share their screen, and chat with other participants in real time.

## Features

- Real-time video calling
- Real-time audio communication
- Multi-user video conferencing
- Screen sharing
- Real-time chat
- Meeting history
- User registration and login
- Meeting access using meeting codes
- Responsive dark-themed user interface

## Tech Stack

### Frontend
- React.js
- Vite
- Material UI
- Socket.IO Client
- WebRTC
- CSS Modules

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT Authentication

## How It Works

Vertexa uses WebRTC for real-time peer-to-peer audio and video communication, while Socket.IO is used for signaling and real-time chat.

When users join the same meeting:

1. A Socket.IO connection is established.
2. The participant joins the meeting room using a meeting code.
3. WebRTC peer connections are created between participants.
4. SDP offers and answers are exchanged through Socket.IO.
5. ICE candidates are exchanged to help establish the WebRTC connection.
6. Remote audio and video streams are displayed in the meeting.
7. Socket.IO handles real-time chat messages.

## Project Structure

```text
Vertexa/
│
├── Backend/
│   ├── ...
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
└── .gitignore

Getting Started
Prerequisites

Make sure the following are installed on your system:

Node.js
npm
MongoDB
Git
Clone the Repository
git clone https://github.com/Rachit-Srivastava24/Vertexa.git
cd Vertexa
Install Backend Dependencies
cd Backend
npm install
Install Frontend Dependencies

Open another terminal:

cd frontend
npm install
Run the Backend

From the Backend directory:

npm start
Run the Frontend

From the frontend directory:

npm run dev

Open the local URL provided by Vite in your browser.

Usage
Open the Vertexa application.
Register a new account or log in.
Enter a meeting code.
Join the meeting.
Allow camera and microphone permissions.
Communicate with other participants using video and audio.
Use the bottom controls to turn the camera or microphone on/off.
Use the screen sharing option to share your screen.
Open the chat panel to send real-time messages.
View previous meeting activity from the meeting history section.
WebRTC Architecture

Vertexa uses a peer-to-peer WebRTC architecture for video and audio communication.

For example, when three users join the same meeting:

             User A
            /     \
           /       \
       User B ----- User C

Each participant establishes a peer connection with the other participants.

Socket.IO acts as the signaling layer and is responsible for exchanging:

SDP Offers
SDP Answers
ICE Candidates

WebRTC then handles the actual audio and video communication between participants.

Authentication

The application provides user authentication using registration and login functionality.

Authentication is handled using JWT-based authentication, allowing protected features such as meeting history to be accessed by authenticated users.

Chat

Vertexa includes real-time chat functionality using Socket.IO.

Messages are transmitted through the server and delivered to participants in the same meeting room.

Meeting History

Authenticated users can view their previous meeting activity, including meeting codes and dates.

Future Improvements
TURN server support for difficult network environments
Improved WebRTC connection recovery
Better mobile responsiveness
Participant names on video tiles
Improved screen-sharing experience
Meeting access controls
Better error handling
Performance improvements for larger meetings

Author:
Rachit Srivastava

GitHub: https://github.com/Rachit-Srivastava24/Vertexa

License

This project is created for learning and portfolio purposes.
