// --------------------
// index.js
// --------------------
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --------------------
// Conectar a MongoDB
// --------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error(err));

// --------------------
// Modelos
// --------------------

// Usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }
});
const User = mongoose.model('User', userSchema);

// Ejercicio
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// --------------------
// Rutas
// --------------------

// Página principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Crear un nuevo usuario
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username });
    const savedUser = await newUser.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    console.error('Error al crear el usuario:', err);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Listar todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).select('_id username');
    res.json(users);
  } catch (err) {
    console.error('Error al obtener los usuarios:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Agregar un ejercicio a un usuario
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newExercise = new Exercise({
      userId: _id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    });

    const savedExercise = await newExercise.save();

    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      _id: user._id,
      date: savedExercise.date.toDateString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el ejercicio' });
  }
});

// Obtener el log de ejercicios de un usuario
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Buscar ejercicios
    let exercises = await Exercise.find({ userId: _id }).sort({ date: 1 });

    // Filtrar por fechas
    if (from) {
      const fromDate = new Date(from);
      exercises = exercises.filter(e => e.date >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      exercises = exercises.filter(e => e.date <= toDate);
    }

    // Aplicar límite
    if (limit) exercises = exercises.slice(0, Number(limit));

    // Formatear log
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString()
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los logs' });
  }
});


// --------------------
// Iniciar servidor
// --------------------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port http://localhost:' + listener.address().port);
});
