// src/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // URL backend

export default socket;
