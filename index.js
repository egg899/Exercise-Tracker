const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();




app.use(cors())
app.use(express.static('public'))

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.json());
// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error);

// Modelo de Usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {

  try{
    const { username } = req.body;
  // console.log('username:', username);
  // res.send('OK'); // Para que la request no quede colgada
  const newUser = new User({ username });
  // console.log(newUser);
  const savedUser = await newUser.save();

  console.log('Usuario guardado: ',savedUser);
  res.json(savedUser);
  } catch (err) {
    console.error('Error al crear el usuario:', err);
    res.status(500).json({error: 'Error al crear el usuario'})
  }
   
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

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

    // Respuesta correcta para FCC
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



app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    // Buscar el usuario
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Buscar ejercicios
    let query = { userId: _id };
    if (from || to) query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);

    // let exercises = await Exercise.find(query)
    //   .select('description duration date -_id')
    //   .sort({ date: 'asc' });
     let exercises = await Exercise.find(query)
      .sort({ date: 'asc' });

    if (limit) exercises = exercises.slice(0, Number(limit));

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




app.get('/', (req, res) => {
  
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port http://localhost:' + listener.address().port)
})
