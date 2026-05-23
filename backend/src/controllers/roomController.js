import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wordsPath = path.join(__dirname, '../data/words.json');

export function getCategories(req, res) {
  try {
    const raw = fs.readFileSync(wordsPath, 'utf8');
    const data = JSON.parse(raw);
    const categories = Object.keys(data).filter((key) => key !== 'timesup');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Impossible de charger les catégories.' });
  }
}
