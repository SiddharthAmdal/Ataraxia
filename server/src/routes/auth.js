import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const authRouter = Router();

authRouter.post("/auth/login", (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Password is required' }});
  }

  // Use the same VITE_APP_PASSWORD logic (it should be passed via env)
  // To keep it simple for a single user system, we can expect the client to send the password and we check it against an env var.
  // We'll define APP_PASSWORD in server/.env
  if (password === process.env.APP_PASSWORD) {
    const token = jwt.sign({ user: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
    return res.json({ token });
  }

  return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' }});
});
