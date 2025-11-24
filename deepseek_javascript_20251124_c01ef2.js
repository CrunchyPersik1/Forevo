// server.js - сервер для мессенджера Forevo

// 📦 Подключаем библиотеки
const express = require('express');  // фреймворк для веб-сервера
const cors = require('cors');        // разрешаем запросы с фронтенда
const fs = require('fs');           // работа с файлами
const path = require('path');       // работа с путями файлов

const app = express();

// ⚙️ Настройки сервера
app.use(cors());                    // разрешаем все CORS запросы
app.use(express.json());           // понимаем JSON данные
app.use(express.static('public')); // раздаем файлы из папки public

// 📁 Файлы для хранения данных
const USERS_FILE = 'users.json';
const MESSAGES_FILE = 'messages.json';

// 🔧 Создаем файлы если их нет
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');

// 👤 РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
app.post('/api/register', (req, res) => {
  try {
    const { email, password, displayName, username, avatarColor } = req.body;
    
    console.log('📝 Регистрация:', email);
    
    // Читаем всех пользователей
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    
    // Проверяем нет ли такого email
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    
    // Проверяем нет ли такого юзернейма
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Юзернейм уже занят' });
    }
    
    // Создаем нового пользователя
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // ВНИМАНИЕ: в реальном приложении пароли нужно хэшировать!
      displayName,
      username,
      avatarColor: avatarColor || '#8b5cf6',
      createdAt: new Date().toISOString()
    };
    
    // Сохраняем пользователя
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    console.log('✅ Пользователь создан:', newUser.email);
    
    // Возвращаем данные (без пароля)
    const { password: _, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 👥 ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (для поиска)
app.get('/api/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE));
    
    // Убираем пароли из ответа
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
    
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 💬 ОТПРАВКА СООБЩЕНИЯ
app.post('/api/messages', (req, res) => {
  try {
    const { from, to, text } = req.body;
    
    console.log('💬 Новое сообщение:', { from, to, text });
    
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    
    const newMessage = {
      id: Date.now().toString(),
      from,
      to, 
      text,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    
    res.json(newMessage);
    
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 💬 ПОЛУЧИТЬ СООБЩЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ
app.get('/api/messages', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'Не указан userId' });
    }
    
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
    
    // Фильтруем сообщения где пользователь отправитель или получатель
    const userMessages = messages.filter(m => 
      m.from === userId || m.to === userId
    );
    
    res.json(userMessages);
    
  } catch (error) {
    console.error('❌ Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 🏠 Раздаем фронтенд
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📱 Открой: http://localhost:${PORT}`);
});