import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import user_router from "./route/user.js";
import barang_router from "./route/barang.js";
import satpam_router from "./route/satpam.js";
import db from "./config/database.js";
import cron from "node-cron";

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: [`${process.env.CLIENT_URL_PROD}`, `${process.env.CLIENT_URL_DEV}`],
  methods: "GET, POST, PATCH, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const jsonParser = bodyParser.json();

app.use("/api/v1", jsonParser, user_router);
app.use("/api/v1", jsonParser, barang_router);
app.use("/api/v1", jsonParser, satpam_router);

cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Menjalankan pengecekan barang expired...");

  try {
    const sql = `
      UPDATE Barang 
      SET status = 'kadaluarsa' 
      WHERE status = 'masih dicari' 
      AND tanggal_kadaluarsa < NOW()
    `;

    const [result] = await db.execute(sql);

    if (result.affectedRows > 0) {
      console.log(
        `✅ Berhasil meng-expired-kan ${result.affectedRows} barang lama.`
      );
    } else {
      console.log("👍 Tidak ada barang yang expired hari ini.");
    }
  } catch (error) {
    console.error("❌ Gagal menjalankan cron job:", error);
  }
});

// ... app.listen ...

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
