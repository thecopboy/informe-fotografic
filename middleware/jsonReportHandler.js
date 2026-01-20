/**
 * Middleware d'Express per retornar les dades de l'informe com un fitxer JSON descarregable.
 * @param {import('express').Request} req - L'objecte de la petició.
 * @param {import('express').Response} res - L'objecte de la resposta.
 */
export function saveAsJson(req, res) {
    try {
        // Validació bàsica de les dades rebudes
        if (!req.body || typeof req.body !== 'object') {
            console.error("Dades rebudes invàlides:", req.body);
            return res.status(400).send('Dades rebudes invàlides');
        }

        const reportData = req.body;
        const fileName = `informe_dades_${Date.now()}.json`;

        // Calcular la mida aproximada del JSON per logging
        const jsonString = JSON.stringify(reportData, null, 2);
        const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

        console.log(`Processant fitxer JSON de ${sizeInMB} MB`);

        // Establim les capçaleres per indicar que la resposta és un fitxer per descarregar
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', sizeInBytes);

        // Enviem les dades JSON com a resposta, amb un format llegible
        res.status(200).send(jsonString);
        
        console.log(`Fitxer JSON enviat amb èxit: ${fileName} (${sizeInMB} MB)`);
    } catch (error) {
        console.error("Error en processar el JSON:", error);
        res.status(500).send(`Error intern del servidor en processar el JSON. Detall: ${error.message}`);
    }
}