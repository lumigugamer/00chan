const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON e servir arquivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('00chan.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criar tabelas se não existirem
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board TEXT NOT NULL,
      nome TEXT NOT NULL,
      imagem TEXT,
      comentario TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      texto TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    )
  `);
});

// Endpoint para listar tópicos e suas respostas por board
app.get('/api/topics/:board', (req, res) => {
  const board = req.params.board;

  db.all('SELECT * FROM topics WHERE board = ? ORDER BY created_at DESC', [board], (err, topics) => {
    if (err) {
      console.error('Erro ao buscar tópicos:', err.message);
      res.status(500).json({ error: 'Erro ao buscar tópicos' });
      return;
    }

    const topicsWithReplies = [];
    let completed = 0;

    if (topics.length === 0) {
      res.json([]);
      return;
    }

    topics.forEach((topic, index) => {
      db.all('SELECT * FROM replies WHERE topic_id = ?', [topic.id], (err, replies) => {
        if (err) {
          console.error('Erro ao buscar respostas:', err.message);
          res.status(500).json({ error: 'Erro ao buscar respostas' });
          return;
        }

        topicsWithReplies[index] = { ...topic, respostas: replies };
        completed++;

        if (completed === topics.length) {
          res.json(topicsWithReplies);
        }
      });
    });
  });
});

// Endpoint para criar um novo tópico
app.post('/api/topics', (req, res) => {
  const { board, nome, imagem, comentario } = req.body;

  if (!board || !nome || !comentario) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    return;
  }

  db.run(
    'INSERT INTO topics (board, nome, imagem, comentario) VALUES (?, ?, ?, ?)',
    [board, nome, imagem, comentario],
    function (err) {
      if (err) {
        console.error('Erro ao criar tópico:', err.message);
        res.status(500).json({ error: 'Erro ao criar tópico' });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Endpoint para adicionar uma resposta a um tópico
app.post('/api/replies', (req, res) => {
  const { topic_id, nome, texto } = req.body;

  if (!topic_id || !nome || !texto) {
    res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    return;
  }

  db.run(
    'INSERT INTO replies (topic_id, nome, texto) VALUES (?, ?, ?)',
    [topic_id, nome, texto],
    function (err) {
      if (err) {
        console.error('Erro ao criar resposta:', err.message);
        res.status(500).json({ error: 'Erro ao criar resposta' });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});