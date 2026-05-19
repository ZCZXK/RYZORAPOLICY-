require('dotenv').config();
const express = require('express');
const fetch = require('cross-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RYZORA Bot - Invite & Connect</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #1a1c23; color: #ffffff; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .container { width: 100%; max-width: 450px; background: #252836; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3); text-align: center; }
        .hero { padding: 40px 30px; background: linear-gradient(180deg, #2b3046 0%, #252836 100%); border-bottom: 1px solid #32364a; }
        .bot-icon { font-size: 50px; margin-bottom: 15px; display: inline-block; filter: drop-shadow(0 0 10px #5865F2); }
        h1 { font-size: 26px; font-weight: 700; margin-bottom: 10px; color: #fff; letter-spacing: 0.5px; }
        p { font-size: 14px; color: #9da3bb; line-height: 1.5; margin-bottom: 25px; }
        .btn-invite { display: block; width: 100%; padding: 14px; background-color: #5865F2; color: #fff; text-decoration: none; font-weight: 600; border-radius: 8px; transition: background 0.2s; font-size: 16px; }
        .btn-invite:hover { background-color: #4752C4; }
        .login-card { padding: 30px; background: #1e212c; margin: 20px; border-radius: 12px; border: 1px solid #2d3142; }
        .login-card h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #72767d; margin-bottom: 8px; font-weight: 600; }
        .login-card h3 { font-size: 18px; margin-bottom: 20px; font-weight: 600; color: #e3e5e8; }
        .btn-login { display: flex; align-items: center; justify-content: center; width: 100%; padding: 12px; background-color: #2f3136; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; border: 1px solid #3f4248; transition: background 0.2s; }
        .btn-login:hover { background-color: #393c43; }
        .btn-login img { width: 20px; margin-right: 10px; }
        .success-box { padding: 40px 20px; }
        .success-box h1 { color: #43b581; margin-bottom: 15px; }
        .btn-secondary { display: inline-block; margin-top: 20px; color: #5865F2; text-decoration: none; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">${content}</div>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(layout(`
        <div class="hero">
            <div class="bot-icon">⚡</div>
            <h1>Integrate RYZORA</h1>
            <p>Invite RYZORA to your server to start managing your community systems flawlessly.</p>
            <a href="${process.env.BOT_INVITE_URL || '#'}" class="btn-invite" target="_blank">Invite to Server</a>
        </div>
        <div class="login-card">
            <h2>Verify Identity</h2>
            <h3>Sign in to personalise your experience</h3>
            <a href="/login" class="btn-login">
                <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Discord">
                Sign in with Discord
            </a>
        </div>
    `));
});

app.get('/login', (req, res) => {
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('Authentication code is missing.');

    try {
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokens = await tokenResponse.json();
        if (tokens.error) return res.status(400).send(`Error: ${tokens.error_description}`);

        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userData = await userResponse.json();

        res.send(layout(`
            <div class="success-box">
                <h1>✓ Linked Successfully</h1>
                <p>Welcome, <strong>${userData.username}</strong>!</p>
                <p style="margin-top: 10px; color: #9da3bb;">You have successfully authorized with RYZORA.</p>
                <a href="/" class="btn-secondary">← Return to Home</a>
            </div>
        `));
    } catch (err) {
        console.error(err);
        res.status(500).send('An internal server error occurred.');
    }
});

app.listen(PORT, () => console.log(`RYZORA running on port ${PORT}`));
