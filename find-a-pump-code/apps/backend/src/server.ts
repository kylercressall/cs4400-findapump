import app from "./app";
import "./env";

const PORT = 3001;
app.listen(PORT, () => {
  console.log("Backend listening on port 3001");
});