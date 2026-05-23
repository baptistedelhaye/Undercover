import express from 'express';
import http from 'http';
import cors from 'cors';
import roomRoutes from './routes/roomRoutes.js';
import { setupSocket } from './socket/socket.js';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', roomRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Party Games backend actif.' });
});

setupSocket(server);

const PORT = 5174;
server.listen(PORT, () => {
  console.log(`Party Games backend démarré sur http://localhost:${PORT}`);
});
