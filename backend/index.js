import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"

import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js"
import uploadRoute from './routes/upload.route.js';
import adminRoutes from './routes/admin.route.js';
import superadminRoutes from './routes/superadmin.route.js';
import catalogRoutes from './routes/catalog.route.js';
import { File } from "./models/file.model.js";
import { v2 as cloudinary } from "cloudinary";
import applicationsRoute from './routes/applications.route.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({origin: "http://localhost:5173", credentials: true}));

app.use(express.json()); // allows us to parse incoming requests
app.use(cookieParser());
app.use('/api/upload', uploadRoute);
app.use("/api/auth", authRoutes)
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/applications', applicationsRoute);

app.listen(PORT, () =>{
    connectDB();
    console.log("Server is running on port 3000")

    // Scheduled cleanup: purge trashed items older than 24 hours once per hour
    const ONE_HOUR = 60 * 60 * 1000;
    const moveOldRejectedToTrash = async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const rejected = await File.find({ status: 'rejected', trashed: { $ne: true }, rejectedAt: { $lte: cutoff } });
        for (const f of rejected) {
          try {
            await File.findByIdAndUpdate(f._id, { trashed: true, trashedAt: new Date() });
          } catch {}
        }
        if (rejected.length) console.log(`[cleanup] Moved ${rejected.length} rejected theses to trash`);
      } catch (e) {
        console.error('[cleanup] Failed moving rejected to trash', e?.message || e);
      }
    };
    const purgeOldTrashed = async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const olds = await File.find({ trashed: true, trashedAt: { $lte: cutoff } });
        for (const f of olds) {
          try {
            if (f.publicId) {
              await cloudinary.uploader.destroy(f.publicId, { resource_type: f.resourceType || 'raw' });
            }
          } catch {}
          try {
            await File.findByIdAndDelete(f._id);
          } catch {}
        }
        if (olds.length) console.log(`[cleanup] Purged ${olds.length} trashed theses`);
      } catch (e) {
        console.error('[cleanup] Failed to purge trashed theses', e?.message || e);
      }
    };
    // run on start and hourly
    moveOldRejectedToTrash();
    purgeOldTrashed();
    setInterval(async () => { await moveOldRejectedToTrash(); await purgeOldTrashed(); }, ONE_HOUR);
})

//8gr22hMS809jfupt