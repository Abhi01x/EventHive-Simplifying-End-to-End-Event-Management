
import { v4 as uuidv4 } from "uuid";
import transporter from "../config/nodemailer.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db/db.js";




function validateAndNormalizeEmail(email) {
  if (typeof email !== "string") return null;

  email = email.trim().toLowerCase();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return null; // Invalid email format

  let [local, domain] = email.split("@");
  if (!local || !domain) return null; // Invalid email structure

  if (local.includes("+")) return null;

  // Gmail & Googlemail normalization
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.split("+")[0]; // remove +tags
    local = local.replace(/\./g, ""); // remove dots
    domain = "gmail.com";
  } // remove +tags

  return `${local}@${domain}`;
}



export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const hash = await bcrypt.hash(password, 10);

  console.log("Registering user:", { name, email, password, phone });

  if (!name || !email || !password || !phone) {
    return res.json({ success: false, msg: "All fields are required" });
  }
  //  password.length < 6 ||

  const userEmail = validateAndNormalizeEmail(email);

  if (!userEmail) {
    return res.json({ success: false, msg: "Invalid email format" });
  }

  try {
    if (
      phone.length < 10 ||
      phone.length > 15 ||
      !/^\d+$/.test(phone) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) ||
      name.length < 3 ||
      name.length > 30
    ) {
      return res.json({ success: false, msg: "Invalid input data" });
    }

    const [existingUser] = await db.execute(
      "SELECT id , email FROM users WHERE email = ? lIMIT 1",
      [userEmail]
    );

    if (existingUser.length > 0 && existingUser[0].email === userEmail) {
      return res.json({ success: false, msg: "User already exists" });
    }
  } catch (error) {
    console.error("Error in registration:", error);
    return res
      .status(500)
      .json({ success: false, msg: "Internal server error" });
  }

  try {
    

    const [result] = await db.execute(
      "INSERT INTO users (name, email, password , phone ) VALUES (?,?, ? ,?)",
      [ name, userEmail, hash, phone]
    );

    const [rows] = await db.execute(
      "SELECT id,name as userName, email, role FROM users WHERE email = ? LIMIT 1",
      [userEmail]
    );

    if (!rows.length)
      return res.json({ success: false, msg: "Registration failed" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const [result1] = await db.query(
      "UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?",
      [otp, expires, rows[0].id]
    );

    try {
      // const mailOptions = {
      //   from: process.env.SENDER_EMAIL,
      //   to: rows[0].email,
      //   subject: "OTP Verification",
      //   text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      //   html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
      // };

      const mailOptions = {
        from: '"EventHive" <no-reply@EventHive.com>',
        to: rows[0].email,
        subject: "Verify Your Email - OTP Verification",
        text: `Hello ${rows[0].userName || ""},

        Your One-Time Password (OTP) for verifying your email is: ${otp}

        This OTP is valid for the next 5 minutes. 
        If you did not request this, please ignore this email.

        Thank you,
        EventHive Team`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="text-align: center; color: #333;">Verify Your Email</h2>
                    <p>Hi ${rows[0].userName || ""},</p>
                    <p>Your One-Time Password (OTP) for verifying your email is:</p>
                    <h1 style="text-align: center; background: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
                    <p>This OTP is valid for <b>5 minutes</b>. Please do not share it with anyone.</p>
                    <p>If you did not request this, you can safely ignore this email.</p>
                    <p style="margin-top: 20px;">Best Regards,<br><b>EventHive Team</b></p>
                </div>
            `,
              };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error in verification:", error);
    }

    console.log(rows[0]);

    // console.log(rows[0]);
    res.json({
      success: true,
      id: rows[0].id,
      msg: "Registration pending, OTP sent to your email",
    });
  } catch (e) {
    console.log(e);

    res.json({ success: false, msg: e.massage });
  }
};




export const login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query(
    "SELECT id , name, email, verification,password, role , is_banned,created_at FROM users WHERE email=?",
    [email]
  );

  console.log(email, password);

  // console.log(rows[0]);

  if (!rows.length) return res.json({ success: false, msg: "No user" });

  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) return res.json({ success: false, msg: "Bad password" });

  if (rows[0].is_banned){
    return res.json({ success: false, msg: "User is banned" });
  }

  const token = jwt.sign(
    { id: rows[0].id, role: rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  delete rows[0].password; // Remove password from response

  console.log(rows[0]);

  res.json({ success: true, token, user: rows[0] });
};

export const getuserdata = async (req, res) => {
  const { id } = req.user;
  const [rows] = await db.query(
    "SELECT id, is_banned ,name, email, role , verification  FROM users WHERE id=?",
    [id]
  );

  if (!rows.length) return res.status(400).json({ msg: "No user" });
  // console.log(rows);

  res.json(rows[0]);
};


const sendSuccessEmail = async (email, username) => {
  const mailOptions = {
    from: '"EventHive" <no-reply@eventhive.com>',
    to: email,
    subject: "Welcome to EventHive – Registration Successful!",
    text: `Hi ${username},

Your registration was successful.
Welcome to EventHive! You can now explore and book tickets to amazing events.

Thank you,
The EventHive Team`,
    html: `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Registration Successful</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .bg { background: #1a202c !important; }
      .card { background: #2d3748 !important; border-color:#4a5568 !important; }
      .text { color: #edf2f7 !important; }
      .muted { color: #a0aec0 !important; }
      .brand { color: #90cdf4 !important; }
      .btn { background:#3182ce !important; color:#ffffff !important; }
    }

    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .h1 { font-size: 22px !important; }
    }
  </style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f5f7fb;">

  <div style="display:none;opacity:0;color:transparent;visibility:hidden;height:0;width:0;overflow:hidden;">
    Welcome to EventHive! You're all set to book your event tickets.
  </div>

  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;">
    <tr>
      <td align="center" style="padding:24px;">
        <table class="container" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:transparent;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 12px 0 20px;">
              <div class="brand" style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#3182ce;">
                EventHive
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table class="card" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:28px 28px 8px;">
                    <h1 class="h1 text" style="font-family:Arial,sans-serif;font-size:24px;margin:0;color:#2d3748;">
                      Welcome to EventHive, ${username}!
                    </h1>
                    <p class="text" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#4a5568;">
                      Your account has been <strong>successfully registered</strong>. You can now browse and book tickets for top events 🎉
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 0;">
                    <p class="text" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;">
                      Start your journey by exploring the upcoming events curated just for you.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding: 20px 28px;">
                    <a href="https://eventhive.com/events" class="btn" style="background:#3182ce;color:white;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;">
                      Book Your Tickets
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 28px 24px;">
                    <p class="muted" style="font-family:Arial,sans-serif;font-size:12px;color:#718096;">
                      If you did not create this account, please ignore this email or contact support.
                      <br><br>
                      Cheers,<br>
                      The EventHive Team
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 0 0;">
              <p class="muted" style="font-family:Arial,sans-serif;font-size:12px;color:#a0aec0;">
                © ${new Date().getFullYear()} EventHive. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  };

  await transporter.sendMail(mailOptions);
};


export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const { id } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT  id , email, name, role , otp_code, otp_expires FROM users WHERE id = ?",
      [id]
    );

    if (!rows.length) return res.status(400).json({ msg: "No user" });

    const user = rows[0];
    if (!user.otp_code || !user.otp_expires) {
      return res.status(400).json({ msg: "No OTP found, please request a new one" });
    }

    if (user.otp_code !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    await db.query(
      "UPDATE users SET verification = 1, otp_code = NULL, otp_expires = NULL WHERE id = ?",
      [id]
    );

    delete user.otp_code;
    delete user.otp_expires;

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
     


    res.json({
      success: true,
      msg: "Verification successful",
      token,
      user: user,
    });

  
     try {
         
        sendSuccessEmail(user.email, user.name);
     } catch (error) {
        console.error("Error in verification email:", error);
     }
     
   
  } catch (error) {
    console.error("Error in OTP verification:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
