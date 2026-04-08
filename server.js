// ... existing imports
import cors from 'cors';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// UPDATE: Allow your Vercel frontend to connect
app.use(cors({
  origin: process.env.FRONTEND_URL || '*' 
}));

app.use(express.json());
// Remove: app.use(express.static(...)); -> Vercel will handle the frontend files

// ... keep existing room logic and wss.on('connection') logic

// UPDATE: Bind to 0.0.0.0 for Render's environment
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 Secure Chat Server running on port ${PORT}`);
});
