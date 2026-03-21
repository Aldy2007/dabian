import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const articlesDir = path.join(process.cwd(), 'article');
  const authorsFile = path.join(process.cwd(), 'authors.json');

  let authors = {};
  try {
    authors = JSON.parse(fs.readFileSync(authorsFile, 'utf8'));
  } catch (e) {
    console.error('authors.json open failed', e);
  }

  let articles = [];
  try {
    if (fs.existsSync(articlesDir)) {
      const files = fs.readdirSync(articlesDir);
      files.sort((a, b) => parseInt(b) - parseInt(a));
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
          const lines = content.split('\n');
          let titleLine = '';
          let titleIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
              titleLine = lines[i].trim();
              titleIndex = i;
              break;
            }
          }
          
          let title = titleLine.replace(/^#+\s*/, '');
          
          // Remove the title line from the content to avoid duplicate rendering
          let contentWithoutTitle = content;
          if (titleIndex !== -1) {
             const newLines = [...lines];
             newLines.splice(titleIndex, 1);
             contentWithoutTitle = newLines.join('\n');
          }

          const matchLetter = title.match(/[A-Za-z]/g);
          let authorCode = '';
          if (matchLetter && matchLetter.length >= 3) {
             authorCode = matchLetter.slice(0, 3).join('').toUpperCase();
          }

          const authorName = authors[authorCode] || authorCode || 'Unknown';

          const dateMatch = title.match(/\d{1,2}\.\d{1,2}/);
          let date = dateMatch ? dateMatch[0] : '';

          let cleanTitle = title;
          // remove the date
          if (date) {
            cleanTitle = cleanTitle.replace(date, '');
          }
          // remove the first 3 letters
          let lettersRemoved = 0;
          cleanTitle = cleanTitle.replace(/[A-Za-z]/g, (match) => {
             if (lettersRemoved < 3) {
                lettersRemoved++;
                return '';
             }
             return match;
          });
          // cleanup residual whitespace
          cleanTitle = cleanTitle.trim().replace(/^[-_]+/, '').trim().replace(/\s{2,}/g, ' ');

          articles.push({
            id: file,
            title: cleanTitle || 'Untitled',
            authorName,
            authorCode,
            date,
            content: contentWithoutTitle
          });
        }
      });
    }
  } catch(e) {
    console.error(e);
  }

  res.status(200).json({ articles, authors });
}
