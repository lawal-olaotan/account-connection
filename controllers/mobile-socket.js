import { Server } from 'socket.io';
import { dbPromise } from '../db/config.js'
import dotenv from "dotenv"
dotenv.config(); 
export const  setupMobileSocket = (httpServer) => {

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  const connectedClients = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('register', async({ userId }) => {
      connectedClients.set(userId, socket);
      await checkAndSendData(userId);
    });

    socket.on('requestData', async ({ userId }) => {
      await checkAndSendData(userId);
    });

    socket.on('disconnect', () => {
      for (const [userId, clientSocket] of connectedClients.entries()) {
        if (clientSocket === socket) {
          connectedClients.delete(userId);
          break;
        }
      }
      console.log('Client disconnected');
    });
  });


  async function checkAndSendData(userId) {
    try {
      const collection = (await dbPromise).db().collection('mobile');
      const connectionDetails = await collection.findOne({ userId });
      
      if (connectionDetails) {
        const clientSocket = connectedClients.get(userId);
        if (clientSocket) {
          clientSocket.emit('connectionDetails', connectionDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

}
