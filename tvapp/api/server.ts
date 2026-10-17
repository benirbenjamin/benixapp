import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`📡 RBA Streaming Platform Backend running on port ${PORT}`);
  console.log(`🌐 Application URL: https://tv.benix.space`);
  console.log(`🔗 Local API: http://localhost:${PORT}/api`);
});
