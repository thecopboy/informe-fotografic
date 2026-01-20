// server.js (o el teu fitxer principal de Node.js)
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto'); // Per verificar la signatura del webhook

const app = express();
const port = 3000; // O el port que utilitzis

// Clau secreta del Webhook (la configuraràs a GitHub)
// Carrega la clau secreta des de les variables d'entorn per seguretat
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
    console.error('FATAL ERROR: GITHUB_WEBHOOK_SECRET no està definida a les variables d\'entorn.');
    process.exit(1); // Atura el servidor si la clau no està configurada
}
const PROJECT_PATH = '/home/themacboy/informe-fotografic/git-update'; // Ruta absoluta al teu projecte
const DEPLOY_SCRIPT = `${PROJECT_PATH}/deploy.sh`; // Ruta absoluta al script de desplegament

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf; // Guarda el body original per la verificació de la signatura
    }
}));

app.post('/webhook', (req, res) => {
    // 1. Verificar la signatura del Webhook (Molt important per seguretat!)
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.error('Webhook: Signature header missing.');
        return res.status(401).send('Unauthorized: Signature missing.');
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    if (signature !== digest) {
        console.error('Webhook: Invalid signature.');
        return res.status(401).send('Unauthorized: Invalid signature.');
    }

    // 2. Verificar l'esdeveniment (només actuar sobre 'push')
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
        return res.status(200).send('Event ignored: Not a push event.');
    }

    // 3. Executar el script de desplegament
    console.log(`Webhook received for push event. Running deploy script...`);
    exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
        if (error) {
            console.error(`Deploy script execution error: ${error}`);
            return res.status(500).send(`Deploy script failed: ${stderr}`);
        }
        console.log(`Deploy script stdout: ${stdout}`);
        if (stderr) console.error(`Deploy script stderr: ${stderr}`);
        res.status(200).send('Deploy script executed successfully.');
    });
});

app.listen(port, () => {
    console.log(`Webhook listener running on http://localhost:${port}`);
});
