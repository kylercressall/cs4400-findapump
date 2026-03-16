import { config } from "dotenv";
config();
import app from "./app";

const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend listening on port 3001");
});